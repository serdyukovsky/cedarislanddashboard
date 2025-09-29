import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { readSheetValues, getSheetMetadata } from "./googleSheets.js";
import { parseRevenueRows, normalizeDate, parseExpenseSheet, combineExpensesFromBothSheets, aggregateByDateUnit } from "./transform.js";
import { parseISO, isValid, formatISO } from "date-fns";

// Специальная функция для парсинга дат завтраков в формате DD.MM.YYYY
function normalizeBreakfastDate(value: string): string {
    const s = String(value).trim();
    if (!s) throw new Error("Invalid date: empty string");

    // Try ISO YYYY-MM-DD first
    const iso = parseISO(s);
    if (isValid(iso)) return formatISO(iso, { representation: "date" });

    // Interpret as DD.MM.YYYY or DD/MM/YYYY (day first - Breakfast format)
    let m = s.match(/^([0-3]?\d)[./-]([01]?\d)[./-](\d{4})$/);
    if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yyyy = Number(m[3]);
        // Check if it's a valid date (day <= 31, month <= 12)
        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
            const d = new Date(Date.UTC(yyyy, mm - 1, dd));
            if (isValid(d)) return formatISO(d, { representation: "date" });
        }
    }

    // Interpret as DD.MM.YY or DD/MM/YY (day first - Breakfast format, assume 2000-2099)
    m = s.match(/^([0-3]?\d)[./-]([01]?\d)[./-](\d{2})$/);
    if (m) {
        const dd = Number(m[1]);
        const mm = Number(m[2]);
        const yy = Number(m[3]);
        const yyyy = 2000 + yy;
        // Check if it's a valid date (day <= 31, month <= 12)
        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
            const d = new Date(Date.UTC(yyyy, mm - 1, dd));
            if (isValid(d)) return formatISO(d, { representation: "date" });
        }
    }

    throw new Error(`Invalid breakfast date format: ${value}`);
}

