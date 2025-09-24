import type { AggregatedDailyUnit } from "@/server/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function UnitsBars({ data }: { data: AggregatedDailyUnit[] }) {
	const sums = { hotel: { revenue: 0, expense: 0, profit: 0 }, restaurant: { revenue: 0, expense: 0, profit: 0 }, spa: { revenue: 0, expense: 0, profit: 0 }, pool: { revenue: 0, expense: 0, profit: 0 }, bar: { revenue: 0, expense: 0, profit: 0 } } as const;
	const acc: any = { hotel: { ...sums.hotel }, restaurant: { ...sums.restaurant }, spa: { ...sums.spa }, pool: { ...sums.pool }, bar: { ...sums.bar } };
	for (const r of data) {
		const u = acc[r.unit];
		if (u) {
			u.revenue += Number(r.revenue?.total) || 0;
			u.expense += Number(r.expense?.total) || 0;
			u.profit += Number(r.profit) || 0;
		}
	}
	const rows = [
		{ unit: "Отель и бани", ...acc.hotel },
		{ unit: "Ресторан", ...acc.restaurant },
		{ unit: "Спа-центр", ...acc.spa },
		...(acc.pool.revenue > 0 ? [{ unit: "Бассейн", ...acc.pool }] : []),
		...(acc.bar.revenue > 0 ? [{ unit: "Бар", ...acc.bar }] : []),
	];

	return (
		<div className="border rounded-lg p-3 bg-card">
			<h3 className="font-semibold mb-2">Сравнение юнитов</h3>
			<ResponsiveContainer width="100%" height={320}>
				<BarChart data={rows}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="unit" tick={{ fontSize: 12 }} />
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
					<Bar dataKey="revenue" name="Доходы" fill="#22c55e" />
					<Bar dataKey="expense" name="Расходы" fill="#f97316" />
					<Bar dataKey="profit" name="Прибыль" fill="#3b82f6" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
