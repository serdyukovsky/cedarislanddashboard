import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { AggregatedDailyUnit } from "@/server/types";

interface Props {
  data: AggregatedDailyUnit[];
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// Функция для нормализации названий категорий
function normalizeCategoryName(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

// Функция для форматирования названия категории для отображения
function formatCategoryName(categoryName: string): string {
  return categoryName.trim().charAt(0).toUpperCase() + categoryName.trim().slice(1).toLowerCase();
}

export function ExpenseCategoriesPie({ data }: Props) {
  // Собираем все категории расходов из данных
  const categoryStats = new Map<string, number>();
  
  // Обрабатываем данные для извлечения категорий
  (Array.isArray(data) ? data : []).forEach((record) => {
    const expenseDetails = (record as any).expenseDetails;
    if (expenseDetails && expenseDetails.categories) {
      // Получаем общую сумму расходов для этого дня и юнита
      const totalAmount = expenseDetails.total;
      const categories = expenseDetails.categories;
      
      // Распределяем сумму равномерно между всеми категориями для этого дня
      const amountPerCategory = categories.length > 0 ? totalAmount / categories.length : 0;
      
      categories.forEach((category: string) => {
        if (!category || category.trim() === '') return;
        
        // Нормализуем название категории (приводим к нижнему регистру для сравнения)
        const normalizedCategoryKey = normalizeCategoryName(category);
        categoryStats.set(normalizedCategoryKey, (categoryStats.get(normalizedCategoryKey) || 0) + amountPerCategory);
      });
    }
  });
  
  // Конвертируем в массив и сортируем по убыванию суммы
  const sortedCategories = Array.from(categoryStats.entries())
    .map(([normalizedKey, value]) => ({ 
      name: formatCategoryName(normalizedKey), // Форматируем название для отображения
      value 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Показываем топ-8 категорий для читаемости
  
  // Вычисляем общую сумму всех расходов
  const totalExpenses = sortedCategories.reduce((sum, cat) => sum + cat.value, 0);
  
  // Цвета для категорий
  const colors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];
  
  // Формируем данные для диаграммы
  const chartData: CategoryData[] = sortedCategories.map((category, index) => ({
    name: category.name,
    value: category.value,
    color: colors[index % colors.length],
    percentage: totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0
  }));
  
  // Кастомный tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="bg-white/40 border border-gray-200/50 rounded-xl shadow-xl p-2"
          style={{
            backdropFilter: 'blur(20px)',
            fontSize: '12px'
          }}
        >
          <p className="font-medium text-xs">{data.name}</p>
          <p className="text-xs text-gray-600">
            {data.value.toLocaleString("ru-RU")} ₽ ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Кастомная легенда
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Не показываем подписи для маленьких сегментов
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  if (chartData.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <h3 className="font-semibold mb-4 text-center">Распределение расходов по категориям</h3>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Нет данных о расходах для отображения</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg p-6 bg-card">
      <h3 className="font-semibold mb-4 text-center">Распределение расходов по категориям</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Легенда с категориями */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate" title={item.name}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
