import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, ChevronDown, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { BusinessUnit } from "@/server/types";

interface Props {
	defaultFrom?: string;
	defaultTo?: string;
	defaultUnit?: "all" | BusinessUnit;
	onChange: (v: { from?: string; to?: string; unit: "all" | BusinessUnit }) => void;
}

export function Filters({ defaultFrom, defaultTo, defaultUnit = "all", onChange }: Props) {
	// Если не переданы даты, устанавливаем текущий месяц по умолчанию
	const getDefaultDates = () => {
		if (defaultFrom && defaultTo) {
			return { from: defaultFrom, to: defaultTo };
		}
		
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
		const lastDayDate = new Date(year, month, 0);
		const lastDay = `${lastDayDate.getFullYear()}-${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
		
		return { from: firstDay, to: lastDay };
	};

	const defaultDates = getDefaultDates();
	
	const [from, setFrom] = useState(defaultDates.from);
	const [to, setTo] = useState(defaultDates.to);
	const [unit, setUnit] = useState<"all" | BusinessUnit>(defaultUnit);
	const [isManualInput, setIsManualInput] = useState(false);
	const [pendingFrom, setPendingFrom] = useState(defaultDates.from);
	const [pendingTo, setPendingTo] = useState(defaultDates.to);
	const [pendingUnit, setPendingUnit] = useState<"all" | BusinessUnit>(defaultUnit);

	// Автоматическое обновление только для быстрых фильтров (месяц, год, все время)
	useEffect(() => {
		if (!isManualInput) {
			const timeoutId = setTimeout(() => {
				onChange({ from, to, unit });
			}, 500);
			
			return () => clearTimeout(timeoutId);
		}
	}, [from, to, unit, onChange, isManualInput]);

	// Применение фильтра вручную
	const applyFilter = () => {
		setFrom(pendingFrom);
		setTo(pendingTo);
		setUnit(pendingUnit);
		setIsManualInput(false);
	};

	const getCurrentMonth = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		return `${year}-${month.toString().padStart(2, '0')}`;
	};

	const getCurrentYear = () => {
		return new Date().getFullYear().toString();
	};

	const setCurrentMonth = () => {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;
		const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
		const lastDayDate = new Date(year, month, 0);
		const lastDay = `${lastDayDate.getFullYear()}-${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
		setFrom(firstDay);
		setTo(lastDay);
		setIsManualInput(false);
	};

	const setCurrentYear = () => {
		const year = new Date().getFullYear();
		setFrom(`${year}-01-01`);
		setTo(`${year}-12-31`);
		setIsManualInput(false);
	};

	const setAllTime = () => {
		setFrom(undefined);
		setTo(undefined);
		setIsManualInput(false);
	};

	// Обработчики для ручного ввода
	const handleManualFromChange = (value: string) => {
		setPendingFrom(value || undefined);
		setIsManualInput(true);
	};

	const handleManualToChange = (value: string) => {
		setPendingTo(value || undefined);
		setIsManualInput(true);
	};

	const handleManualUnitChange = (value: "all" | BusinessUnit) => {
		setPendingUnit(value);
		setIsManualInput(true);
	};

	const getMonthName = (monthIndex: number) => {
		const months = [
			"Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
			"Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
		];
		return months[monthIndex];
	};

	const getAvailableMonths = () => {
		const months = [];
		const currentYear = new Date().getFullYear();
		
		// Добавляем месяцы текущего года
		for (let month = 0; month < 12; month++) {
			const firstDay = `${currentYear}-${(month + 1).toString().padStart(2, '0')}-01`;
			const lastDayDate = new Date(currentYear, month + 1, 0);
			const lastDay = `${lastDayDate.getFullYear()}-${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
			months.push({
				name: `${getMonthName(month)} ${currentYear}`,
				from: firstDay,
				to: lastDay
			});
		}

		// Добавляем месяцы предыдущего года
		for (let month = 0; month < 12; month++) {
			const firstDay = `${currentYear - 1}-${(month + 1).toString().padStart(2, '0')}-01`;
			const lastDayDate = new Date(currentYear - 1, month + 1, 0);
			const lastDay = `${lastDayDate.getFullYear()}-${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
			months.push({
				name: `${getMonthName(month)} ${currentYear - 1}`,
				from: firstDay,
				to: lastDay
			});
		}

		return months;
	};

	const isCurrentMonth = () => {
		if (!from || !to) return false;
		
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();
		
		const fromDate = new Date(from);
		const toDate = new Date(to);
		
		// Проверяем, что это текущий месяц
		const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1);
		const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
		
		// Нормализуем даты для сравнения (убираем время)
		const fromNormalized = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
		const toNormalized = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
		const firstDayNormalized = new Date(firstDayOfCurrentMonth.getFullYear(), firstDayOfCurrentMonth.getMonth(), firstDayOfCurrentMonth.getDate());
		const lastDayNormalized = new Date(lastDayOfCurrentMonth.getFullYear(), lastDayOfCurrentMonth.getMonth(), lastDayOfCurrentMonth.getDate());
		
		return fromNormalized.getTime() === firstDayNormalized.getTime() && 
			   toNormalized.getTime() === lastDayNormalized.getTime();
	};

	const getSelectedMonthName = () => {
		if (!from || !to) return "";
		
		const fromDate = new Date(from);
		const toDate = new Date(to);
		
		// Проверяем, что это полный месяц (от 1-го до последнего дня месяца)
		const firstDayOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
		const lastDayOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
		
		// Нормализуем даты для сравнения (убираем время)
		const fromNormalized = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
		const toNormalized = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
		const firstDayNormalized = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), firstDayOfMonth.getDate());
		const lastDayNormalized = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate());
		
		if (fromNormalized.getTime() === firstDayNormalized.getTime() && 
			toNormalized.getTime() === lastDayNormalized.getTime()) {
			return `${getMonthName(fromDate.getMonth())} ${fromDate.getFullYear()}`;
		}
		
		return "";
	};

	const getSelectedYearName = () => {
		if (!from || !to) return "";
		
		const fromDate = new Date(from);
		const toDate = new Date(to);
		
		// Проверяем, что это полный год (от 1 января до 31 декабря)
		const firstDayOfYear = new Date(fromDate.getFullYear(), 0, 1);
		const lastDayOfYear = new Date(fromDate.getFullYear(), 11, 31);
		
		// Нормализуем даты для сравнения (убираем время)
		const fromNormalized = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
		const toNormalized = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
		const firstDayNormalized = new Date(firstDayOfYear.getFullYear(), firstDayOfYear.getMonth(), firstDayOfYear.getDate());
		const lastDayNormalized = new Date(lastDayOfYear.getFullYear(), lastDayOfYear.getMonth(), lastDayOfYear.getDate());
		
		if (fromNormalized.getTime() === firstDayNormalized.getTime() && 
			toNormalized.getTime() === lastDayNormalized.getTime()) {
			return fromDate.getFullYear().toString();
		}
		
		return "";
	};

	const isAllTimeSelected = () => {
		return !from && !to;
	};

	return (
		<div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
			{/* Быстрые фильтры */}
			<div className="space-y-3">
				<div className="grid grid-cols-4 gap-2 sm:gap-3">
					<Button
						variant={isCurrentMonth() ? "default" : "outline"}
						size="sm"
						onClick={setCurrentMonth}
						className="flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm active:bg-transparent active:text-foreground focus:bg-transparent focus:text-foreground shadow-press"
					>
						<Clock className="h-3 w-3 sm:h-4 sm:w-4" />
						<span className="hidden sm:inline">Текущий месяц</span>
						<span className="sm:hidden">Сегодня</span>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant={getSelectedMonthName() ? "default" : "outline"}
								size="sm"
								className="flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm active:bg-transparent active:text-foreground focus:bg-transparent focus:text-foreground shadow-press"
							>
								<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
								<span className="hidden sm:inline">{getSelectedMonthName() || "Выбрать месяц"}</span>
								<span className="sm:hidden">{getSelectedMonthName() ? getSelectedMonthName().split(' ')[0] : "Месяц"}</span>
								<ChevronDown className="h-3 w-3" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
							{getAvailableMonths().map((month) => (
								<DropdownMenuItem
									key={`${month.from}-${month.to}`}
									onClick={() => {
										setFrom(month.from);
										setTo(month.to);
										setIsManualInput(false);
									}}
								>
									{month.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						variant={getSelectedYearName() ? "default" : "outline"}
						size="sm"
						onClick={setCurrentYear}
						className="flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm active:bg-transparent active:text-foreground focus:bg-transparent focus:text-foreground shadow-press"
					>
						<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
						<span className="hidden sm:inline">{getSelectedYearName() || "Текущий год"}</span>
						<span className="sm:hidden">{getSelectedYearName() || "Год"}</span>
					</Button>

					<Button
						variant={isAllTimeSelected() ? "default" : "outline"}
						size="sm"
						onClick={setAllTime}
						className="flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm active:bg-transparent active:text-foreground focus:bg-transparent focus:text-foreground shadow-press"
					>
						<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
						<span className="hidden sm:inline">За все время</span>
						<span className="sm:hidden">Все</span>
					</Button>
				</div>
			</div>

			{/* Ручные фильтры */}
			<div className="space-y-3">
				<label className="text-sm font-medium text-muted-foreground">Настройка вручную</label>
				<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
					{/* Поле "С даты" */}
					<div className="space-y-2 col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col">
						<label className="text-sm text-muted-foreground">С даты</label>
						<input 
							type="date" 
							value={isManualInput ? (pendingFrom ?? "") : (from ?? "")} 
							onChange={(e) => handleManualFromChange(e.target.value)} 
							className="w-full border rounded-lg px-3 py-2 h-10 bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
						/>
					</div>

					{/* Поле "По дату" */}
					<div className="space-y-2 col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col">
						<label className="text-sm text-muted-foreground">По дату</label>
						<input 
							type="date" 
							value={isManualInput ? (pendingTo ?? "") : (to ?? "")} 
							onChange={(e) => handleManualToChange(e.target.value)} 
							className="w-full border rounded-lg px-3 py-2 h-10 bg-background text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors" 
						/>
					</div>

					{/* Поле "Юнит" */}
					<div className="space-y-2 col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col">
						<label className="text-sm text-muted-foreground">Юнит</label>
						<div className="relative">
							<select 
								value={isManualInput ? pendingUnit : unit} 
								onChange={(e) => handleManualUnitChange(e.target.value as any)} 
								className="w-full border rounded-lg px-3 py-2 h-10 bg-background text-sm appearance-none pr-10 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
							>
								<option value="all">Все</option>
								<option value="hotel">Отель и бани</option>
								<option value="restaurant">Ресторан</option>
								<option value="spa">Спа-центр</option>
								<option value="pool">Бассейн</option>
								<option value="bar">Бар</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
						</div>
					</div>

					{/* Кнопка применения */}
					<div className="col-span-1 sm:col-span-1 lg:col-span-1 flex flex-col">
						<label className="text-sm text-muted-foreground opacity-0">Применить</label>
						<Button
							onClick={applyFilter}
							disabled={!isManualInput}
							className="w-full h-10 flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm active:bg-transparent active:text-foreground focus:bg-transparent focus:text-foreground shadow-press"
						>
							<Search className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="hidden sm:inline">Применить</span>
							<span className="sm:hidden">OK</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
