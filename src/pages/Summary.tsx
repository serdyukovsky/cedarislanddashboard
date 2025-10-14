import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Zap, TrendingUp, TrendingDown, ArrowLeft, Menu, X, ArrowUp } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AggregatedDailyUnit } from "@/server/types";

interface PeriodData {
  profit: number;
  revenue: number;
  expense: number;
  days: number;
}

interface UnitStats {
  profit: number;
  revenue: number;
  expense: number;
}

const Summary = () => {
  const [comparisonMode, setComparisonMode] = useState<'month' | 'year' | 'custom'>('month');
  
  const [period1From, setPeriod1From] = useState('');
  const [period1To, setPeriod1To] = useState('');
  const [period2From, setPeriod2From] = useState('');
  const [period2To, setPeriod2To] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [period1Data, setPeriod1Data] = useState<AggregatedDailyUnit[]>([]);
  const [period2Data, setPeriod2Data] = useState<AggregatedDailyUnit[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
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
      setShowScrollToTop(scrollTop > 300);
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
  
  // Инициализация (текущий месяц vs предыдущий месяц)
  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (0 = январь, 9 = октябрь)
    
    // Вспомогательная функция для форматирования даты в локальном времени
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Текущий месяц (период 1)
    const period1Start = new Date(currentYear, currentMonth, 1);
    const period1End = new Date(currentYear, currentMonth + 1, 0);
    
    // Предыдущий месяц (период 2)
    const period2Start = new Date(currentYear, currentMonth - 1, 1);
    const period2End = new Date(currentYear, currentMonth, 0);
    
    const p1From = formatDate(period1Start);
    const p1To = formatDate(period1End);
    const p2From = formatDate(period2Start);
    const p2To = formatDate(period2End);
    
    setPeriod1From(p1From);
    setPeriod1To(p1To);
    setPeriod2From(p2From);
    setPeriod2To(p2To);
    
    console.log('📅 Initialized dates:', {
      period1: `${p1From} - ${p1To}`,
      period2: `${p2From} - ${p2To}`
    });
  }, []);
  
  // Быстрый выбор
  const handleQuickSelect = (mode: 'month' | 'year') => {
    setComparisonMode(mode);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Вспомогательная функция для форматирования даты в локальном времени
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (mode === 'month') {
      // Текущий месяц vs предыдущий месяц
      const period1Start = new Date(currentYear, currentMonth, 1);
      const period1End = new Date(currentYear, currentMonth + 1, 0);
      const period2Start = new Date(currentYear, currentMonth - 1, 1);
      const period2End = new Date(currentYear, currentMonth, 0);
      
      setPeriod1From(formatDate(period1Start));
      setPeriod1To(formatDate(period1End));
      setPeriod2From(formatDate(period2Start));
      setPeriod2To(formatDate(period2End));
    } else {
      const period1Start = new Date(currentYear, 0, 1);
      const period1End = new Date(currentYear, 11, 31);
      const period2Start = new Date(currentYear - 1, 0, 1);
      const period2End = new Date(currentYear - 1, 11, 31);
      
      setPeriod1From(formatDate(period1Start));
      setPeriod1To(formatDate(period1End));
      setPeriod2From(formatDate(period2Start));
      setPeriod2To(formatDate(period2End));
    }
  };
  
  // Загрузка данных
  useEffect(() => {
    if (!period1From || !period1To || !period2From || !period2To) {
      console.log('⏳ Waiting for dates to be set...');
      return;
    }
    
    const fetchData = async () => {
      console.log('📊 Fetching data for Summary page...', {
        period1: `${period1From} - ${period1To}`,
        period2: `${period2From} - ${period2To}`
      });
      
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/finance?unit=all&from=${period1From}&to=${period1To}&includeBreakfast=true`),
          fetch(`/api/finance?unit=all&from=${period2From}&to=${period2To}&includeBreakfast=true`)
        ]);
        
        if (!res1.ok || !res2.ok) {
          console.error('❌ API response error:', {
            res1Status: res1.status,
            res2Status: res2.status
          });
          throw new Error('Failed to fetch data');
        }
        
        const [data1, data2] = await Promise.all([
          res1.json(),
          res2.json()
        ]);
        
        console.log('✅ Data fetched successfully:', {
          period1Records: data1.data?.length || 0,
          period2Records: data2.data?.length || 0
        });
        
        setPeriod1Data(data1.data || []);
        setPeriod2Data(data2.data || []);
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period1From, period1To, period2From, period2To]);
  
  // Агрегация данных
  const aggregated = useMemo(() => {
    const aggregate = (data: AggregatedDailyUnit[]) => {
      const total = { profit: 0, revenue: 0, expense: 0 };
      const units: Record<string, UnitStats> = {};
      
      data.forEach(item => {
        total.profit += item.profit || 0;
        total.revenue += item.revenue?.total || 0;
        total.expense += item.expense?.total || 0;
        
        const unit = item.unit;
        if (!units[unit]) {
          units[unit] = { profit: 0, revenue: 0, expense: 0 };
        }
        units[unit].profit += item.profit || 0;
        units[unit].revenue += item.revenue?.total || 0;
        units[unit].expense += item.expense?.total || 0;
      });
      
      return { total, units };
    };
    
    return {
      period1: aggregate(period1Data),
      period2: aggregate(period2Data)
    };
  }, [period1Data, period2Data]);
  
  // Детализация выручки
  const revenueBreakdown = useMemo(() => {
    const aggregate = (data: AggregatedDailyUnit[]) => {
      const totals = { bankLegal: 0, bankIndividual: 0, online: 0, acquiring: 0, cash: 0 };
      
      data.forEach(d => {
        const br = d.revenue?.breakdown;
        if (br) {
          totals.bankLegal += Number(br.bankLegal) || 0;
          totals.bankIndividual += Number(br.bankIndividual) || 0;
          totals.online += Number(br.online) || 0;
          totals.acquiring += Number(br.acquiringTerminal) || 0;
          totals.cash += Number(br.cash) || 0;
        }
      });
      
      return totals;
    };
    
    return {
      period1: aggregate(period1Data),
      period2: aggregate(period2Data)
    };
  }, [period1Data, period2Data]);
  
  // Детализация расходов
  const expenseBreakdown = useMemo(() => {
    const aggregate = (data: AggregatedDailyUnit[]) => {
      const totals = { fot: 0, purchases: 0, other: 0 };
      
      data.forEach(record => {
        const expenseDetails = (record as any).expenseDetails;
        
        if (expenseDetails?.categoryDetails) {
          expenseDetails.categoryDetails.forEach((detail: any) => {
            if (!detail.category || !detail.amount) return;
            
            const normalized = detail.category.toLowerCase();
            
            // ФОТ категории (исключаем униформу)
            if ((normalized.includes('фот') || normalized.includes('зп') || 
                normalized.includes('специалист') || normalized.includes('трансфер')) &&
                !normalized.includes('униформ')) {
              totals.fot += detail.amount;
            }
            // Специальный случай: "трансфер для персонала" - это ФОТ
            else if (normalized.includes('трансфер') && normalized.includes('персонал')) {
              totals.fot += detail.amount;
            }
            // Закупки
            else if (normalized.includes('продукт') || normalized.includes('расходн') || 
                       normalized.includes('материал')) {
              totals.purchases += detail.amount;
            } else {
              totals.other += detail.amount;
            }
          });
        }
      });
      
      return totals;
    };
    
    return {
      period1: aggregate(period1Data),
      period2: aggregate(period2Data)
    };
  }, [period1Data, period2Data]);
  
  // Данные для графика
  const chartData = useMemo(() => {
    const dailyMap1 = new Map<string, any>();
    const dailyMap2 = new Map<string, any>();
    
    period1Data.forEach((item: any) => {
      const date = item.date;
      if (!dailyMap1.has(date)) {
        dailyMap1.set(date, { date, profit: 0, revenue: 0, expense: 0 });
      }
      const day = dailyMap1.get(date);
      day.profit += item.profit || 0;
      day.revenue += item.revenue?.total || 0;
      day.expense += item.expense?.total || 0;
    });
    
    period2Data.forEach((item: any) => {
      const date = item.date;
      if (!dailyMap2.has(date)) {
        dailyMap2.set(date, { date, profit: 0, revenue: 0, expense: 0 });
      }
      const day = dailyMap2.get(date);
      day.profit += item.profit || 0;
      day.revenue += item.revenue?.total || 0;
      day.expense += item.expense?.total || 0;
    });
    
    const data1 = Array.from(dailyMap1.values()).sort((a, b) => a.date.localeCompare(b.date));
    const data2 = Array.from(dailyMap2.values()).sort((a, b) => a.date.localeCompare(b.date));
    
    const maxLength = Math.max(data1.length, data2.length);
    const combined = [];
    for (let i = 0; i < maxLength; i++) {
      combined.push({
        day: i + 1,
        profit1: data1[i]?.profit || 0,
        revenue1: data1[i]?.revenue || 0,
        expense1: data1[i]?.expense || 0,
        profit2: data2[i]?.profit || 0,
        revenue2: data2[i]?.revenue || 0,
        expense2: data2[i]?.expense || 0,
      });
    }
    
    return combined;
  }, [period1Data, period2Data]);
  
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
  
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const isFullMonth = (from: string, to: string): { isMonth: boolean; monthName?: string; year?: number } => {
    const dateFrom = new Date(from);
    const dateTo = new Date(to);
    
    if (dateFrom.getDate() !== 1) return { isMonth: false };
    
    const lastDay = new Date(dateTo.getFullYear(), dateTo.getMonth() + 1, 0).getDate();
    if (dateTo.getDate() !== lastDay) return { isMonth: false };
    
    if (dateFrom.getMonth() !== dateTo.getMonth() || dateFrom.getFullYear() !== dateTo.getFullYear()) {
      return { isMonth: false };
    }
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    return { 
      isMonth: true, 
      monthName: monthNames[dateFrom.getMonth()],
      year: dateFrom.getFullYear()
    };
  };
  
  const getPeriodLabel = (from: string, to: string): string => {
    const check = isFullMonth(from, to);
    if (check.isMonth) {
      return `${check.monthName} ${check.year}`;
    }
    
    const dateFrom = new Date(from);
    const dateTo = new Date(to);
    return `${dateFrom.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} - ${dateTo.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  const unitLabels: Record<string, string> = {
    hotel: 'Отель и бани',
    restaurant: 'Ресторан',
    spa: 'Спа-центр',
    pool: 'Бассейн',
    bar: 'Бар',
  };

  const days1 = new Set(period1Data.map(d => d.date)).size || 1;
  const days2 = new Set(period2Data.map(d => d.date)).size || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* Header - Мобильная версия */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
              aria-label="Назад"
            >
              <ArrowLeft className="h-6 w-6" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Сводно</h1>
              <p className="text-sm text-gray-600">Сравнительный анализ</p>
            </div>
          </div>
        </div>

        {/* Header - Десктопная версия */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img 
              src="https://static.tildacdn.com/tild3136-6132-4665-b939-316466376231/logo.svg" 
              alt="Кедровый Остров" 
              className="h-12 w-auto brightness-0"
            />
            <div className="inline-flex items-start gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border -mt-10">
              <span>Dashboard</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 ml-1">
                <Zap className="h-3 w-3" />
              </span>
            </div>
          </a>
          
          <nav className="flex items-center gap-8 ml-auto">
            <div className="flex items-center gap-8">
              <a href="/summary" className="text-sm font-medium text-foreground transition-colors">
                Сводно
              </a>
              <a href="/operations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Операции
              </a>
              <a href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                О приложении
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-5 w-5" />
              </a>
            </div>
          </nav>
        </div>

        {/* Фильтры */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={comparisonMode === 'month' ? 'default' : 'outline'}
                  onClick={() => handleQuickSelect('month')}
                  size="sm"
                >
                  Месяц к месяцу
                </Button>
                <Button
                  variant={comparisonMode === 'year' ? 'default' : 'outline'}
                  onClick={() => handleQuickSelect('year')}
                  size="sm"
                >
                  Год к году
                </Button>
                <Button
                  variant={comparisonMode === 'custom' ? 'default' : 'outline'}
                  onClick={() => setComparisonMode('custom')}
                  size="sm"
                >
                  Свои даты
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm font-semibold text-blue-600 mb-2">Период 1</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">От</label>
                      <input
                        type="date"
                        value={period1From}
                        onChange={(e) => {
                          setPeriod1From(e.target.value);
                          setComparisonMode('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">До</label>
                      <input
                        type="date"
                        value={period1To}
                        onChange={(e) => {
                          setPeriod1To(e.target.value);
                          setComparisonMode('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-purple-600 mb-2">Период 2</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">От</label>
                      <input
                        type="date"
                        value={period2From}
                        onChange={(e) => {
                          setPeriod2From(e.target.value);
                          setComparisonMode('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">До</label>
                      <input
                        type="date"
                        value={period2To}
                        onChange={(e) => {
                          setPeriod2To(e.target.value);
                          setComparisonMode('custom');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Загрузка...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Операционная прибыль */}
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight font-angry mb-6">Операционная прибыль 💰</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Общая прибыль */}
                <Card 
                  className="shadow-card bg-gray-900 border-gray-700 shadow-lg col-span-1 md:col-span-2"
                  style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-400 mb-4">Общая прибыль</div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-blue-400 mb-1">{getPeriodLabel(period1From, period1To)}</div>
                        <div className="text-3xl font-bold text-white">
                          <AnimatedNumber value={aggregated.period1.total.profit} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-purple-400 mb-1">{getPeriodLabel(period2From, period2To)}</div>
                        <div className="text-2xl font-bold text-gray-300">
                          <AnimatedNumber value={aggregated.period2.total.profit} />
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Дельта:</span>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${calculateChange(aggregated.period1.total.profit, aggregated.period2.total.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(aggregated.period1.total.profit - aggregated.period2.total.profit).toLocaleString('ru-RU')} ₽
                            </div>
                            <div className={`text-sm ${calculateChange(aggregated.period1.total.profit, aggregated.period2.total.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercent(calculateChange(aggregated.period1.total.profit, aggregated.period2.total.profit))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Прибыль по юнитам - компактные карточки */}
                {Object.entries(unitLabels)
                  .filter(([unit]) => {
                    const profit1 = aggregated.period1.units[unit]?.profit || 0;
                    const profit2 = aggregated.period2.units[unit]?.profit || 0;
                    return profit1 !== 0 || profit2 !== 0;
                  })
                  .map(([unit, label]) => {
                    const profit1 = aggregated.period1.units[unit]?.profit || 0;
                    const profit2 = aggregated.period2.units[unit]?.profit || 0;
                    
                    return (
                      <Card key={unit} className="shadow-sm bg-white">
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-gray-600 mb-2">{label}</div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold"><AnimatedNumber value={profit1} /></div>
                            <div className={`text-xs font-bold ${calculateChange(profit1, profit2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(calculateChange(profit1, profit2))}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <AnimatedNumber value={profit2} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* График операционной прибыли */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-4">График операционной прибыли</h3>
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="day" 
                          tickFormatter={(value) => `День ${value}`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString('ru-RU')} 
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `День ${value}`}
                          formatter={(value: number, name: string) => [
                            `${value.toLocaleString('ru-RU')} ₽`, 
                            name === 'profit1' ? getPeriodLabel(period1From, period1To) : getPeriodLabel(period2From, period2To)
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profit1" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name={getPeriodLabel(period1From, period1To)}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="profit2" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name={getPeriodLabel(period2From, period2To)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Выручка */}
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight font-angry mb-6">Выручка 📊</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Общая выручка */}
                <Card className="shadow-card bg-gray-900 border-gray-700 shadow-lg col-span-1 md:col-span-2"
                  style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-400 mb-4">Общая выручка</div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-blue-400 mb-1">{getPeriodLabel(period1From, period1To)}</div>
                        <div className="text-3xl font-bold text-white">
                          <AnimatedNumber value={aggregated.period1.total.revenue} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-purple-400 mb-1">{getPeriodLabel(period2From, period2To)}</div>
                        <div className="text-2xl font-bold text-gray-300">
                          <AnimatedNumber value={aggregated.period2.total.revenue} />
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Дельта:</span>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${calculateChange(aggregated.period1.total.revenue, aggregated.period2.total.revenue) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(aggregated.period1.total.revenue - aggregated.period2.total.revenue).toLocaleString('ru-RU')} ₽
                            </div>
                            <div className={`text-sm ${calculateChange(aggregated.period1.total.revenue, aggregated.period2.total.revenue) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercent(calculateChange(aggregated.period1.total.revenue, aggregated.period2.total.revenue))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Выручка по юнитам - компактные карточки */}
                {Object.entries(unitLabels)
                  .filter(([unit]) => {
                    const revenue1 = aggregated.period1.units[unit]?.revenue || 0;
                    const revenue2 = aggregated.period2.units[unit]?.revenue || 0;
                    return revenue1 !== 0 || revenue2 !== 0;
                  })
                  .map(([unit, label]) => {
                    const revenue1 = aggregated.period1.units[unit]?.revenue || 0;
                    const revenue2 = aggregated.period2.units[unit]?.revenue || 0;
                    
                    return (
                      <Card key={unit} className="shadow-sm bg-white">
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-gray-600 mb-2">{label}</div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold"><AnimatedNumber value={revenue1} /></div>
                            <div className={`text-xs font-bold ${calculateChange(revenue1, revenue2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(calculateChange(revenue1, revenue2))}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <AnimatedNumber value={revenue2} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* Детализация выручки */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
                {[
                  { key: 'bankLegal', label: 'Счёт юр. лица' },
                  { key: 'bankIndividual', label: 'Счёт физ. лица' },
                  { key: 'online', label: 'Онлайн' },
                  { key: 'acquiring', label: 'Эквайринг' },
                  { key: 'cash', label: 'Наличка' }
                ]
                  .filter(item => {
                    const val1 = revenueBreakdown.period1[item.key as keyof typeof revenueBreakdown.period1];
                    const val2 = revenueBreakdown.period2[item.key as keyof typeof revenueBreakdown.period2];
                    return val1 !== 0 || val2 !== 0;
                  })
                  .map(item => {
                    const val1 = revenueBreakdown.period1[item.key as keyof typeof revenueBreakdown.period1];
                    const val2 = revenueBreakdown.period2[item.key as keyof typeof revenueBreakdown.period2];
                    
                    return (
                      <Card key={item.key} className="shadow-sm">
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-gray-600 mb-2">{item.label}</div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold">{Math.round(val1).toLocaleString('ru-RU')} ₽</div>
                            <div className={`text-xs font-bold ${calculateChange(val1, val2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercent(calculateChange(val1, val2))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{Math.round(val2).toLocaleString('ru-RU')} ₽</div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* График выручки */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-4">График выручки</h3>
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="day" 
                          tickFormatter={(value) => `День ${value}`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString('ru-RU')} 
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `День ${value}`}
                          formatter={(value: number, name: string) => [
                            `${value.toLocaleString('ru-RU')} ₽`, 
                            name === 'revenue1' ? getPeriodLabel(period1From, period1To) : getPeriodLabel(period2From, period2To)
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue1" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name={getPeriodLabel(period1From, period1To)}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue2" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name={getPeriodLabel(period2From, period2To)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Расходы */}
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight font-angry mb-6">Расходы 💳</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Общие расходы */}
                <Card className="shadow-card bg-gray-900 border-gray-700 shadow-lg col-span-1 md:col-span-2"
                  style={{boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.4)'}}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-400 mb-4">Общие расходы</div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-blue-400 mb-1">{getPeriodLabel(period1From, period1To)}</div>
                        <div className="text-3xl font-bold text-white">
                          <AnimatedNumber value={aggregated.period1.total.expense} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-purple-400 mb-1">{getPeriodLabel(period2From, period2To)}</div>
                        <div className="text-2xl font-bold text-gray-300">
                          <AnimatedNumber value={aggregated.period2.total.expense} />
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Дельта:</span>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${calculateChange(aggregated.period1.total.expense, aggregated.period2.total.expense) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {(aggregated.period1.total.expense - aggregated.period2.total.expense).toLocaleString('ru-RU')} ₽
                            </div>
                            <div className={`text-sm ${calculateChange(aggregated.period1.total.expense, aggregated.period2.total.expense) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {formatPercent(calculateChange(aggregated.period1.total.expense, aggregated.period2.total.expense))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Расходы по юнитам - компактные карточки */}
                {Object.entries(unitLabels)
                  .filter(([unit]) => {
                    const expense1 = aggregated.period1.units[unit]?.expense || 0;
                    const expense2 = aggregated.period2.units[unit]?.expense || 0;
                    return expense1 !== 0 || expense2 !== 0;
                  })
                  .map(([unit, label]) => {
                    const expense1 = aggregated.period1.units[unit]?.expense || 0;
                    const expense2 = aggregated.period2.units[unit]?.expense || 0;
                    
                    return (
                      <Card key={unit} className="shadow-sm bg-white">
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-gray-600 mb-2">{label}</div>
                          
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold"><AnimatedNumber value={expense1} /></div>
                            <div className={`text-xs font-bold ${calculateChange(expense1, expense2) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatPercent(calculateChange(expense1, expense2))}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            <AnimatedNumber value={expense2} />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>

              {/* График расходов */}
              <div className="mt-8">
                <h3 className="text-xl font-bold text-foreground mb-4">График расходов</h3>
                <Card>
                  <CardContent className="pt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="day" 
                          tickFormatter={(value) => `День ${value}`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          tickFormatter={(value) => value.toLocaleString('ru-RU')} 
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip 
                          labelFormatter={(value) => `День ${value}`}
                          formatter={(value: number, name: string) => [
                            `${value.toLocaleString('ru-RU')} ₽`, 
                            name === 'expense1' ? getPeriodLabel(period1From, period1To) : getPeriodLabel(period2From, period2To)
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expense1" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name={getPeriodLabel(period1From, period1To)}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expense2" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name={getPeriodLabel(period2From, period2To)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Детализация расходов */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
                {[
                  { key: 'fot', label: 'ФОТ' },
                  { key: 'purchases', label: 'Закупки' },
                  { key: 'other', label: 'Прочее' }
                ]
                  .filter(item => {
                    const val1 = expenseBreakdown.period1[item.key as keyof typeof expenseBreakdown.period1];
                    const val2 = expenseBreakdown.period2[item.key as keyof typeof expenseBreakdown.period2];
                    return val1 !== 0 || val2 !== 0;
                  })
                  .map(item => {
                    const val1 = expenseBreakdown.period1[item.key as keyof typeof expenseBreakdown.period1];
                    const val2 = expenseBreakdown.period2[item.key as keyof typeof expenseBreakdown.period2];
                    
                    return (
                      <Card key={item.key} className="shadow-sm">
                        <CardContent className="pt-3 pb-3">
                          <div className="text-xs text-gray-600 mb-2">{item.label}</div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-bold">{Math.round(val1).toLocaleString('ru-RU')} ₽</div>
                            <div className={`text-xs font-bold ${calculateChange(val1, val2) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatPercent(calculateChange(val1, val2))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">{Math.round(val2).toLocaleString('ru-RU')} ₽</div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* Среднедневные показатели */}
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight font-angry mb-6">Среднедневные показатели 📅</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-3">Среднедневная прибыль</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">{getPeriodLabel(period1From, period1To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period1.total.profit / days1).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{getPeriodLabel(period2From, period2To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period2.total.profit / days2).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className={`text-sm font-bold text-right ${calculateChange(aggregated.period1.total.profit / days1, aggregated.period2.total.profit / days2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(calculateChange(aggregated.period1.total.profit / days1, aggregated.period2.total.profit / days2))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-3">Среднедневная выручка</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">{getPeriodLabel(period1From, period1To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period1.total.revenue / days1).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{getPeriodLabel(period2From, period2To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period2.total.revenue / days2).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className={`text-sm font-bold text-right ${calculateChange(aggregated.period1.total.revenue / days1, aggregated.period2.total.revenue / days2) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(calculateChange(aggregated.period1.total.revenue / days1, aggregated.period2.total.revenue / days2))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-3">Среднедневные расходы</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">{getPeriodLabel(period1From, period1To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period1.total.expense / days1).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{getPeriodLabel(period2From, period2To)}:</span>
                        <span className="text-lg font-bold">{Math.round(aggregated.period2.total.expense / days2).toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className={`text-sm font-bold text-right ${calculateChange(aggregated.period1.total.expense / days1, aggregated.period2.total.expense / days2) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatPercent(calculateChange(aggregated.period1.total.expense / days1, aggregated.period2.total.expense / days2))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Эффективность */}
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight font-angry mb-6">Эффективность 📈</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-3">Рентабельность (прибыль / выручка)</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">{getPeriodLabel(period1From, period1To)}:</span>
                        <span className="text-2xl font-bold">
                          {aggregated.period1.total.revenue > 0 ? ((aggregated.period1.total.profit / aggregated.period1.total.revenue) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{getPeriodLabel(period2From, period2To)}:</span>
                        <span className="text-2xl font-bold">
                          {aggregated.period2.total.revenue > 0 ? ((aggregated.period2.total.profit / aggregated.period2.total.revenue) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="text-sm text-gray-600 mb-3">Доля расходов (расходы / выручка)</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600">{getPeriodLabel(period1From, period1To)}:</span>
                        <span className="text-2xl font-bold">
                          {aggregated.period1.total.revenue > 0 ? ((aggregated.period1.total.expense / aggregated.period1.total.revenue) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-600">{getPeriodLabel(period2From, period2To)}:</span>
                        <span className="text-2xl font-bold">
                          {aggregated.period2.total.revenue > 0 ? ((aggregated.period2.total.expense / aggregated.period2.total.revenue) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Динамика по дням */}
            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight font-angry mb-6">Динамика по дням 📈</h2>
              
              <Card className="shadow-lg">
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="day" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        formatter={(value: any) => `${Math.round(value).toLocaleString('ru-RU')} ₽`}
                        labelFormatter={(label) => `День ${label}`}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      
                      <Line type="monotone" dataKey="profit1" stroke="#16a34a" strokeWidth={3}
                        name={`Прибыль (${getPeriodLabel(period1From, period1To)})`}
                        dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="profit2" stroke="#86efac" strokeWidth={2}
                        name={`Прибыль (${getPeriodLabel(period2From, period2To)})`}
                        dot={{ fill: '#86efac', r: 3 }} strokeDasharray="5 5" />
                      
                      <Line type="monotone" dataKey="revenue1" stroke="#2563eb" strokeWidth={3}
                        name={`Выручка (${getPeriodLabel(period1From, period1To)})`}
                        dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="revenue2" stroke="#93c5fd" strokeWidth={2}
                        name={`Выручка (${getPeriodLabel(period2From, period2To)})`}
                        dot={{ fill: '#93c5fd', r: 3 }} strokeDasharray="5 5" />
                      
                      <Line type="monotone" dataKey="expense1" stroke="#dc2626" strokeWidth={3}
                        name={`Расходы (${getPeriodLabel(period1From, period1To)})`}
                        dot={{ fill: '#dc2626', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expense2" stroke="#fca5a5" strokeWidth={2}
                        name={`Расходы (${getPeriodLabel(period2From, period2To)})`}
                        dot={{ fill: '#fca5a5', r: 3 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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
            
            {/* Выпадающее меню */}
            <div className={`absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 transition-all duration-300 ease-in-out transform ${
              isMobileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              <div className="py-2">
                <a
                  href="/summary"
                  className="block px-4 py-3 text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Сводно
                </a>
                <a
                  href="/operations"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Операции
                </a>
                <a
                  href="/about"
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  О приложении
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
    </div>
  );
};

export default Summary;
