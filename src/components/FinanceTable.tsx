import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AggregatedDailyUnit } from "@/server/types";

export function FinanceTable({ data }: { data: AggregatedDailyUnit[] }) {
	const navigate = useNavigate();
	const [isExpanded, setIsExpanded] = useState(false);
	const shouldShowToggle = data.length > 30;
	const displayData = shouldShowToggle && !isExpanded ? data.slice(0, 30) : data;
	
	// Функция для навигации на страницу операций
	const navigateToOperations = (unit: string, date: string, type: 'revenue' | 'expense') => {
		console.log('🔔 Cell clicked!', { unit, date, type });
		const params = new URLSearchParams({
			unit,
			from: date,
			to: date,
			type
		});
		console.log('📍 Navigating to:', `/operations?${params.toString()}`);
		navigate(`/operations?${params.toString()}`);
	};

	return (
		<div className="border rounded-lg overflow-hidden bg-card">
			<table className="w-full text-sm">
				<thead className="bg-muted/50">
					<tr>
						<th className="text-left p-2">Дата</th>
						<th className="text-left p-2">Юнит</th>
						<th className="text-right p-2">Доходы: Нал</th>
						<th className="text-right p-2">Доходы: Счет</th>
						<th className="text-right p-2">Доходы: Экв</th>
						<th className="text-right p-2">Доходы: Итого</th>
						<th className="text-right p-2">Расх: Закупки</th>
						<th className="text-right p-2">Расх: Зарплаты</th>
						<th className="text-right p-2">Расх: Прочее</th>
						<th className="text-right p-2">Расх: Итого</th>
						<th className="text-right p-2">Прибыль</th>
					</tr>
				</thead>
				<tbody>
					{displayData.map((r, idx) => (
						<tr key={idx} className="border-t hover:bg-gray-50">
							<td className="p-2">{r.date}</td>
							<td className="p-2">{
								r.unit === "hotel" ? "Отель и бани" : 
								r.unit === "restaurant" ? "Ресторан" : 
								r.unit === "spa" ? "Спа-центр" :
								r.unit === "pool" ? "Бассейн" :
								r.unit === "bar" ? "Бар" : r.unit
							}</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-blue-50 hover:text-blue-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'revenue');
								}}
								title="Кликните чтобы посмотреть детали доходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.revenue?.cash) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-blue-50 hover:text-blue-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'revenue');
								}}
								title="Кликните чтобы посмотреть детали доходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.revenue?.bank) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-blue-50 hover:text-blue-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'revenue');
								}}
								title="Кликните чтобы посмотреть детали доходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.revenue?.acquiring) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right font-medium hover:bg-blue-50 hover:text-blue-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'revenue');
								}}
								title="Кликните чтобы посмотреть детали доходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.revenue?.total) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-red-50 hover:text-red-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'expense');
								}}
								title="Кликните чтобы посмотреть детали расходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.expense?.purchases) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-red-50 hover:text-red-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'expense');
								}}
								title="Кликните чтобы посмотреть детали расходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.expense?.salaries) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right hover:bg-red-50 hover:text-red-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'expense');
								}}
								title="Кликните чтобы посмотреть детали расходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.expense?.other) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td 
								className="clickable-cell p-2 text-right font-medium hover:bg-red-50 hover:text-red-700 transition-colors"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									navigateToOperations(r.unit, r.date, 'expense');
								}}
								title="Кликните чтобы посмотреть детали расходов"
								style={{ cursor: 'pointer' }}
							>
								{(Number(r.expense?.total) || 0).toLocaleString("ru-RU")} ₽
							</td>
							<td className="p-2 text-right font-semibold">{(Number(r.profit) || 0).toLocaleString("ru-RU")} ₽</td>
						</tr>
					))}
				</tbody>
			</table>
			{shouldShowToggle && (
				<div className="p-3 border-t bg-muted/30">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
						{isExpanded ? "Скрыть детали" : `Показать все ${data.length} операций`}
					</button>
				</div>
			)}
		</div>
	);
}
