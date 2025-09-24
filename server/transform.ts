import { parseISO, isValid, formatISO } from "date-fns";
import { z } from "zod";
import { RevenueRow, ExpenseRow, AggregatedDailyUnit, BusinessUnit } from "./types";

const UnitMap: Record<string, BusinessUnit> = {
	"отель и бани": "hotel",
	"отель": "hotel",
	"бани": "hotel",
	"ресторан": "restaurant",
	"спа-центр": "spa",
	"спа": "spa",
	spa: "spa",
	hotel: "hotel",
	restaurant: "restaurant",
	pool: "pool",
	bar: "bar",
};

export function normalizeUnit(value: string): BusinessUnit {
	const key = value.trim().toLowerCase();
	const mapped = UnitMap[key];
	if (!mapped) throw new Error(`Unknown unit: ${value}`);
	return mapped;
}

export function normalizeDate(value: string | number | Date): string {
    // Reject empty
    if (value === null || value === undefined) throw new Error("Invalid date: empty");

	if (typeof value === "number") {
        // Accept only reasonable numeric date encodings; otherwise reject
        // Google Sheets serial date (days since 1899-12-30)
        if (value > 10000 && value < 100000) {
            const excelEpochUtc = Date.UTC(1899, 11, 30);
            const ms = excelEpochUtc + value * 24 * 60 * 60 * 1000;
            return formatISO(new Date(ms), { representation: "date" });
        }
        // Milliseconds since epoch
        if (value > 1e12) {
            return formatISO(new Date(value), { representation: "date" });
        }
        // Seconds since epoch
        if (value > 1e9 && value < 1e12) {
            return formatISO(new Date(value * 1000), { representation: "date" });
        }
        // Any other small integers (like day numbers, running totals) are rejected
        throw new Error(`Invalid numeric date: ${value}`);
    }

    const s = String(value).trim();
    if (!s) throw new Error("Invalid date: empty string");

    // Try ISO YYYY-MM-DD first
    const iso = parseISO(s);
    if (isValid(iso)) return formatISO(iso, { representation: "date" });

    // Interpret as MM.DD.YYYY or MM/DD/YYYY (month first - Revenue format)
    let m = s.match(/^([01]?\d)[./-]([0-3]?\d)[./-](\d{4})$/);
    if (m) {
        const mm = Number(m[1]);
        const dd = Number(m[2]);
        const yyyy = Number(m[3]);
        const d = new Date(Date.UTC(yyyy, mm - 1, dd));
        if (isValid(d)) return formatISO(d, { representation: "date" });
    }

    // Interpret as DD.MM.YYYY or DD/MM/YYYY (day first - Expense format)
    m = s.match(/^([0-3]?\d)[./-]([01]?\d)[./-](\d{4})$/);
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

    // Interpret as MM.DD.YY or MM/DD/YY (month first - Revenue format, assume 2000-2099)
    m = s.match(/^([01]?\d)[./-]([0-3]?\d)[./-](\d{2})$/);
    if (m) {
        const mm = Number(m[1]);
        const dd = Number(m[2]);
        const yy = Number(m[3]);
        const yyyy = 2000 + yy;
        const d = new Date(Date.UTC(yyyy, mm - 1, dd));
        if (isValid(d)) return formatISO(d, { representation: "date" });
    }

    // Interpret as DD.MM.YY or DD/MM/YY (day first - Expense format, assume 2000-2099)
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

    // Otherwise, reject to honor strict rule
	throw new Error(`Invalid date: ${value}`);
}

// Keep schemas only for coercion, not for tuple length enforcement
const numberCoerce = z.coerce.number().catch(0);

export function parseRevenueRows(values: any[][]): RevenueRow[] {
    const rows = Array.isArray(values) ? values.slice(1) : [];
    const result: RevenueRow[] = [];
    for (const r of rows) {
        if (!Array.isArray(r)) continue;
        // Skip empty or header-like rows
        const hasContent = r.some((v) => v !== undefined && v !== null && String(v).trim() !== "");
        if (!hasContent) continue;

        const c0 = r[0];
        const c1 = typeof r[1] === "string" ? r[1] : String(r[1] ?? "");
        const c2 = numberCoerce.parse(r[2]);
        const c3 = numberCoerce.parse(r[3]);
        const c4 = numberCoerce.parse(r[4]);
        const c5 = r[5];

        try {
            const row: RevenueRow = {
                date: normalizeDate(c0),
                unit: normalizeUnit(c1),
                cash: Number(c2 ?? 0),
                bank: Number(c3 ?? 0),
                acquiring: Number(c4 ?? 0),
            };
            if (c5 && typeof c5 === "object") {
                const br = c5 as any;
                row.breakdown = {
                    bankLegal: Number(br.bankLegal ?? 0),
                    bankIndividual: Number(br.bankIndividual ?? 0),
                    online: Number(br.online ?? 0),
                    acquiringTerminal: Number(br.acquiringTerminal ?? 0),
                    cash: Number(br.cash ?? row.cash ?? 0),
                };
            }
            result.push(row);
        } catch {
            // Skip rows with invalid date/unit
            continue;
        }
    }
    return result;
}

