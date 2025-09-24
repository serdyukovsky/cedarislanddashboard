import type { AggregatedDailyUnit } from "@/server/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function DailyLines({ data }: { data: AggregatedDailyUnit[] }) {
	const byDate = new Map<string, { date: string; revenue: number; expense: number; profit: number }>();
	for (const r of data) {
		if (!byDate.has(r.date)) byDate.set(r.date, { date: r.date, revenue: 0, expense: 0, profit: 0 });
		const d = byDate.get(r.date)!;
		d.revenue += Number(r.revenue?.total) || 0;
		d.expense += Number(r.expense?.total) || 0;
		d.profit += Number(r.profit) || 0;
	}
	const rows = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

	return (
		<div className="border rounded-lg p-3 bg-card">
			<h3 className="font-semibold mb-2">Динамика доходов/расходов/прибыли</h3>
			<ResponsiveContainer width="100%" height={320}>
				<LineChart data={rows}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="date" tick={{ fontSize: 12 }} />
					<YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
					<Tooltip 
						contentStyle={{
							backgroundColor: 'rgba(255, 255, 255, 0.4)',
							border: '1px solid rgba(0, 0, 0, 0.1)',
							borderRadius: '12px',
							backdropFilter: 'blur(20px)',
							fontSize: '12px',
							padding: '8px 12px',
							boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
						}}
						formatter={(v: number) => `${v.toLocaleString("ru-RU")} ₽`} 
					/>
					<Legend />
					<Line type="monotone" dataKey="revenue" name="Доходы" stroke="#16a34a" strokeWidth={2} dot={false} />
					<Line type="monotone" dataKey="expense" name="Расходы" stroke="#ef4444" strokeWidth={2} dot={false} />
					<Line type="monotone" dataKey="profit" name="Прибыль" stroke="#2563eb" strokeWidth={2} dot={false} />
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
