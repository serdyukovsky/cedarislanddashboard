import { useEffect, useMemo, useState } from "react";
import type { AggregatedDailyUnit, BusinessUnit } from "@/server/types";

function isValidDate(dateString: string): boolean {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime()) && dateString.length === 10;
}

export interface FinanceFilters {
	unit: "all" | BusinessUnit;
	from?: string;
	to?: string;
	includeBreakfast?: boolean;
}

export function useFinanceData(filters: FinanceFilters) {
	const [data, setData] = useState<AggregatedDailyUnit[]>([]);
	const [lastModified, setLastModified] = useState<string | null>(null);
	const [revenueLastModified, setRevenueLastModified] = useState<string | null>(null);
	const [expenseLastModified, setExpenseLastModified] = useState<string | null>(null);
	const [breakfastInfo, setBreakfastInfo] = useState<{ count: number; amount: number } | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const qs = useMemo(() => {
		const params = new URLSearchParams();
		if (filters.unit) params.set("unit", filters.unit);
		if (filters.from) params.set("from", filters.from);
		if (filters.to) params.set("to", filters.to);
		if (filters.includeBreakfast !== undefined) params.set("includeBreakfast", filters.includeBreakfast.toString());
		return params.toString();
	}, [filters.unit, filters.from, filters.to, filters.includeBreakfast]);

	useEffect(() => {
		let ignore = false;
		async function run() {
			// Проверяем валидность дат перед запросом
			if (filters.from && !isValidDate(filters.from)) {
				console.warn("Invalid from date:", filters.from);
				return;
			}
			if (filters.to && !isValidDate(filters.to)) {
				console.warn("Invalid to date:", filters.to);
				return;
			}
			
			setLoading(true);
			setError(null);
			try {
				console.log("Fetching data from:", `/api/finance?${qs}`);
				const res = await fetch(`/api/finance?${qs}`, { cache: "no-store" });
				console.log("Response status:", res.status);
				console.log("Response headers:", Object.fromEntries(res.headers.entries()));
				
				if (!res.ok) {
					const errorText = await res.text();
					console.error("Response error:", errorText);
					throw new Error(`HTTP ${res.status}: ${errorText}`);
				}
				
				const responseText = await res.text();
				console.log("Response text length:", responseText.length);
				console.log("Response text preview:", responseText.substring(0, 200));
				
				if (!responseText.trim()) {
					throw new Error("Empty response from server");
				}
				
				const json = JSON.parse(responseText);
				console.log("Parsed JSON successfully, data length:", json.data?.length);
				
				if (!ignore) {
					setData(json.data);
					setLastModified(json.lastModified);
					setRevenueLastModified(json.revenueLastModified);
					setExpenseLastModified(json.expenseLastModified);
					setBreakfastInfo(json.breakfastInfo || null);
				}
			} catch (e: any) {
				console.error("Error in useFinanceData:", e);
				if (!ignore) setError(e?.message || "Unknown error");
			} finally {
				if (!ignore) setLoading(false);
			}
		}
		run();
		return () => {
			ignore = true;
		};
	}, [qs]);

	return { data, lastModified, revenueLastModified, expenseLastModified, breakfastInfo, loading, error };
}