// TODO: Здесь будет новая логика парсинга расходов

// Интерфейсы для парсинга расходов
export interface ExpenseRecord {
	date: string;           // ISO дата (2025-01-01)
	unit: BusinessUnit;     // 'hotel' | 'restaurant' | 'spa' | 'pool'
	amount: number;         // сумма расхода
	category: string;       // статья расхода
	paymentMethod: 'cash' | 'account'; // источник оплаты
	originalDate: string;   // оригинальная дата из таблицы (для отладки)
	rowIndex: number;       // номер строки для отладки
}

export interface DetailedExpenseRow extends ExpenseRow {
	expenseDetails?: {
		cash: number;
		account: number;
		total: number;
		cashCount: number;
		accountCount: number;
		categories: string[];
		categoryDetails?: {
			category: string;
			amount: number;
			paymentMethod: 'cash' | 'account';
			rowIndex: number;
		}[];
	};
}

// Маппинг колонок для каждого листа и юнита
function getColumnMappings(sheetType: 'cash' | 'account') {
	if (sheetType === 'cash') {
		return {
			hotel: { date: 1, amount: 3, category: 4 },      // B, D, E
			restaurant: { date: 7, amount: 9, category: 10 }, // H, J, K
			spa: { date: 13, amount: 15, category: 16 },      // N, P, Q
			pool: { date: 19, amount: 21, category: 22 }      // T, V, W
		};
	} else {
		return {
			hotel: { date: 0, amount: 2, category: 3 },      // A, C, D
			restaurant: { date: 6, amount: 8, category: 9 },  // G, I, J
			spa: { date: 12, amount: 14, category: 15 }       // M, O, P
		};
	}
}

