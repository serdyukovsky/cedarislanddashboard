import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import type { AggregatedDailyUnit } from "@/server/types";
import { Users, ShoppingCart, Package } from "lucide-react";

interface Props {
  data: AggregatedDailyUnit[];
  from?: string;
  to?: string;
}

// Функция для нормализации названий категорий
function normalizeCategoryName(categoryName: string): string {
  return categoryName.trim().toLowerCase();
}

export function ExpenseBreakdown({ data, from, to }: Props) {
  const navigate = useNavigate();
  
  // Функция для навигации на страницу операций с фильтром по категории
  const navigateToCategory = (categoryType: 'fot' | 'purchases' | 'other') => {
    const params = new URLSearchParams();
    params.append('type', 'expense');
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    // Добавляем специальный параметр для типа категории
    params.append('categoryType', categoryType);
    
    console.log('🔔 Navigating to expense category:', categoryType);
    navigate(`/operations?${params.toString()}`);
  };
  
  // Инициализируем счетчики для трех категорий
  const categoryTotals = {
    fot: 0,      // ФОТ - расходы со статьей содержащей "ФОТ" и "Зп % специалиста" + "Трансфер для персонала"
    purchases: 0, // Закупки - "Продукты" + "Расходные материалы"
    other: 0      // Остальное - все остальные расходы
  };

  // Обрабатываем данные для группировки по категориям
  (Array.isArray(data) ? data : []).forEach(record => {
    const expenseDetails = (record as any).expenseDetails;
    
    // Используем categoryDetails для точного расчета по реальным суммам
    if (expenseDetails && expenseDetails.categoryDetails && Array.isArray(expenseDetails.categoryDetails)) {
      expenseDetails.categoryDetails.forEach((detail: any) => {
        if (!detail.category || !detail.amount) return;
        
        const normalizedCategory = normalizeCategoryName(detail.category);
        const amount = Number(detail.amount) || 0;
        
        // ФОТ категории
        if (normalizedCategory.includes('фот') || 
            normalizedCategory.includes('зп') || 
            normalizedCategory.includes('специалист') ||
            normalizedCategory.includes('трансфер') ||
            normalizedCategory.includes('персонал')) {
          categoryTotals.fot += amount;
        }
        // Закупки категории
        else if (normalizedCategory.includes('продукт') || 
                 normalizedCategory.includes('расходн') ||
                 normalizedCategory.includes('материал')) {
          categoryTotals.purchases += amount;
        }
        // Остальное
        else {
          categoryTotals.other += amount;
        }
      });
    }
    // Fallback: если нет categoryDetails, используем старый метод с categories
    else if (expenseDetails && expenseDetails.categories && expenseDetails.total > 0) {
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

  // Создаем массив элементов для отображения
  const items = [
    { 
      label: "ФОТ", 
      value: categoryTotals.fot,
      icon: Users,
      color: "text-blue-500"
    },
    { 
      label: "Закупки", 
      value: categoryTotals.purchases,
      icon: ShoppingCart,
      color: "text-green-500"
    },
    { 
      label: "Остальное", 
      value: categoryTotals.other,
      icon: Package,
      color: "text-orange-500"
    },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => {
        const IconComponent = item.icon;
        const categoryType = item.label === 'ФОТ' ? 'fot' : item.label === 'Закупки' ? 'purchases' : 'other';
        return (
          <Card 
            key={item.label} 
            className="shadow-card h-20 relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform" 
            onClick={() => navigateToCategory(categoryType)}
            title={`Кликните чтобы посмотреть детали: ${item.label}`}
          >
            {/* Блюрная иконка на фоне */}
            <div className="absolute top-1 right-1 opacity-50 blur-[2px] group-hover:blur-[0px] transition-all duration-300 transform rotate-12">
              <IconComponent className={`h-12 w-12 ${item.color}`} />
              </div>
            
            <CardContent className="flex flex-col items-start justify-center h-full py-1 relative z-10">
              <CardTitle className="text-xs text-muted-foreground">{item.label}</CardTitle>
              <div className="text-sm font-semibold text-foreground">
                {Math.round(Number(item.value) || 0).toLocaleString("ru-RU")} ₽
        </div>
      </CardContent>
    </Card>
        );
      })}
    </div>
  );
}
