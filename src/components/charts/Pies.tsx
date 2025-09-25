import type { AggregatedDailyUnit } from "@/server/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#16a34a", "#2563eb", "#8b5cf6"]; 

export function RevenuePie({ data }: { data: AggregatedDailyUnit[] }) {
	let cash = 0, bank = 0, acquiring = 0;
	for (const r of data) {
		cash += Number(r.revenue?.cash) || 0;
		bank += Number(r.revenue?.bank) || 0;
		acquiring += Number(r.revenue?.acquiring) || 0;
	}
	const rows = [
		{ name: "Наличные", value: cash },
		{ name: "Счет", value: bank },
		{ name: "Эквайринг", value: acquiring },
	];
	return (
		<div className="border rounded-lg p-3 bg-card">
			<h3 className="font-semibold mb-2 text-sm sm:text-base">Структура доходов</h3>
			<ResponsiveContainer width="100%" height={220}>
				<PieChart>
					<Pie 
						data={rows} 
						dataKey="value" 
						nameKey="name" 
						outerRadius={80}
						stroke="none"
						strokeWidth={0}
					>
						{rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
					</Pie>
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
						formatter={(v: number, name: string, props: any) => {
							const total = rows.reduce((sum, item) => sum + item.value, 0);
							const percentage = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
							return [`${v.toLocaleString("ru-RU")} ₽ (${percentage}%)`, name];
						}}
					/>
					<Legend wrapperStyle={{ fontSize: '12px' }} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}

// Функция для нормализации названий категорий
function normalizeCategoryName(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

export function ExpensePie({ data }: { data: AggregatedDailyUnit[] }) {
	// Инициализируем счетчики для трех категорий
	const categoryTotals = {
		fot: 0,      // ФОТ - расходы со статьей содержащей "ФОТ" и "Зп % специалиста" + "Трансфер для персонала"
		purchases: 0, // Закупки - "Продукты" + "Расходные материалы"
		other: 0      // Остальное - все остальные расходы
	};

	// Обрабатываем данные для группировки по категориям
	(Array.isArray(data) ? data : []).forEach(record => {
		const expenseDetails = (record as any).expenseDetails;
		if (expenseDetails && expenseDetails.categories && expenseDetails.total > 0) {
			const totalAmount = expenseDetails.total;
			const categories = expenseDetails.categories;
			
			// Распределяем сумму равномерно между всеми категориями для этого дня
			const amountPerCategory = categories.length > 0 ? totalAmount / categories.length : 0;
			
			categories.forEach((category: string) => {
				if (!category || category.trim() === '') return;
				
				const normalizedCategory = normalizeCategoryName(category);
				
				// ФОТ категории
				if (normalizedCategory.includes('фот') || 
						normalizedCategory.includes('зп') || 
						normalizedCategory.includes('специалист') ||
						normalizedCategory.includes('трансфер') ||
						normalizedCategory.includes('персонал')) {
					categoryTotals.fot += amountPerCategory;
				}
				// Закупки категории
				else if (normalizedCategory.includes('продукт') || 
								 normalizedCategory.includes('расходн') ||
								 normalizedCategory.includes('материал')) {
					categoryTotals.purchases += amountPerCategory;
				}
				// Остальное
				else {
					categoryTotals.other += amountPerCategory;
				}
			});
		}
	});

	const rows = [
		{ name: "ФОТ", value: categoryTotals.fot },
		{ name: "Закупки", value: categoryTotals.purchases },
		{ name: "Остальное", value: categoryTotals.other },
	];
	return (
		<div className="border rounded-lg p-3 bg-card">
			<h3 className="font-semibold mb-2 text-sm sm:text-base">Структура расходов</h3>
			<ResponsiveContainer width="100%" height={220}>
				<PieChart>
					<Pie 
						data={rows} 
						dataKey="value" 
						nameKey="name" 
						outerRadius={80}
						stroke="none"
						strokeWidth={0}
					>
						{rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
					</Pie>
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
						formatter={(v: number, name: string, props: any) => {
							const total = rows.reduce((sum, item) => sum + item.value, 0);
							const percentage = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
							return [`${v.toLocaleString("ru-RU")} ₽ (${percentage}%)`, name];
						}}
					/>
					<Legend wrapperStyle={{ fontSize: '12px' }} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}