// Валидация даты в формате DD.MM.YYYY или DD.MM.YY
export function isValidExpenseDate(value: any): boolean {
	if (!value || typeof value !== 'string') {
		console.log(`❌ Invalid date type: ${typeof value}, value: "${value}"`);
		return false;
	}
	
	const trimmed = value.trim();
	
	// Проверяем формат DD.MM.YYYY или DD.MM.YY
	const datePattern = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/;
	const match = trimmed.match(datePattern);
	
	if (!match) {
		console.log(`❌ Date pattern validation failed for: "${trimmed}"`);
		return false;
	}
	
	const [, day, month, year] = match;
	let fullYear = year.length === 2 ? `20${year}` : year;
	console.log(`✅ Date validation passed for: "${trimmed}" -> DD: ${day}, MM: ${month}, YYYY: ${fullYear}`);
	
	// Дополнительная валидация диапазонов
	const dayNum = parseInt(day);
	const monthNum = parseInt(month);
	let yearNum = parseInt(fullYear);
	
	// Проверяем разумные диапазоны
	if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
		return false;
	}
	
	// Более гибкая проверка года
	if (yearNum < 2000 || yearNum > 2030) {
		// Попробуем исправить очевидно неправильные годы
		if (yearNum > 10000) {
			// Например, 5122 -> 2025 (последние 2 цифры)
			const correctedYear = 2000 + (yearNum % 100);
			if (correctedYear >= 2020 && correctedYear <= 2030) {
				fullYear = correctedYear.toString();
				yearNum = correctedYear;
			} else {
				return false;
			}
		} else if (yearNum < 100) {
			// Например, 25 -> 2025
			const correctedYear = 2000 + yearNum;
			if (correctedYear >= 2020 && correctedYear <= 2030) {
				fullYear = correctedYear.toString();
				yearNum = correctedYear;
			} else {
				return false;
			}
		} else if (yearNum > 1000 && yearNum < 10000) {
			// Например, 4771 -> 2025 (последние 2 цифры)
			const correctedYear = 2000 + (yearNum % 100);
			if (correctedYear >= 2020 && correctedYear <= 2030) {
				fullYear = correctedYear.toString();
				yearNum = correctedYear;
			} else {
				return false;
			}
		} else if (yearNum > 10000 && yearNum < 100000) {
			// Например, 20025 -> 2025 (убираем лишний 0)
			const correctedYear = Math.floor(yearNum / 10);
			if (correctedYear >= 2020 && correctedYear <= 2030) {
				fullYear = correctedYear.toString();
				yearNum = correctedYear;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
	
	// Проверяем валидность даты
	const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
	if (isNaN(date.getTime())) return false;
	
	// Проверяем, что дата действительно соответствует введенным значениям
	return date.getDate() === dayNum && 
		   date.getMonth() + 1 === monthNum && 
		   date.getFullYear() === yearNum;
}

// Парсинг суммы расхода
function parseExpenseAmount(value: any): number {
	if (value === null || value === undefined || value === '') return 0;
	
	const num = Number(value);
	return isNaN(num) || num < 0 ? 0 : num;
}

// Нормализация даты для расходов (DD.MM.YYYY -> YYYY-MM-DD)
function normalizeExpenseDate(dateStr: string): string {
	const datePattern = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/;
	const match = dateStr.trim().match(datePattern);
	
	if (!match) {
		console.log(`❌ Date pattern mismatch for: "${dateStr}"`);
		return '';
	}
	
	const [, day, month, year] = match;
	const fullYear = year.length === 2 ? `20${year}` : year;
	
	// Дополнительная валидация
	const dayNum = parseInt(day);
	const monthNum = parseInt(month);
	const yearNum = parseInt(fullYear);
	
	if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2020 || yearNum > 2030) {
		console.log(`❌ Date validation failed for: "${dateStr}" -> day: ${dayNum}, month: ${monthNum}, year: ${yearNum}`);
		return '';
	}
	
	const normalizedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
	console.log(`✅ Date normalized: "${dateStr}" -> "${normalizedDate}"`);
	
	// Проверяем, что дата действительно существует
	const testDate = new Date(normalizedDate);
	if (isNaN(testDate.getTime()) || 
		testDate.getDate() !== dayNum || 
		testDate.getMonth() + 1 !== monthNum || 
		testDate.getFullYear() !== yearNum) {
		return '';
	}
	
	return normalizedDate;
}

// Парсинг одного листа расходов
export function parseExpenseSheet(values: any[][], sheetType: 'cash' | 'account'): ExpenseRecord[] {
	console.log(`Parsing ${sheetType} sheet with ${values.length} rows`);
	
	const columnMappings = getColumnMappings(sheetType);
	console.log(`Column mappings for ${sheetType}:`, columnMappings);
	
	const results: ExpenseRecord[] = [];
	let processedRows = 0;
	let validRows = 0;
	let invalidDateCount = 0;
	let emptyRowCount = 0;
	
	// Логируем первые несколько строк для понимания структуры
	if (values.length > 1) {
		console.log(`First few rows of ${sheetType} sheet:`);
		for (let i = 1; i <= Math.min(5, values.length - 1); i++) {
			console.log(`Row ${i}:`, values[i].slice(0, 25)); // Показываем первые 25 колонок
		}
		
		// Логируем примеры строк с данными по отелю
		console.log(`\nSample hotel rows from ${sheetType} sheet:`);
		let hotelSampleCount = 0;
		for (let i = 1; i < values.length && hotelSampleCount < 3; i++) {
			const row = values[i];
			const hotelDate = row[columnMappings.hotel.date];
			const hotelAmount = row[columnMappings.hotel.amount];
			if (hotelDate && hotelAmount && typeof hotelDate === 'string' && hotelDate.trim()) {
				console.log(`Hotel row ${i}: date="${hotelDate}", amount="${hotelAmount}", full row:`, row.slice(0, 10));
				hotelSampleCount++;
			}
		}
	}
	
	for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
		const row = values[rowIndex];
		processedRows++;
		
		// Проверяем каждый юнит
		for (const [unit, columns] of Object.entries(columnMappings)) {
			const dateValue = row[columns.date];
			const amountValue = row[columns.amount];
			const categoryValue = row[columns.category];
			
			// Пропускаем пустые строки
			if (!dateValue && !amountValue && !categoryValue) {
				emptyRowCount++;
				continue;
			}
			
			// Валидация даты
			if (!isValidExpenseDate(dateValue)) {
				invalidDateCount++;
				// Логируем все данные из строк с некорректными датами
				if (dateValue && typeof dateValue === 'string' && dateValue.trim()) {
					console.log(`INVALID ROW for ${unit} in row ${rowIndex}:`);
					console.log(`  Date: "${dateValue}"`);
					console.log(`  Amount: "${amountValue}"`);
					console.log(`  Category: "${categoryValue}"`);
					console.log(`  Full row:`, row.slice(0, 25));
					console.log(`  Column indices - date: ${columns.date}, amount: ${columns.amount}, category: ${columns.category}`);
				}
				continue;
			}
			
			// Временно логируем все валидные даты для отладки
			if (unit === 'hotel' && sheetType === 'cash') {
				console.log(`Valid hotel date: "${dateValue}" -> normalized: ${normalizeExpenseDate(dateValue)}`);
			}
			
			// Парсинг суммы
			const amount = parseExpenseAmount(amountValue);
			if (amount <= 0) continue;
			
			// Нормализация даты
			const normalizedDate = normalizeExpenseDate(dateValue);
			if (!normalizedDate) {
				console.log(`Failed to normalize date for ${unit} in row ${rowIndex}: "${dateValue}"`);
				continue;
			}
			
			// Создание записи
			const record: ExpenseRecord = {
				date: normalizedDate,
				unit: unit as BusinessUnit,
				amount,
				category: categoryValue || 'Не указано',
				paymentMethod: sheetType,
				originalDate: String(dateValue),
				rowIndex
			};
			
			results.push(record);
			validRows++;
			
			// Логируем крупные расходы для отладки
			if (amount > 50000) {
				console.log(`Large expense: ${amount} on ${normalizedDate} for ${unit} from ${sheetType} sheet`);
			}
			
			// Временно логируем все записи по отелю для отладки
			if (unit === 'hotel' && sheetType === 'cash') {
				console.log(`Hotel cash expense: ${amount} on ${normalizedDate}, category: ${categoryValue}, row: ${rowIndex}`);
			}
		}
	}
	
	console.log(`Parsed ${results.length} expense records from ${sheetType} sheet (processed ${processedRows} rows, valid ${validRows} records, invalid dates: ${invalidDateCount}, empty rows: ${emptyRowCount})`);
	
	// Логируем статистику по юнитам
	const unitStats = results.reduce((acc, record) => {
		const key = record.unit;
		if (!acc[key]) acc[key] = { count: 0, total: 0 };
		acc[key].count++;
		acc[key].total += record.amount;
		return acc;
	}, {} as Record<string, { count: number; total: number }>);
	
	console.log(`Unit statistics for ${sheetType}:`, unitStats);
	
	return results;
}

