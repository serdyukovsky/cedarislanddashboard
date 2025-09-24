import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AggregatedDailyUnit } from "@/server/types";

interface Props {
  data: AggregatedDailyUnit[];
  periodText?: string;
}

interface CategoryStats {
  name: string;
  total: number;
  count: number;
  percentage: number;
  units: Record<string, number>; // сумма по каждому юниту
}

// Функция для нормализации названий категорий
function normalizeCategoryName(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

// Функция для форматирования названия категории для отображения
function formatCategoryName(categoryName: string): string {
  return categoryName.trim().charAt(0).toUpperCase() + categoryName.trim().slice(1).toLowerCase();
}

export function ExpenseCategories({ data, periodText = "за выбранный период" }: Props) {
  // Собираем все категории расходов из данных
  const categoryStats = new Map<string, CategoryStats>();
  
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
        
        if (!categoryStats.has(normalizedCategoryKey)) {
          categoryStats.set(normalizedCategoryKey, {
            name: formatCategoryName(category), // Форматируем название для отображения
            total: 0,
            count: 0,
            percentage: 0,
            units: {}
          });
        }
        
        const stats = categoryStats.get(normalizedCategoryKey)!;
        stats.total += amountPerCategory;
        stats.count += 1;
        
        // Добавляем сумму по юниту
        if (!stats.units[record.unit]) {
          stats.units[record.unit] = 0;
        }
        stats.units[record.unit] += amountPerCategory;
      });
    }
  });
  
  // Конвертируем в массив и сортируем по убыванию суммы
  const sortedCategories = Array.from(categoryStats.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 15); // Показываем топ-15 категорий
  
  // Вычисляем общую сумму всех расходов для процентного соотношения
  const totalExpenses = sortedCategories.reduce((sum, cat) => sum + cat.total, 0);
  
  // Обновляем процентное соотношение
  sortedCategories.forEach(cat => {
    cat.percentage = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
  });
  
  // Цвета для категорий
  const getCategoryColor = (index: number) => {
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#6366f1', '#d946ef', '#84cc16', '#f97316', '#ef4444'
    ];
    return colors[index % colors.length];
  };
  
  // Функция для получения названия юнита на русском
  const getUnitName = (unit: string) => {
    const unitNames: Record<string, string> = {
      hotel: 'Отель',
      restaurant: 'Ресторан',
      spa: 'Спа-центр',
      pool: 'Бассейн',
      bar: 'Бар'
    };
    return unitNames[unit] || unit;
  };
  
  if (sortedCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Топ-15 статей расходов</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Нет данных о расходах для отображения
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Топ-15 статей расходов</CardTitle>
        <p className="text-sm text-muted-foreground">
          Топ-{sortedCategories.length} категорий расходов {periodText}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedCategories.map((category, index) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getCategoryColor(index) }}
                  />
                  <span className="font-medium text-sm">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count} раз
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {Math.round(category.total).toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              {/* Детализация по юнитам */}
              <div className="ml-7 space-y-1">
                {Object.entries(category.units)
                  .filter(([_, amount]) => amount > 0)
                  .sort(([_, a], [__, b]) => b - a)
                  .map(([unit, amount]) => (
                    <div key={unit} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{getUnitName(unit)}</span>
                      <span className="font-medium">
                        {Math.round(amount).toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  ))
                }
              </div>
              
              {/* Прогресс-бар */}
              <div className="ml-7 w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(category.percentage, 100)}%`,
                    backgroundColor: getCategoryColor(index)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Общая статистика */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Всего категорий:</span>
              <span className="ml-2 font-medium">{categoryStats.size}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Общая сумма:</span>
              <span className="ml-2 font-medium">
                {Math.round(totalExpenses).toLocaleString("ru-RU")} ₽
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
