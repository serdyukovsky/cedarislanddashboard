import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Building2, UtensilsCrossed, Waves, BarChart3, ExternalLink, FileSpreadsheet, ChevronDown, ChevronUp, Droplets, Wine, Loader2, DollarSign, User, Zap, Menu, X, ArrowUp } from "lucide-react";
import { Filters } from "@/components/Filters";
import { useFinanceData } from "@/hooks/useFinanceData";
import { DailyLines } from "@/components/charts/DailyLines";
import { UnitsBars } from "@/components/charts/UnitsBars";
import { RevenuePie, ExpensePie } from "@/components/charts/Pies";
import { ExpenseCategoriesPie } from "@/components/charts/ExpenseCategoriesPie";
import { FinanceTable } from "@/components/FinanceTable";
import { RevenueBreakdown } from "@/components/RevenueBreakdown";
import { ExpenseBreakdown } from "@/components/ExpenseBreakdown";
import { ExpenseCategories } from "@/components/ExpenseCategories";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ProfitQuotes } from "@/components/ProfitQuotes";

const Index = () => {
  // Устанавливаем текущий месяц по умолчанию
  const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDayDate = new Date(year, month, 0);
    const lastDay = `${lastDayDate.getFullYear()}-${(lastDayDate.getMonth() + 1).toString().padStart(2, '0')}-${lastDayDate.getDate().toString().padStart(2, '0')}`;
    return { from: firstDay, to: lastDay };
  };

  const currentMonth = getCurrentMonthRange();
  const [filters, setFilters] = useState<{ from?: string; to?: string; unit: "all" | "hotel" | "restaurant" | "spa" | "pool" | "bar" }>({ 
    from: currentMonth.from,
    to: currentMonth.to,
    unit: "all"
  });
  const [showExpenseCategories, setShowExpenseCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const { data, lastModified, revenueLastModified, expenseLastModified, loading, error } = useFinanceData(filters);
  
  // Закрытие мобильного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Отслеживание скролла для кнопки "наверх"
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300); // Показываем кнопку после скролла на 300px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Функция для скролла наверх
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Get all data for growth calculation
  const { data: allData } = useFinanceData({ unit: "all" });
  
  // Функция для форматирования выбранного периода
  const formatSelectedPeriod = () => {
    if (!filters.from && !filters.to) {
      return "за все время";
    }
    
    if (!filters.from || !filters.to) {
      return "за выбранный период";
    }
    
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);
    
    // Проверяем, является ли диапазон полным месяцем
    const firstDayOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const lastDayOfMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
    
    // Нормализуем даты для сравнения (убираем время)
    const fromNormalized = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const toNormalized = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    const firstDayNormalized = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), firstDayOfMonth.getDate());
    const lastDayNormalized = new Date(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate());
    
    if (fromNormalized.getTime() === firstDayNormalized.getTime() && 
        toNormalized.getTime() === lastDayNormalized.getTime()) {
      // Это полный месяц
      const months = [
        "январь", "февраль", "март", "апрель", "май", "июнь",
        "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"
      ];
      return `за ${months[fromDate.getMonth()]} ${fromDate.getFullYear()}`;
    }
    
    // Проверяем, является ли диапазон полным годом
    const firstDayOfYear = new Date(fromDate.getFullYear(), 0, 1);
    const lastDayOfYear = new Date(fromDate.getFullYear(), 11, 31);
    const firstDayYearNormalized = new Date(firstDayOfYear.getFullYear(), firstDayOfYear.getMonth(), firstDayOfYear.getDate());
    const lastDayYearNormalized = new Date(lastDayOfYear.getFullYear(), lastDayOfYear.getMonth(), lastDayOfYear.getDate());
    
    if (fromNormalized.getTime() === firstDayYearNormalized.getTime() && 
        toNormalized.getTime() === lastDayYearNormalized.getTime()) {
      return `за ${fromDate.getFullYear()} год`;
    }
    
    // Обычный диапазон дат
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("ru-RU", { 
        day: "numeric", 
        month: "short" 
      });
    };
    
    return `с ${formatDate(fromDate)} по ${formatDate(toDate)}`;
  };

  const totals = (Array.isArray(data) ? data : []).reduce(
    (acc, d) => {
      try {
        const revenue = Number(d?.revenue?.total) || 0;
        const expense = Number(d?.expense?.total) || 0;
        acc.total += revenue;
        acc.expenseTotal += expense;
        if (d?.unit === "hotel") {
          acc.hotel += revenue;
          acc.hotelExpense += expense;
        }
        if (d?.unit === "restaurant") {
          acc.restaurant += revenue;
          acc.restaurantExpense += expense;
        }
        if (d?.unit === "spa") {
          acc.spa += revenue;
          acc.spaExpense += expense;
        }
        if (d?.unit === "pool") {
          acc.pool += revenue;
          acc.poolExpense += expense;
        }
        if (d?.unit === "bar") {
          acc.bar += revenue;
          acc.barExpense += expense;
        }
      } catch (error) {
        console.warn('Error processing data row:', error, d);
      }
      return acc;
    },
    { 
      total: 0, hotel: 0, restaurant: 0, spa: 0, pool: 0, bar: 0,
      expenseTotal: 0, hotelExpense: 0, restaurantExpense: 0, spaExpense: 0, poolExpense: 0, barExpense: 0
    }
  );

  // Подсчитываем детализацию по источникам оплаты для расходов
  const expensePaymentMethods = (Array.isArray(data) ? data : []).reduce(
    (acc, d) => {
      try {
        const expenseDetails = (d as any).expenseDetails;
        if (expenseDetails) {
          acc.total.cash += Number(expenseDetails.cash) || 0;
          acc.total.account += Number(expenseDetails.account) || 0;
          acc.total.total += Number(expenseDetails.total) || 0;
          
          // По юнитам
          if (d?.unit === "hotel") {
            acc.hotel.cash += Number(expenseDetails.cash) || 0;
            acc.hotel.account += Number(expenseDetails.account) || 0;
            acc.hotel.total += Number(expenseDetails.total) || 0;
          }
          if (d?.unit === "restaurant") {
            acc.restaurant.cash += Number(expenseDetails.cash) || 0;
            acc.restaurant.account += Number(expenseDetails.account) || 0;
            acc.restaurant.total += Number(expenseDetails.total) || 0;
          }
          if (d?.unit === "spa") {
            acc.spa.cash += Number(expenseDetails.cash) || 0;
            acc.spa.account += Number(expenseDetails.account) || 0;
            acc.spa.total += Number(expenseDetails.total) || 0;
          }
          if (d?.unit === "pool") {
            acc.pool.cash += Number(expenseDetails.cash) || 0;
            acc.pool.account += Number(expenseDetails.account) || 0;
            acc.pool.total += Number(expenseDetails.total) || 0;
          }
          if (d?.unit === "bar") {
            acc.bar.cash += Number(expenseDetails.cash) || 0;
            acc.bar.account += Number(expenseDetails.account) || 0;
            acc.bar.total += Number(expenseDetails.total) || 0;
          }
        }
      } catch (error) {
        console.warn('Error processing expense details:', error, d);
      }
      return acc;
    },
    { 
      total: { cash: 0, account: 0, total: 0 },
      hotel: { cash: 0, account: 0, total: 0 },
      restaurant: { cash: 0, account: 0, total: 0 },
      spa: { cash: 0, account: 0, total: 0 },
      pool: { cash: 0, account: 0, total: 0 },
      bar: { cash: 0, account: 0, total: 0 }
    }
  );

  // Check which units have data for conditional rendering
  const hasPoolData = totals.pool > 0 || totals.poolExpense > 0;
  const hasBarData = totals.bar > 0 || totals.barExpense > 0;
  
  // Check which units have expense data for conditional rendering
  const hasPoolExpenseData = totals.poolExpense > 0;
  const hasBarExpenseData = totals.barExpense > 0;

  // Calculate revenue growth percentage for current month vs previous month
  const calculateRevenueGrowth = () => {
    console.log('calculateRevenueGrowth called with:', {
      filters,
      dataLength: data?.length || 0,
      allDataLength: allData?.length || 0
    });
    
    if (!filters.from || !filters.to) {
      console.log('Early return: missing filters', {
        hasFrom: !!filters.from,
        hasTo: !!filters.to
      });
      return null;
    }
    
    // Check if we have any data to work with
    const hasAllData = Array.isArray(allData) && allData.length > 0;
    const hasFilteredData = Array.isArray(data) && data.length > 0;
    
    if (!hasAllData && !hasFilteredData) {
      console.log('Early return: no data available', {
        hasAllData,
        hasFilteredData,
        allDataLength: allData?.length || 0,
        dataLength: data?.length || 0
      });
      return null;
    }

    // Check if we're viewing a specific month (from and to dates are set and represent a month)
    const fromDate = new Date(filters.from);
    const toDate = new Date(filters.to);
    
    // Check if the date range represents a single month
    const isSingleMonth = fromDate.getMonth() === toDate.getMonth() && 
                         fromDate.getFullYear() === toDate.getFullYear() &&
                         fromDate.getDate() === 1; // First day of month
    
    if (!isSingleMonth) {
      return null;
    }

    // Calculate current month total revenue
    // Use filtered data if available, otherwise use allData
    const dataSource = hasFilteredData ? data : allData;
    const currentMonthRevenue = (Array.isArray(dataSource) ? dataSource : []).reduce(
      (acc, d) => {
        try {
            const revenue = Number(d?.revenue?.total) || 0;
            acc += revenue;
        } catch (error) {
          console.warn('Error processing current month data:', error, d);
        }
        return acc;
      },
      0
    );

    // Calculate previous month total revenue
    const prevMonth = new Date(fromDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    const prevMonthFrom = `${prevMonth.getFullYear()}-${(prevMonth.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const prevMonthToDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
    const prevMonthTo = `${prevMonthToDate.getFullYear()}-${(prevMonthToDate.getMonth() + 1).toString().padStart(2, '0')}-${prevMonthToDate.getDate().toString().padStart(2, '0')}`;

    // Calculate previous month revenue
    // Use allData if available, otherwise we can't calculate previous month
    let prevMonthRevenue = 0;
    if (hasAllData) {
      prevMonthRevenue = (Array.isArray(allData) ? allData : []).reduce(
      (acc, d) => {
        try {
          const date = new Date(d.date);
            const prevFrom = new Date(prevMonthFrom);
            const prevTo = new Date(prevMonthTo);
            
            // Check if date is within previous month range
            if (date >= prevFrom && date <= prevTo) {
            const revenue = Number(d?.revenue?.total) || 0;
            acc += revenue;
          }
        } catch (error) {
          console.warn('Error processing previous month data:', error, d);
        }
        return acc;
      },
      0
    );
    } else {
      console.log('Cannot calculate previous month revenue: allData not available');
      return null;
    }

    console.log('=== GROWTH CALCULATION DEBUG ===');
    console.log('Current month filter:', filters.from, 'to', filters.to);
    console.log('Current month revenue:', currentMonthRevenue);
    console.log('Previous month range:', prevMonthFrom, 'to', prevMonthTo);
    console.log('Previous month revenue:', prevMonthRevenue);
    console.log('Is single month:', isSingleMonth);
    console.log('Filtered data length:', data.length);
    console.log('All data length:', allData?.length || 0);
    
    // Additional debugging: show sample of current month data
    if (data.length > 0) {
      console.log('Sample current month data:', data.slice(0, 3).map(d => ({
        date: d.date,
        unit: d.unit,
        revenue: d.revenue?.total
      })));
      
      // Show all individual restaurant expense transactions for March
      console.log('=== INDIVIDUAL RESTAURANT EXPENSE TRANSACTIONS FOR MARCH 2025 ===');
      
      // Get all data for March restaurant expenses
      const marchRestaurantTransactions = (Array.isArray(allData) ? allData : [])
        .filter(d => 
          d.unit === 'restaurant' && 
          d.date.startsWith('2025-03') &&
          d.expenseDetails && 
          d.expenseDetails.total > 0
        );
      
      console.log('Total restaurant days with expenses in March:', marchRestaurantTransactions.length);
      
      marchRestaurantTransactions.forEach((dayRecord, dayIndex) => {
        if (dayRecord.expenseDetails && dayRecord.expenseDetails.categoryDetails) {
          // Используем детальную информацию о каждой транзакции
          const categoryDetails = dayRecord.expenseDetails.categoryDetails;
          
          categoryDetails.forEach((detail) => {
            if (detail.category && detail.category.trim() !== '') {
              const source = detail.paymentMethod === 'cash' ? 'наличные' : 'расчетный счет';
              console.log(`${dayRecord.date}: ${detail.amount.toLocaleString()} ₽ - ${detail.category} [${source}, строка ${detail.rowIndex}]`);
            }
          });
        } else if (dayRecord.expenseDetails && dayRecord.expenseDetails.categories) {
          // Fallback для старого формата (если categoryDetails нет)
          const totalAmount = dayRecord.expenseDetails.total;
          const categories = dayRecord.expenseDetails.categories;
          const amountPerCategory = categories.length > 0 ? totalAmount / categories.length : 0;
          
          const cashCount = dayRecord.expenseDetails.cashCount || 0;
          const accountCount = dayRecord.expenseDetails.accountCount || 0;
          const sourceInfo = [];
          if (cashCount > 0) sourceInfo.push(`наличные (${cashCount} транзакций)`);
          if (accountCount > 0) sourceInfo.push(`расчетный счет (${accountCount} транзакций)`);
          const source = sourceInfo.join(', ');
          
          categories.forEach((category, categoryIndex) => {
            if (category && category.trim() !== '') {
              console.log(`${dayRecord.date}: ${amountPerCategory.toLocaleString()} ₽ - ${category} [${source}]`);
            }
          });
        }
      });
      
      // Sum up all individual transactions
      const totalIndividualTransactions = marchRestaurantTransactions.reduce((sum, record) => {
        return sum + (record.expenseDetails?.total || 0);
      }, 0);
      
      console.log('Total restaurant expenses for March 2025:', totalIndividualTransactions.toLocaleString(), '₽');
      console.log('================================================================');
      
      // Show all individual hotel expense transactions for April
      console.log('=== INDIVIDUAL HOTEL EXPENSE TRANSACTIONS FOR APRIL 2025 ===');
      
      // Get all data for April hotel expenses
      const aprilHotelTransactions = (Array.isArray(allData) ? allData : [])
        .filter(d => 
          d.unit === 'hotel' && 
          d.date.startsWith('2025-04') &&
          d.expenseDetails && 
          d.expenseDetails.total > 0
        );
      
      console.log('Total hotel days with expenses in April:', aprilHotelTransactions.length);
      
      aprilHotelTransactions.forEach((dayRecord, dayIndex) => {
        if (dayRecord.expenseDetails && dayRecord.expenseDetails.categoryDetails) {
          // Используем детальную информацию о каждой транзакции
          const categoryDetails = dayRecord.expenseDetails.categoryDetails;
          
          categoryDetails.forEach((detail) => {
            if (detail.category && detail.category.trim() !== '') {
              const source = detail.paymentMethod === 'cash' ? 'наличные' : 'расчетный счет';
              console.log(`${dayRecord.date}: ${detail.amount.toLocaleString()} ₽ - ${detail.category} [${source}, строка ${detail.rowIndex}]`);
            }
          });
        } else if (dayRecord.expenseDetails && dayRecord.expenseDetails.categories) {
          // Fallback для старого формата (если categoryDetails нет)
          const totalAmount = dayRecord.expenseDetails.total;
          const categories = dayRecord.expenseDetails.categories;
          const amountPerCategory = categories.length > 0 ? totalAmount / categories.length : 0;
          
          const cashCount = dayRecord.expenseDetails.cashCount || 0;
          const accountCount = dayRecord.expenseDetails.accountCount || 0;
          const sourceInfo = [];
          if (cashCount > 0) sourceInfo.push(`наличные (${cashCount} транзакций)`);
          if (accountCount > 0) sourceInfo.push(`расчетный счет (${accountCount} транзакций)`);
          const source = sourceInfo.join(', ');
          
          categories.forEach((category, categoryIndex) => {
            if (category && category.trim() !== '') {
              console.log(`${dayRecord.date}: ${amountPerCategory.toLocaleString()} ₽ - ${category} [${source}]`);
            }
          });
        }
      });
      
      // Sum up all individual transactions
      const totalAprilHotelTransactions = aprilHotelTransactions.reduce((sum, record) => {
        return sum + (record.expenseDetails?.total || 0);
      }, 0);
      
            console.log('Total hotel expenses for April 2025:', totalAprilHotelTransactions.toLocaleString(), '₽');
            console.log('================================================================');
            
            // Show all individual hotel expense transactions for June (cash only)
            console.log('=== INDIVIDUAL HOTEL EXPENSE TRANSACTIONS FOR JUNE 2025 (CASH ONLY) ===');
            
            // Get all data for June hotel expenses (cash only)
            const juneHotelCashTransactions = (Array.isArray(allData) ? allData : [])
              .filter(d => 
                d.unit === 'hotel' && 
                d.date.startsWith('2025-06') &&
                d.expenseDetails && 
                d.expenseDetails.total > 0 &&
                d.expenseDetails.cash > 0 // Only cash transactions
              );
            
            console.log('Total hotel days with cash expenses in June:', juneHotelCashTransactions.length);
            
            juneHotelCashTransactions.forEach((dayRecord, dayIndex) => {
              if (dayRecord.expenseDetails && dayRecord.expenseDetails.categoryDetails) {
                // Используем детальную информацию о каждой транзакции
                const categoryDetails = dayRecord.expenseDetails.categoryDetails;
                
                categoryDetails.forEach((detail) => {
                  if (detail.category && detail.category.trim() !== '' && detail.paymentMethod === 'cash') {
                    console.log(`${dayRecord.date}: ${detail.amount.toLocaleString()} ₽ - ${detail.category} [наличные, строка ${detail.rowIndex}]`);
                  }
                });
              } else if (dayRecord.expenseDetails && dayRecord.expenseDetails.categories) {
                // Fallback для старого формата (если categoryDetails нет)
                const totalAmount = dayRecord.expenseDetails.total;
                const categories = dayRecord.expenseDetails.categories;
                const amountPerCategory = categories.length > 0 ? totalAmount / categories.length : 0;
                
                const cashCount = dayRecord.expenseDetails.cashCount || 0;
                if (cashCount > 0) {
                  categories.forEach((category, categoryIndex) => {
                    if (category && category.trim() !== '') {
                      console.log(`${dayRecord.date}: ${amountPerCategory.toLocaleString()} ₽ - ${category} [наличные (${cashCount} транзакций)]`);
                    }
                  });
                }
              }
            });
            
            // Sum up all individual cash transactions
            const totalJuneHotelCashTransactions = juneHotelCashTransactions.reduce((sum, record) => {
              return sum + (record.expenseDetails?.cash || 0);
            }, 0);
            
            console.log('Total hotel cash expenses for June 2025:', totalJuneHotelCashTransactions.toLocaleString(), '₽');
            console.log('================================================================');
    }
    
    // Check for suspiciously high values
    if (currentMonthRevenue > 10000000) {
      console.warn('⚠️ SUSPICIOUSLY HIGH REVENUE:', currentMonthRevenue);
      console.log('This might indicate a data processing error');
      console.log('Returning null to hide incorrect growth calculation');
      return null; // Don't show growth if data seems incorrect
    }
    
    if (prevMonthRevenue > 0) {
      const growth = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
      console.log('Growth percentage:', growth + '%');
      console.log('Formula: ((Текущий месяц - Предыдущий месяц) / Предыдущий месяц) * 100');
      console.log('Formula: ((' + currentMonthRevenue.toLocaleString() + ' - ' + prevMonthRevenue.toLocaleString() + ') / ' + prevMonthRevenue.toLocaleString() + ') * 100 = ' + growth.toFixed(2) + '%');
    } else {
      console.log('Previous month revenue is 0, no growth calculation');
    }
    console.log('================================');

    // Don't show growth if previous month has no data
    if (prevMonthRevenue === 0) {
      return null; // Don't show 100% growth if previous month was 0
    }

    const growthPercentage = ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    return Math.round(growthPercentage * 100) / 100; // Round to 2 decimal places
  };

  const revenueGrowth = calculateRevenueGrowth();

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Ошибка загрузки данных</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12">
        <div className="flex items-center justify-between gap-4">
          {/* Логотип */}
          <div className="flex items-center gap-3 sm:hidden mt-2"> {/* Hide on desktop, add margin-top */}
            <img 
              src="https://static.tildacdn.com/tild3136-6132-4665-b939-316466376231/logo.svg" 
              alt="Кедровый Остров" 
              className="h-10 w-auto brightness-0"
            />
            <div className="inline-flex items-start gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border -mt-8">
              <span className="sm:hidden">Dash</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                <Zap className="h-3 w-3" />
              </span>
            </div>
          </div>
          
          {/* Логотип для десктопа */}
          <div className="hidden sm:flex items-center gap-3">
            <img 
              src="https://static.tildacdn.com/tild3136-6132-4665-b939-316466376231/logo.svg" 
              alt="Кедровый Остров" 
              className="h-12 w-auto brightness-0"
            />
            <div className="inline-flex items-start gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border -mt-10">
              <span className="hidden sm:inline">Dashboard</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                <Zap className="h-3 w-3" />
              </span>
            </div>
          </div>
          
          {/* Меню навигации */}
          <nav className="flex items-center gap-8 ml-auto">
            {/* Десктопное меню */}
            <div className="hidden sm:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Сводно
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Операции
              </a>
              <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                О приложении
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" title="Профиль пользователя">
                <User className="h-5 w-5" />
              </a>
            </div>
            
          </nav>
        </div>
        
        {/* Блок фильтра */}
        <div className="max-w-6xl mx-auto">
          <Filters
            defaultUnit="all"
            onChange={setFilters}
          />
        </div>

        {/* Блок с цитатами - только для мобильной версии */}
        <div className="sm:hidden max-w-6xl mx-auto mt-6">
          <div className="text-center">
            <ProfitQuotes />
          </div>
        </div>

        {/* Отступ между фильтром и операционной прибылью */}
        <div className="hidden sm:block h-16 lg:h-20"></div>

        {/* Заголовок блока операционной прибыли */}
        <div className="mb-4">
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-3xl font-black text-foreground tracking-tight font-angry">Операционная прибыль 💰</h2>
            <div className="hidden sm:block">
            <ProfitQuotes />
            </div>
          </div>
          
          {/* Информационный блок */}
          <div className="mt-4 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Прибыль компании от её основной деятельности до учёта налогов, процессинга и ЖКХ
            </p>
          </div>
        </div>

        {/* Блок операционной прибыли */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Общая прибыль - выделенная карточка */}
          <Card className="shadow-card bg-gray-900 border-gray-700 shadow-lg sm:shadow-2xl col-span-1 md:col-span-2 lg:col-span-2" style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-gray-300">Общая прибыль</CardTitle>
              {loading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <DollarSign className="h-4 w-4 text-success" />
              )}
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.total - totals.expenseTotal) || 0} 
                loading={loading}
                className="text-2xl font-bold text-white"
                suffix=" ₽"
              />
              {!loading && <p className="text-sm text-gray-400 mt-2">{formatSelectedPeriod()}</p>}
            </CardContent>
          </Card>
          <Card className={`shadow-card border-l-4 border-l-hotel ${(totals.hotel - totals.hotelExpense) < 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Отель и бани</CardTitle>
              <Building2 className="h-4 w-4 text-hotel" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.hotel - totals.hotelExpense) || 0} 
                loading={loading}
                className={`text-2xl font-bold ${(totals.hotel - totals.hotelExpense) >= 0 ? 'text-success' : 'text-destructive'}`}
                suffix=" ₽"
              />
            </CardContent>
          </Card>
          <Card className={`shadow-card border-l-4 border-l-restaurant ${(totals.restaurant - totals.restaurantExpense) < 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ресторан</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-restaurant" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.restaurant - totals.restaurantExpense) || 0} 
                loading={loading}
                className={`text-2xl font-bold ${(totals.restaurant - totals.restaurantExpense) >= 0 ? 'text-success' : 'text-destructive'}`}
                suffix=" ₽"
              />
            </CardContent>
          </Card>
          <Card className={`shadow-card border-l-4 border-l-spa ${(totals.spa - totals.spaExpense) < 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Спа-центр</CardTitle>
              <Waves className="h-4 w-4 text-spa" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.spa - totals.spaExpense) || 0} 
                loading={loading}
                className={`text-2xl font-bold ${(totals.spa - totals.spaExpense) >= 0 ? 'text-success' : 'text-destructive'}`}
                suffix=" ₽"
              />
            </CardContent>
          </Card>
          {hasPoolData && (
            <Card className={`shadow-card border-l-4 border-l-blue-500 ${(totals.pool - totals.poolExpense) < 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бассейн</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.pool - totals.poolExpense) || 0} 
                  loading={loading}
                  className={`text-2xl font-bold ${(totals.pool - totals.poolExpense) >= 0 ? 'text-success' : 'text-destructive'}`}
                  suffix=" ₽"
                />
              </CardContent>
            </Card>
          )}
          {hasBarData && (
            <Card className={`shadow-card border-l-4 border-l-amber-500 ${(totals.bar - totals.barExpense) < 0 ? 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бар</CardTitle>
                <Wine className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.bar - totals.barExpense) || 0} 
                  loading={loading}
                  className={`text-2xl font-bold ${(totals.bar - totals.barExpense) >= 0 ? 'text-success' : 'text-destructive'}`}
                  suffix=" ₽"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Заголовок блока выручки */}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-foreground tracking-tight font-angry">Выручка 🔥</h2>
            {revenueGrowth !== null && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium cursor-help ${
                      revenueGrowth >= 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {revenueGrowth >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3 rotate-180" />
                      )}
                      {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(2)}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="glassmorphism-tooltip">
                    <p>Прирост к прошлому месяцу</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-3 w-3" />
          )}
          <span>Источник:</span>
          <a 
            href="https://docs.google.com/spreadsheets/d/1l3eqLuN4wQik65QMQpsO-b-wYSPKQbEpVIWZwJ2PQUQ/edit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Выручка
            <ExternalLink className="h-3 w-3" />
          </a>
          <span>•</span>
          <span>
            {loading ? (
              <span className="text-primary">Обновление...</span>
            ) : (
              lastModified 
                ? new Date(lastModified).toLocaleDateString('ru-RU') + ' ' + new Date(lastModified).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-card bg-gray-900 border-gray-700 shadow-lg sm:shadow-2xl" style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-gray-300">Общая выручка</CardTitle>
              {loading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
              <TrendingUp className="h-4 w-4 text-success" />
              )}
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.total) || 0} 
                loading={loading}
                className="text-2xl font-bold text-white"
                suffix=" ₽"
              />
              {!loading && <p className="text-xs text-gray-400 mt-1">{formatSelectedPeriod()}</p>}
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-hotel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Отель и бани</CardTitle>
              <Building2 className="h-4 w-4 text-hotel" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.hotel) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-restaurant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ресторан</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-restaurant" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.restaurant) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-spa">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Спа-центр</CardTitle>
              <Waves className="h-4 w-4 text-spa" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.spa) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
            </CardContent>
          </Card>

          {hasPoolData && (
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бассейн</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.pool) || 0} 
                  loading={loading}
                  className="text-2xl font-bold text-foreground"
                  suffix=" ₽"
                />
              </CardContent>
            </Card>
          )}

          {hasBarData && (
            <Card className="shadow-card border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бар</CardTitle>
                <Wine className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.bar) || 0} 
                  loading={loading}
                  className="text-2xl font-bold text-foreground"
                  suffix=" ₽"
                />
              </CardContent>
            </Card>
          )}
        </div>

        <RevenueBreakdown data={data} />

        {/* Заголовок блока расходов */}
        <div className="mt-8 mb-4">
          <h2 className="text-3xl font-bold text-foreground font-angry">Расходы 😢</h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-3 w-3" />
          )}
          <span>Источник расходов:</span>
          <a 
            href="https://docs.google.com/spreadsheets/d/1-QEkDRiGebdqrKt30NtCOtqyv1izztcNevy9Gtkm9HQ/edit" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Расходы
            <ExternalLink className="h-3 w-3" />
          </a>
          <span>•</span>
          <span>
            {loading ? (
              <span className="text-primary">Обновление...</span>
            ) : (
              expenseLastModified 
                ? new Date(expenseLastModified).toLocaleDateString('ru-RU') + ' ' + new Date(expenseLastModified).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                : new Date().toLocaleDateString('ru-RU') + ' ' + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            )}
          </span>
        </div>

        {/* Блок расходов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="shadow-card bg-gray-900 border-gray-700 shadow-lg sm:shadow-2xl" style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-gray-300">Общие расходы</CardTitle>
              {loading ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.expenseTotal) || 0} 
                loading={loading}
                className="text-2xl font-bold text-white"
                suffix=" ₽"
              />
              {!loading && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">{formatSelectedPeriod()}</p>
                  {(expensePaymentMethods.total.cash > 0 || expensePaymentMethods.total.account > 0) && (
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-gray-400">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>💵</span>
                            </TooltipTrigger>
                            <TooltipContent className="glassmorphism-tooltip">
                              <p>Наличные</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="font-medium text-white">{Math.round(expensePaymentMethods.total.cash).toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>🏦</span>
                            </TooltipTrigger>
                            <TooltipContent className="glassmorphism-tooltip">
                              <p>По счету</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="font-medium text-white">{Math.round(expensePaymentMethods.total.account).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-hotel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Отель и бани</CardTitle>
              <Building2 className="h-4 w-4 text-hotel" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.hotelExpense) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
              {!loading && (expensePaymentMethods.hotel.cash > 0 || expensePaymentMethods.hotel.account > 0) && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>💵</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Наличные</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.hotel.cash).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>🏦</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>По счету</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.hotel.account).toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-restaurant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ресторан</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-restaurant" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.restaurantExpense) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
              {!loading && (expensePaymentMethods.restaurant.cash > 0 || expensePaymentMethods.restaurant.account > 0) && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>💵</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Наличные</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.restaurant.cash).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>🏦</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>По счету</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.restaurant.account).toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-spa">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Спа-центр</CardTitle>
              <Waves className="h-4 w-4 text-spa" />
            </CardHeader>
            <CardContent className="py-3">
              <AnimatedNumber 
                value={Number(totals.spaExpense) || 0} 
                loading={loading}
                className="text-2xl font-bold text-foreground"
                suffix=" ₽"
              />
              {!loading && (expensePaymentMethods.spa.cash > 0 || expensePaymentMethods.spa.account > 0) && (
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>💵</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Наличные</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.spa.cash).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>🏦</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>По счету</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{Math.round(expensePaymentMethods.spa.account).toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {hasPoolExpenseData && (
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бассейн</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.poolExpense) || 0} 
                  loading={loading}
                  className="text-2xl font-bold text-foreground"
                  suffix=" ₽"
                />
                {!loading && (expensePaymentMethods.pool.cash > 0 || expensePaymentMethods.pool.account > 0) && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>💵</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Наличные</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{Math.round(expensePaymentMethods.pool.cash).toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>🏦</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>По счету</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{Math.round(expensePaymentMethods.pool.account).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {hasBarExpenseData && (
            <Card className="shadow-card border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-muted-foreground">Бар</CardTitle>
                <Wine className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="py-3">
                <AnimatedNumber 
                  value={Number(totals.barExpense) || 0} 
                  loading={loading}
                  className="text-2xl font-bold text-foreground"
                  suffix=" ₽"
                />
                {!loading && (expensePaymentMethods.bar.cash > 0 || expensePaymentMethods.bar.account > 0) && (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>💵</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Наличные</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{Math.round(expensePaymentMethods.bar.cash).toLocaleString("ru-RU")} ₽</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>🏦</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>По счету</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium">{Math.round(expensePaymentMethods.bar.account).toLocaleString("ru-RU")} ₽</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <ExpenseBreakdown data={data} />

        <div 
            className="flex items-center gap-2 cursor-pointer glassmorphism-hover p-2 rounded-xl"
            onClick={() => setShowExpenseCategories(!showExpenseCategories)}
        >
            <h2 className="text-lg font-semibold text-foreground">Топ-15 статей расходов</h2>
            {showExpenseCategories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>

          {showExpenseCategories && <ExpenseCategories data={data} periodText={formatSelectedPeriod()} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DailyLines data={data} />
          <UnitsBars data={data} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <RevenuePie data={data} />
          <ExpensePie data={data} />
          <ExpenseCategoriesPie data={data} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Операции</h2>
        <FinanceTable data={data} />
        </div>
      </div>

      {/* Подвал */}
      <footer className="mt-12 pt-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Кедровый Остров
          </div>
          <div>
            Разработчик:{" "}
            <a 
              href="https://t.me/iamserdyuk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Костик ❤️
            </a>
          </div>
        </div>
      </footer>

        {/* Зафиксированное мобильное меню */}
        <div className="sm:hidden fixed top-3 right-4 z-50">
          <div className="relative mobile-menu-container">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-button w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl hover:bg-white/30 hover:scale-110 active:scale-95 active:bg-white/20 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-0"
              aria-label="Открыть меню"
            >
              <div className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : 'rotate-0'}`}>
                {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </div>
            </button>
            
            {/* Выпадающее меню с анимацией */}
            <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform ${
              isMobileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              <div className="py-2">
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Сводно
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Операции
                </a>
                        <a 
                          href="/about" 
                          className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          О приложении
                        </a>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 transition-colors duration-200"
                  title="Профиль пользователя"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Профиль
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка "Scroll to Top" - только для мобильной версии */}
        {showScrollToTop && (
          <div className="fixed bottom-6 right-6 z-50 sm:hidden">
            <button
              onClick={scrollToTop}
              className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-foreground shadow-xl hover:bg-white/30 hover:scale-110 active:scale-95 active:bg-white/20 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-0"
              aria-label="Прокрутить наверх"
            >
              <ArrowUp className="h-6 w-6" />
            </button>
          </div>
        )}
    </div>
  );
};

export default Index;