// Агрегация расходов по датам и юнитам
function aggregateExpensesByDate(expenses: ExpenseRecord[]): Map<string, Map<string, ExpenseRecord[]>> {
	const aggregated = new Map<string, Map<string, ExpenseRecord[]>>();
	
	for (const expense of expenses) {
		const dateKey = expense.date;
		const unitKey = expense.unit;
		
		if (!aggregated.has(dateKey)) {
			aggregated.set(dateKey, new Map());
		}
		
		const dateMap = aggregated.get(dateKey)!;
		if (!dateMap.has(unitKey)) {
			dateMap.set(unitKey, []);
		}
		
		dateMap.get(unitKey)!.push(expense);
	}
	
	return aggregated;
}

// Объединение данных из двух листов в формат ExpenseRow
export function combineExpensesFromBothSheets(cashExpenses: ExpenseRecord[], accountExpenses: ExpenseRecord[]): DetailedExpenseRow[] {
	console.log(`Combining ${cashExpenses.length} cash and ${accountExpenses.length} account expenses`);
	
	const allExpenses = [...cashExpenses, ...accountExpenses];
	const aggregated = aggregateExpensesByDate(allExpenses);
	
	const results: DetailedExpenseRow[] = [];
	
	// Логируем статистику по юнитам для отладки
	const unitTotals: Record<string, { cash: number; account: number; total: number }> = {};
	
	for (const [date, unitMap] of aggregated) {
		for (const [unit, expenseList] of unitMap) {
			const cashAmount = expenseList
				.filter(e => e.paymentMethod === 'cash')
				.reduce((sum, e) => sum + e.amount, 0);
			
			const accountAmount = expenseList
				.filter(e => e.paymentMethod === 'account')
				.reduce((sum, e) => sum + e.amount, 0);
			
			const totalAmount = cashAmount + accountAmount;
			
			const cashCount = expenseList.filter(e => e.paymentMethod === 'cash').length;
			const accountCount = expenseList.filter(e => e.paymentMethod === 'account').length;
			const categories = [...new Set(expenseList.map(e => e.category))];
			
			// Создаем детальную информацию о каждой категории
			const categoryDetails = expenseList.map(e => ({
				category: e.category,
				amount: e.amount,
				paymentMethod: e.paymentMethod,
				rowIndex: e.rowIndex
			}));
			
			// Накапливаем статистику
			if (!unitTotals[unit]) {
				unitTotals[unit] = { cash: 0, account: 0, total: 0 };
			}
			unitTotals[unit].cash += cashAmount;
			unitTotals[unit].account += accountAmount;
			unitTotals[unit].total += totalAmount;
			
			results.push({
				date,
				unit: unit as BusinessUnit,
				purchases: 0,
				salaries: 0,
				other: totalAmount,
				expenseDetails: {
					cash: cashAmount,
					account: accountAmount,
					total: totalAmount,
					cashCount,
					accountCount,
					categories,
					categoryDetails
				}
			});
		}
	}
	
	console.log(`Created ${results.length} aggregated expense rows`);
	console.log(`Unit totals after combining:`, unitTotals);
	
	return results;
}

