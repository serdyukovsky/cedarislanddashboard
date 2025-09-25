import type { AggregatedDailyUnit } from "@/server/types";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

const COLORS = ["#16a34a", "#2563eb", "#8b5cf6"]; 

export function RevenuePie({ data }: { data: AggregatedDailyUnit[] }) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [showCustomTooltip, setShowCustomTooltip] = useState(false);
	const [tooltipContent, setTooltipContent] = useState<any>(null);
	
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

	const handleLegendClick = (index: number) => {
		setActiveIndex(activeIndex === index ? null : index);
		
		// Показываем подсказку при клике на легенду
		if (activeIndex !== index) {
			const total = rows.reduce((sum, item) => sum + item.value, 0);
			const percentage = total > 0 ? ((rows[index].value / total) * 100).toFixed(1) : 0;
			
			setTooltipContent({
				name: rows[index].name,
				value: rows[index].value,
				percentage: percentage,
				color: COLORS[index % COLORS.length]
			});
			setShowCustomTooltip(true);
			
			// Автоматически скрываем через 3 секунды
			setTimeout(() => {
				setShowCustomTooltip(false);
			}, 3000);
		} else {
			setShowCustomTooltip(false);
		}
	};

	const handlePieClick = (data: any, index: number) => {
		setActiveIndex(activeIndex === index ? null : index);
	};

	const CustomLegend = ({ payload }: any) => {
		return (
			<div className="flex justify-center gap-4 mt-2">
				{payload.map((entry: any, index: number) => (
					<div
						key={entry.value}
						className="flex items-center gap-1 cursor-pointer transition-all duration-300"
						onClick={() => handleLegendClick(index)}
						style={{
							opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1,
							fontWeight: activeIndex === index ? 'bold' : 'normal'
						}}
					>
						<div
							className="w-3 h-3 rounded-full transition-all duration-300"
							style={{ 
								backgroundColor: entry.color,
								transform: activeIndex === index ? 'scale(1.2)' : 'scale(1)',
								boxShadow: activeIndex === index ? `0 0 8px ${entry.color}40` : 'none'
							}}
						/>
						<span className="text-xs transition-all duration-300" style={{
							color: activeIndex === index ? entry.color : 'inherit',
							fontWeight: activeIndex === index ? 'bold' : 'normal'
						}}>
							{entry.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="border rounded-lg p-3 bg-card relative">
			<h3 className="font-semibold mb-2 text-sm sm:text-base">Структура доходов</h3>
			
			{/* Кастомная подсказка */}
			{showCustomTooltip && tooltipContent && (
				<div 
					className="absolute z-10 bg-white/90 border border-gray-200 rounded-xl shadow-xl p-3 backdrop-blur-sm"
					style={{
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						fontSize: '12px',
						minWidth: '120px',
						textAlign: 'center'
					}}
				>
					<p className="font-medium text-sm mb-1" style={{ color: tooltipContent.color }}>
						{tooltipContent.name}
					</p>
					<p className="text-xs text-gray-600">
						{tooltipContent.value.toLocaleString("ru-RU")} ₽ ({tooltipContent.percentage}%)
					</p>
				</div>
			)}
			
			<ResponsiveContainer width="100%" height={220}>
				<PieChart>
					<Pie 
						data={rows} 
						dataKey="value" 
						nameKey="name" 
						outerRadius={80}
						innerRadius={0}
						stroke="none"
						strokeWidth={0}
						onClick={handlePieClick}
						activeIndex={activeIndex}
					>
						{rows.map((_, i) => {
							const isActive = activeIndex === i;
							const RADIAN = Math.PI / 180;
							// Вычисляем средний угол для этой дольки
							const totalValue = rows.reduce((sum, item) => sum + item.value, 0);
							const startAngle = rows.slice(0, i).reduce((sum, item) => sum + (item.value / totalValue) * 360, 0);
							const endAngle = startAngle + (rows[i].value / totalValue) * 360;
							const midAngle = (startAngle + endAngle) / 2;
							
							const sin = Math.sin(-RADIAN * midAngle);
							const cos = Math.cos(-RADIAN * midAngle);
							
							// Анимация выезжания только для активного элемента
							const offsetX = isActive ? cos * 15 : 0;
							const offsetY = isActive ? sin * 15 : 0;
							
							return (
								<Cell 
									key={i} 
									fill={COLORS[i % COLORS.length]} 
									stroke="none"
									strokeWidth={0}
									style={{
										cursor: 'pointer',
										filter: activeIndex !== null && !isActive ? 'opacity(0.6)' : 'none',
										transition: 'all 0.4s ease',
										transform: `translate(${offsetX}px, ${offsetY}px)`
									}}
								/>
							);
						})}
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
					<Legend content={<CustomLegend />} />
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
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [showCustomTooltip, setShowCustomTooltip] = useState(false);
	const [tooltipContent, setTooltipContent] = useState<any>(null);
	
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

	const handleLegendClick = (index: number) => {
		setActiveIndex(activeIndex === index ? null : index);
		
		// Показываем подсказку при клике на легенду
		if (activeIndex !== index) {
			const total = rows.reduce((sum, item) => sum + item.value, 0);
			const percentage = total > 0 ? ((rows[index].value / total) * 100).toFixed(1) : 0;
			
			setTooltipContent({
				name: rows[index].name,
				value: rows[index].value,
				percentage: percentage,
				color: COLORS[index % COLORS.length]
			});
			setShowCustomTooltip(true);
			
			// Автоматически скрываем через 3 секунды
			setTimeout(() => {
				setShowCustomTooltip(false);
			}, 3000);
		} else {
			setShowCustomTooltip(false);
		}
	};

	const handlePieClick = (data: any, index: number) => {
		setActiveIndex(activeIndex === index ? null : index);
	};

	const CustomLegend = ({ payload }: any) => {
		return (
			<div className="flex justify-center gap-4 mt-2">
				{payload.map((entry: any, index: number) => (
					<div
						key={entry.value}
						className="flex items-center gap-1 cursor-pointer transition-all duration-300"
						onClick={() => handleLegendClick(index)}
						style={{
							opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1,
							fontWeight: activeIndex === index ? 'bold' : 'normal'
						}}
					>
						<div
							className="w-3 h-3 rounded-full transition-all duration-300"
							style={{ 
								backgroundColor: entry.color,
								transform: activeIndex === index ? 'scale(1.2)' : 'scale(1)',
								boxShadow: activeIndex === index ? `0 0 8px ${entry.color}40` : 'none'
							}}
						/>
						<span className="text-xs transition-all duration-300" style={{
							color: activeIndex === index ? entry.color : 'inherit',
							fontWeight: activeIndex === index ? 'bold' : 'normal'
						}}>
							{entry.value}
						</span>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="border rounded-lg p-3 bg-card relative">
			<h3 className="font-semibold mb-2 text-sm sm:text-base">Структура расходов</h3>
			
			{/* Кастомная подсказка */}
			{showCustomTooltip && tooltipContent && (
				<div 
					className="absolute z-10 bg-white/90 border border-gray-200 rounded-xl shadow-xl p-3 backdrop-blur-sm"
					style={{
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						fontSize: '12px',
						minWidth: '120px',
						textAlign: 'center'
					}}
				>
					<p className="font-medium text-sm mb-1" style={{ color: tooltipContent.color }}>
						{tooltipContent.name}
					</p>
					<p className="text-xs text-gray-600">
						{tooltipContent.value.toLocaleString("ru-RU")} ₽ ({tooltipContent.percentage}%)
					</p>
				</div>
			)}
			
			<ResponsiveContainer width="100%" height={220}>
				<PieChart>
					<Pie 
						data={rows} 
						dataKey="value" 
						nameKey="name" 
						outerRadius={80}
						innerRadius={0}
						stroke="none"
						strokeWidth={0}
						onClick={handlePieClick}
						activeIndex={activeIndex}
					>
						{rows.map((_, i) => {
							const isActive = activeIndex === i;
							const RADIAN = Math.PI / 180;
							// Вычисляем средний угол для этой дольки
							const totalValue = rows.reduce((sum, item) => sum + item.value, 0);
							const startAngle = rows.slice(0, i).reduce((sum, item) => sum + (item.value / totalValue) * 360, 0);
							const endAngle = startAngle + (rows[i].value / totalValue) * 360;
							const midAngle = (startAngle + endAngle) / 2;
							
							const sin = Math.sin(-RADIAN * midAngle);
							const cos = Math.cos(-RADIAN * midAngle);
							
							// Анимация выезжания только для активного элемента
							const offsetX = isActive ? cos * 15 : 0;
							const offsetY = isActive ? sin * 15 : 0;
							
							return (
								<Cell 
									key={i} 
									fill={COLORS[i % COLORS.length]} 
									stroke="none"
									strokeWidth={0}
									style={{
										cursor: 'pointer',
										filter: activeIndex !== null && !isActive ? 'opacity(0.6)' : 'none',
										transition: 'all 0.4s ease',
										transform: `translate(${offsetX}px, ${offsetY}px)`
									}}
								/>
							);
						})}
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
					<Legend content={<CustomLegend />} />
				</PieChart>
			</ResponsiveContainer>
		</div>
	);
}