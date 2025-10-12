export type BusinessUnit = "hotel" | "restaurant" | "spa" | "pool" | "bar";

export interface RevenueRow {
	date: string;
	unit: BusinessUnit;
	// Combined fields used by existing UI
	cash: number;
	bank: number;
	acquiring: number;
	// Detailed breakdown (optional)
	breakdown?: {
		bankLegal: number;
		bankIndividual: number;
		online: number;
		acquiringTerminal: number;
		cash: number;
	};
}

export interface ExpenseRow {
	date: string;
	unit: BusinessUnit;
	purchases: number;
	salaries: number;
	other: number;
	paymentMethod?: "cash" | "account"; // Наличные или по счету
}

export interface AggregatedDailyUnit {
	date: string;
	unit: BusinessUnit;
	revenue: {
		cash: number;
		bank: number;
		acquiring: number;
		total: number;
		breakdown?: { bankLegal: number; bankIndividual: number; online: number; acquiringTerminal: number; cash: number };
	};
	expense: { purchases: number; salaries: number; other: number; total: number };
	profit: number;
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