// Кэш для данных
interface CacheEntry {
	data: any[];
	lastModified: string;
	revenueLastModified: string;
	expenseLastModified: string;
	breakfastLastModified: string;
	breakfastInfo: { count: number; amount: number } | null;
	timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 минут для production
const MAX_REQUESTS_PER_MINUTE = 10; // Ограничиваем количество запросов

let requestCount = 0;
let lastResetTime = Date.now();

function canMakeRequest(): boolean {
	const now = Date.now();
	if (now - lastResetTime > 60000) { // Сбрасываем счетчик каждую минуту
		requestCount = 0;
		lastResetTime = now;
	}
	return requestCount < MAX_REQUESTS_PER_MINUTE;
}

function incrementRequestCount(): void {
	requestCount++;
}

function getCacheKey(unit: string, from?: string, to?: string, includeBreakfast?: boolean): string {
	return `${unit}-${from || 'all'}-${to || 'all'}-${includeBreakfast ? 'breakfast' : 'nobreakfast'}`;
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

function setCachedData(key: string, data: any[], lastModified: string, revenueLastModified: string, expenseLastModified: string, breakfastLastModified: string, breakfastInfo: { count: number; amount: number } | null = null): void {
	cache.set(key, {
		data,
		lastModified,
		revenueLastModified,
		expenseLastModified,
		breakfastLastModified,
		breakfastInfo,
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
	'BREAKFAST_SHEET_ID',
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
		const includeBreakfast = req.query.includeBreakfast === 'true';

		// Проверяем кэш (пропускаем если есть параметр refresh)
		const cacheKey = getCacheKey(unit, from, to, includeBreakfast);
		const cachedData = req.query.refresh ? null : getCachedData(cacheKey);
		if (cachedData) {
			console.log("Returning cached data for key:", cacheKey);
			res.json({
				data: cachedData.data,
				lastModified: cachedData.lastModified,
				revenueLastModified: cachedData.revenueLastModified,
				expenseLastModified: cachedData.expenseLastModified,
				breakfastLastModified: cachedData.breakfastLastModified,
				breakfastInfo: cachedData.breakfastInfo
			});
			return;
		}

		// Проверяем лимит запросов
		if (!canMakeRequest()) {
			console.log("Rate limit exceeded, returning cached data if available");
			const fallbackCache = getCachedData("all-all-all"); // Используем общий кэш как fallback
			if (fallbackCache) {
				console.log("Returning fallback cached data due to rate limit");
				res.json({
					data: fallbackCache.data,
					lastModified: fallbackCache.lastModified,
					revenueLastModified: fallbackCache.revenueLastModified,
					expenseLastModified: fallbackCache.expenseLastModified,
					breakfastLastModified: fallbackCache.breakfastLastModified,
					breakfastInfo: fallbackCache.breakfastInfo
				});
				return;
			}
			return res.status(429).json({ 
				error: "Rate limit exceeded", 
				message: "Too many requests to Google Sheets API. Please try again later." 
			});
		}

		incrementRequestCount();

		const revenueSheetId = process.env.REVENUE_SHEET_ID as string;
		const expenseSheetId = process.env.EXPENSE_SHEET_ID as string;
		const breakfastSheetId = process.env.BREAKFAST_SHEET_ID as string;
		const revenueRange = process.env.REVENUE_RANGE || "A:E";
        const expenseRange = process.env.EXPENSE_RANGE || "A:Z";
        const breakfastRange = process.env.BREAKFAST_RANGE || "A:B";
        console.log(`Using expense range: ${expenseRange}`);
        console.log(`Using breakfast range: ${breakfastRange}`);
        const revenueSheetName = process.env.REVENUE_SHEET_NAME || "Выручка";
        const expenseSheetName = process.env.EXPENSE_SHEET_NAME || "Расходы";
        const breakfastSheetName = process.env.BREAKFAST_SHEET_NAME || "Лист1";
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

    // Читаем данные о завтраках
    let breakfastData: { [date: string]: number } = {};
    if (breakfastSheetId) {
        try {
            console.log("Reading breakfast data...");
            const breakfastRows = await readSheetValues(breakfastSheetId, `${breakfastSheetName}!${breakfastRange}`);
            console.log(`Breakfast data raw: ${breakfastRows.length} rows`);
            
               // Парсим данные о завтраках: столбец A - даты, столбец B - количество человек
               for (const row of breakfastRows) {
                   const dateStr = row[0];
                   const peopleCount = row[1];
                   
                   if (!dateStr || !peopleCount) continue;
                   
                   try {
                       // Для завтраков используем формат DD.MM.YYYY
                       const normalizedDate = normalizeBreakfastDate(dateStr);
                       const count = Number(peopleCount);
                       
                       if (!isNaN(count) && count > 0) {
                           breakfastData[normalizedDate] = count;
                       }
                   } catch (e) {
                       console.log(`Failed to parse breakfast date: ${dateStr}`, e);
                       // Пропускаем невалидные даты
                       continue;
                   }
               }
            
            console.log(`Parsed ${Object.keys(breakfastData).length} breakfast records`);
        } catch (e) {
            console.error("Failed to read breakfast sheet:", e);
            console.error("Error stack:", e.stack);
        }
    }
		console.log("Aggregating data...");
		// Используем полную функцию агрегации с учетом расходов и завтраков
		let data = aggregateByDateUnit(revenues, expenses, breakfastData, includeBreakfast);
		
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
		let breakfastLastModified: string | null = null;
		
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

		try {
			if (breakfastSheetId) {
				const metadata = await getSheetMetadata(breakfastSheetId);
				breakfastLastModified = metadata.modifiedTime || null;
			}
		} catch (e) {
			console.warn("Failed to get breakfast sheet metadata:", e);
		}

		console.log("Sending response with", data.length, "records");
		console.log("Response data sample:", data.slice(0, 2));
		
		// Подсчитываем информацию о завтраках для ресторана
		let breakfastInfo = null;
		if (includeBreakfast && breakfastData) {
			// Подсчитываем общее количество завтраков и сумму
			let totalBreakfastCount = 0;
			let totalBreakfastAmount = 0;
			
			// Фильтруем данные о завтраках по выбранному периоду
			const filteredBreakfastData = Object.entries(breakfastData).filter(([date, count]) => {
				if (from && date < from) return false;
				if (to && date > to) return false;
				return true;
			});
			
			for (const [date, count] of filteredBreakfastData) {
				totalBreakfastCount += count;
				totalBreakfastAmount += count * 700; // 700 рублей за завтрак
			}
			
			if (totalBreakfastCount > 0) {
				breakfastInfo = {
					count: totalBreakfastCount,
					amount: totalBreakfastAmount
				};
				console.log(`Breakfast info: ${totalBreakfastCount} people, ${totalBreakfastAmount} rubles`);
			} else {
				console.log('No breakfast data for selected period');
			}
		}

		const responseData = { 
			data, 
			lastModified: revenueLastModified,
			revenueLastModified,
			expenseLastModified,
			breakfastLastModified,
			breakfastInfo
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
		setCachedData(cacheKey, data, revenueLastModified || "", revenueLastModified || "", expenseLastModified || "", breakfastLastModified || "", breakfastInfo);
		console.log("Data cached for key:", cacheKey);
		
		res.json(responseData);
		console.log("Response sent successfully");
	} catch (e: any) {
		console.error("Server error:", e);
		console.error("Error stack:", e?.stack);
		
		// Обработка ошибки квоты Google Sheets API
		if (e?.message?.includes("Quota exceeded")) {
			console.log("Google Sheets API quota exceeded, trying to return cached data");
			const cacheKey = getCacheKey(req.query.unit as string || "all", req.query.from as string, req.query.to as string, req.query.includeBreakfast === 'true');
			const cachedData = getCachedData(cacheKey);
			if (cachedData) {
				console.log("Returning cached data due to quota exceeded");
				res.json({
					data: cachedData.data,
					lastModified: cachedData.lastModified,
					revenueLastModified: cachedData.revenueLastModified,
					expenseLastModified: cachedData.expenseLastModified,
					breakfastLastModified: cachedData.breakfastLastModified,
					breakfastInfo: cachedData.breakfastInfo
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