// Функция агрегации данных с учетом расходов
export function aggregateByDateUnit(revenues: RevenueRow[], expenses: DetailedExpenseRow[]): any[] {
	console.log(`Aggregating ${revenues.length} revenue records and ${expenses.length} expense records`);
	
	const key = (d: string, u: string) => `${d}__${u}`;
	const map = new Map<string, any>();

	// Агрегация выручки
	for (const r of revenues) {
		const k = key(r.date, r.unit);
		if (!map.has(k)) {
			map.set(k, {
				date: r.date,
				unit: r.unit,
				revenue: { cash: 0, bank: 0, acquiring: 0, total: 0 },
				expense: { purchases: 0, salaries: 0, other: 0, total: 0 },
				profit: 0,
			});
		}
		const item = map.get(k)!;
		item.revenue.cash += r.cash;
		item.revenue.bank += r.bank;
		item.revenue.acquiring += r.acquiring;
		const extraOnline = r.breakdown?.online ? Number(r.breakdown.online) : 0;
		item.revenue.total += r.cash + r.bank + r.acquiring + extraOnline;
		
		// Attach breakdown aggregated as well if present
		if (r.breakdown) {
			const prev = item.revenue.breakdown || { bankLegal: 0, bankIndividual: 0, online: 0, acquiringTerminal: 0, cash: 0 };
			item.revenue.breakdown = {
				bankLegal: prev.bankLegal + (r.breakdown.bankLegal || 0),
				bankIndividual: prev.bankIndividual + (r.breakdown.bankIndividual || 0),
				online: prev.online + (r.breakdown.online || 0),
				acquiringTerminal: prev.acquiringTerminal + (r.breakdown.acquiringTerminal || 0),
				cash: prev.cash + (r.breakdown.cash || 0),
			};
		}
	}

	// Агрегация расходов
	for (const e of expenses) {
		const k = key(e.date, e.unit);
		if (!map.has(k)) {
			map.set(k, {
				date: e.date,
				unit: e.unit,
				revenue: { cash: 0, bank: 0, acquiring: 0, total: 0 },
				expense: { purchases: 0, salaries: 0, other: 0, total: 0 },
				profit: 0,
			});
		}
		const item = map.get(k)!;
		item.expense.purchases += e.purchases;
		item.expense.salaries += e.salaries;
		item.expense.other += e.other;
		item.expense.total += e.purchases + e.salaries + e.other;
		
		// Сохраняем детализацию расходов
		if (e.expenseDetails) {
			item.expenseDetails = e.expenseDetails;
		}
	}

	// Расчет прибыли
	for (const item of map.values()) {
		item.profit = item.revenue.total - item.expense.total;
	}

	return Array.from(map.values()).sort((a, b) =>
		a.date === b.date ? a.unit.localeCompare(b.unit) : a.date.localeCompare(b.date)
	);
}
