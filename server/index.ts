import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { readSheetValues, getSheetMetadata } from "../src/server/googleSheets";
import { parseRevenueRows, normalizeDate, parseExpenseSheet, combineExpensesFromBothSheets, aggregateByDateUnit } from "../src/server/transform";

// Кэш для данных
interface CacheEntry {
	data: any[];
	lastModified: string;
	revenueLastModified: string;
	expenseLastModified: string;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

function getCacheKey(unit: string, from?: string, to?: string): string {
	return `${unit}-${from || 'all'}-${to || 'all'}`;
}

function getCachedData(key: string): CacheEntry | null {
	const entry = cache.get(key);
	if (!entry) return null;
	
	const now = Date.now();
	if (now - entry.timestamp > CACHE_DURATION) {
		cache.delete(key);
		return null;
	}
	
	return entry;
}

function setCachedData(key: string, data: any[], lastModified: string, revenueLastModified: string, expenseLastModified: string): void {
	cache.set(key, {
		data,
		lastModified,
		revenueLastModified,
		expenseLastModified,
		timestamp: Date.now()
	});
}

// Prefer .env.local if present, otherwise fallback to .env
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
	dotenv.config({ path: envLocalPath });
} else {
	dotenv.config();
}

// Проверяем наличие обязательных переменных окружения
const requiredEnvVars = [
	'REVENUE_SHEET_ID',
	'EXPENSE_SHEET_ID',
	'GOOGLE_SERVICE_ACCOUNT_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
	console.error('❌ Missing required environment variables:', missingVars);
	console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SHEET') || key.includes('GOOGLE')));
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/finance", async (req, res) => {
	try {
		console.log("API request received:", req.query);
		
		// Проверяем переменные окружения
		if (missingVars.length > 0) {
			console.error('❌ Missing environment variables:', missingVars);
			return res.status(500).json({ 
				error: "Server configuration error", 
				details: `Missing: ${missingVars.join(', ')}` 
			});
		}
		
		const unit = (req.query.unit as string) || "all";
		const from = (req.query.from as string) || undefined;
		const to = (req.query.to as string) || undefined;

		// Проверяем кэш (пропускаем если есть параметр refresh)
		const cacheKey = getCacheKey(unit, from, to);
		const cachedData = req.query.refresh ? null : getCachedData(cacheKey);
		if (cachedData) {
			console.log("Returning cached data for key:", cacheKey);
			res.json({
				data: cachedData.data,
				lastModified: cachedData.lastModified,
				revenueLastModified: cachedData.revenueLastModified,
				expenseLastModified: cachedData.expenseLastModified
			});
			return;
		}

		const revenueSheetId = process.env.REVENUE_SHEET_ID as string;
		const expenseSheetId = process.env.EXPENSE_SHEET_ID as string;
		const revenueRange = process.env.REVENUE_RANGE || "A:E";
        const expenseRange = process.env.EXPENSE_RANGE || "A:Z";
        console.log(`Using expense range: ${expenseRange}`);
        const revenueSheetName = process.env.REVENUE_SHEET_NAME || "Выручка";
        const expenseSheetName = process.env.EXPENSE_SHEET_NAME || "Расходы";
    if (!revenueSheetId && !expenseSheetId) {
			return res.status(500).json({ error: "Missing sheet IDs" });
		}

    // Build revenues from specific blocks inside the revenue sheet if provided
    let revenues: ReturnType<typeof parseRevenueRows> = [];
    if (revenueSheetId) {
        console.log("Fetching data from Google Sheets...");
        const [hotelBlock, restaurantBlock, spaBlock, poolBlock, barBlock] = await Promise.all([
            readSheetValues(revenueSheetId, `${revenueSheetName}!B:G`),
            readSheetValues(revenueSheetId, `${revenueSheetName}!J:M`),
            readSheetValues(revenueSheetId, `${revenueSheetName}!P:S`),
            readSheetValues(revenueSheetId, `${revenueSheetName}!V:Y`), // Pool: V(date), W(skip), X(acquiring), Y(cash)
            readSheetValues(revenueSheetId, `${revenueSheetName}!AB:AE`), // Bar: AB(date), AC(skip), AD(acquiring), AE(cash)
        ]);

        const synthetic: any[][] = [["date", "unit", "cash", "bank", "acquiring", "breakdown"]];

        // Hotel/Bath: B(date), C(bank1), D(bank2), E(online services), F(acquiring terminal), G(cash)
        for (const r of hotelBlock) {
            const date = r[0];
            // Skip row entirely if date invalid/empty
            try { normalizeDate(date); } catch { continue; }
            // Skip if any money cell has non-numeric text (allow empty => 0)
            const moneyCells = [r[1], r[2], r[3], r[4], r[5]];
            const bad = moneyCells.some((v) => {
                if (v === undefined || v === null) return false;
                const s = String(v).trim();
                if (s === "") return false;
                const n = Number(s.replace(/\s/g, '').replace(',', '.'));
                return Number.isNaN(n);
            });
            if (bad) continue;
            const bank = Number(r[1] ?? 0) + Number(r[2] ?? 0);
            const online = Number(r[3] ?? 0);
            const acquiringTerminal = Number(r[4] ?? 0);
            const acquiring = acquiringTerminal; // keep online separate
            const cash = Number(r[5] ?? 0);
            const breakdown = { bankLegal: Number(r[1] ?? 0), bankIndividual: Number(r[2] ?? 0), online, acquiringTerminal, cash };
            synthetic.push([date, "hotel", cash, bank, acquiring, breakdown]);
        }

        // Restaurant: J(date), K(bank), L(acquiring), M(cash)
        for (const r of restaurantBlock) {
            const date = r[0];
            try { normalizeDate(date); } catch { continue; }
            const moneyCells = [r[1], r[2], r[3]];
            const bad = moneyCells.some((v) => {
                if (v === undefined || v === null) return false;
                const s = String(v).trim();
                if (s === "") return false;
                const n = Number(s.replace(/\s/g, '').replace(',', '.'));
                return Number.isNaN(n);
            });
            if (bad) continue;
            const bank = Number(r[1] ?? 0);
            const acquiring = Number(r[2] ?? 0);
            const cash = Number(r[3] ?? 0);
            const breakdown = { bankLegal: bank, bankIndividual: 0, online: 0, acquiringTerminal: acquiring, cash };
            synthetic.push([date, "restaurant", cash, bank, acquiring, breakdown]);
        }

        // Spa: P(date), Q(bank), R(acquiring), S(cash)
        for (const r of spaBlock) {
            const date = r[0];
            try { normalizeDate(date); } catch { continue; }
            const moneyCells = [r[1], r[2], r[3]];
            const bad = moneyCells.some((v) => {
                if (v === undefined || v === null) return false;
                const s = String(v).trim();
                if (s === "") return false;
                const n = Number(s.replace(/\s/g, '').replace(',', '.'));
                return Number.isNaN(n);
            });
            if (bad) continue;
            const bank = Number(r[1] ?? 0);
            const acquiring = Number(r[2] ?? 0);
            const cash = Number(r[3] ?? 0);
            const breakdown = { bankLegal: bank, bankIndividual: 0, online: 0, acquiringTerminal: acquiring, cash };
            synthetic.push([date, "spa", cash, bank, acquiring, breakdown]);
        }

        // Pool: V(date), W(skip), X(acquiring), Y(cash)
        for (const r of poolBlock) {
            const date = r[0];
            try { normalizeDate(date); } catch { continue; }
            const moneyCells = [r[2], r[3]]; // Only check acquiring (X) and cash (Y)
            const bad = moneyCells.some((v) => {
                if (v === undefined || v === null) return false;
                const s = String(v).trim();
                if (s === "") return false;
                const n = Number(s.replace(/\s/g, '').replace(',', '.'));
                return Number.isNaN(n);
            });
            if (bad) continue;
            const bank = 0; // No bank payments for pool
            const acquiring = Number(r[2] ?? 0); // Column X
            const cash = Number(r[3] ?? 0); // Column Y
            const breakdown = { bankLegal: 0, bankIndividual: 0, online: 0, acquiringTerminal: acquiring, cash };
            synthetic.push([date, "pool", cash, bank, acquiring, breakdown]);
        }

        // Bar: AB(date), AC(skip), AD(acquiring), AE(cash)
        for (const r of barBlock) {
            const date = r[0];
            try { normalizeDate(date); } catch { continue; }
            const moneyCells = [r[2], r[3]]; // Only check acquiring (AD) and cash (AE)
            const bad = moneyCells.some((v) => {
                if (v === undefined || v === null) return false;
                const s = String(v).trim();
                if (s === "") return false;
                const n = Number(s.replace(/\s/g, '').replace(',', '.'));
                return Number.isNaN(n);
            });
            if (bad) continue;
            const bank = 0; // No bank payments for bar
            const acquiring = Number(r[2] ?? 0); // Column AD
            const cash = Number(r[3] ?? 0); // Column AE
            const breakdown = { bankLegal: 0, bankIndividual: 0, online: 0, acquiringTerminal: acquiring, cash };
            synthetic.push([date, "bar", cash, bank, acquiring, breakdown]);
        }


        console.log("Parsing revenue data...");
        revenues = parseRevenueRows(synthetic);
        console.log("Revenue data parsed successfully");
    }

    // TODO: Здесь будет новая логика чтения расходов
    let expenses: any[] = [];
    if (expenseSheetId) {
        try {
            console.log("Reading cash expenses...");
            const cashExpenses = await readSheetValues(expenseSheetId, `наличные!${expenseRange}`);
            console.log(`Cash expenses raw data: ${cashExpenses.length} rows`);
            console.log(`Cash expenses range: наличные!${expenseRange}`);
            
            console.log("Reading account expenses...");
            const accountExpenses = await readSheetValues(expenseSheetId, `Счет!${expenseRange}`);
            console.log(`Account expenses raw data: ${accountExpenses.length} rows`);
            
            // Парсинг расходов из двух листов
            console.log("Parsing cash expenses...");
            const cashExpenseRecords = parseExpenseSheet(cashExpenses, 'cash');
            
            console.log("Parsing account expenses...");
            const accountExpenseRecords = parseExpenseSheet(accountExpenses, 'account');
            
            console.log("Combining expenses from both sheets...");
            expenses = combineExpensesFromBothSheets(cashExpenseRecords, accountExpenseRecords);
            console.log(`Total expenses: ${expenses.length} records`);
        } catch (e) {
            console.error("Failed to read expense sheets:", e);
            console.error("Error stack:", e.stack);
        }
    }
		console.log("Aggregating data...");
		// Используем полную функцию агрегации с учетом расходов
		let data = aggregateByDateUnit(revenues, expenses);
		
		// Логируем данные до фильтрации
		console.log(`Data before filtering: ${data.length} records`);
		if (data.length > 0) {
			const sampleDates = data.slice(0, 5).map(d => d.date);
			console.log(`Sample dates before filtering:`, sampleDates);
		}
		
		if (from) {
			console.log(`Filtering from date: ${from}`);
			const beforeFilter = data.length;
			data = data.filter((d) => d.date >= from);
			console.log(`After from filter: ${beforeFilter} -> ${data.length} records`);
			
			// Логируем образцы дат после фильтрации
			if (data.length > 0) {
				const sampleDates = data.slice(0, 5).map(d => d.date);
				console.log(`Sample dates after from filter:`, sampleDates);
			}
		}
		if (to) {
			console.log(`Filtering to date: ${to}`);
			const beforeFilter = data.length;
			data = data.filter((d) => d.date <= to);
			console.log(`After to filter: ${beforeFilter} -> ${data.length} records`);
			
			// Логируем образцы дат после фильтрации
			if (data.length > 0) {
				const sampleDates = data.slice(0, 5).map(d => d.date);
				console.log(`Sample dates after to filter:`, sampleDates);
			}
		}
		
		console.log(`Data after filtering: ${data.length} records`);
		if (unit && unit !== "all") data = data.filter((d) => d.unit === unit);
		
		// Логируем количество записей для отладки
		console.log(`Final data count: ${data.length} records`);

		// Get sheet metadata for last modified time
		let revenueLastModified: string | null = null;
		let expenseLastModified: string | null = null;
		
		try {
			if (revenueSheetId) {
				const metadata = await getSheetMetadata(revenueSheetId);
				revenueLastModified = metadata.modifiedTime || null;
			}
		} catch (e) {
			console.warn("Failed to get revenue sheet metadata:", e);
		}

		try {
			if (expenseSheetId) {
				const metadata = await getSheetMetadata(expenseSheetId);
				expenseLastModified = metadata.modifiedTime || null;
			}
		} catch (e) {
			console.warn("Failed to get expense sheet metadata:", e);
		}

		console.log("Sending response with", data.length, "records");
		console.log("Response data sample:", data.slice(0, 2));
		
		const responseData = { 
			data, 
			lastModified: revenueLastModified,
			revenueLastModified,
			expenseLastModified
		};
		
		// Проверяем, что JSON валиден
		try {
			const jsonString = JSON.stringify(responseData);
			console.log("JSON string length:", jsonString.length);
			console.log("JSON preview:", jsonString.substring(0, 200));
			
			// Проверяем, что JSON можно распарсить обратно
			JSON.parse(jsonString);
			console.log("JSON validation successful");
		} catch (jsonError) {
			console.error("JSON validation failed:", jsonError);
			res.status(500).json({ error: "Invalid JSON data" });
			return;
		}
		
		// Сохраняем в кэш
		setCachedData(cacheKey, data, revenueLastModified || "", revenueLastModified || "", expenseLastModified || "");
		console.log("Data cached for key:", cacheKey);
		
		res.json(responseData);
		console.log("Response sent successfully");
	} catch (e: any) {
		console.error("Server error:", e);
		console.error("Error stack:", e?.stack);
		
		// Обработка ошибки квоты Google Sheets API
		if (e?.message?.includes("Quota exceeded")) {
			console.log("Google Sheets API quota exceeded, trying to return cached data");
			const cacheKey = getCacheKey(req.query.unit as string || "all", req.query.from as string, req.query.to as string);
			const cachedData = getCachedData(cacheKey);
			if (cachedData) {
				console.log("Returning cached data due to quota exceeded");
				res.json({
					data: cachedData.data,
					lastModified: cachedData.lastModified,
					revenueLastModified: cachedData.revenueLastModified,
					expenseLastModified: cachedData.expenseLastModified
				});
				return;
			}
		}
		
		// Обработка ошибок аутентификации Google
		if (e?.message?.includes("authentication") || e?.message?.includes("credentials")) {
			console.error("Google authentication error");
			return res.status(500).json({ 
				error: "Authentication error", 
				message: "Google Sheets authentication failed. Check service account credentials."
			});
		}
		
		res.status(500).json({ 
			error: "Internal server error", 
			message: e?.message || "Unknown error",
			details: process.env.NODE_ENV === 'development' ? e?.stack : undefined
		});
	}
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
	console.log(`Server listening on http://localhost:${port}`);
});
