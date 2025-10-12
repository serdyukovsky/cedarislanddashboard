import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Filter, X, User, Zap, Menu, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/DateRangePicker";

interface Transaction {
  type: 'revenue' | 'expense';
  date: string;
  unit: string;
  // Revenue fields
  cash?: number;
  bank?: number;
  acquiring?: number;
  total?: number;
  breakdown?: any;
  // Expense fields
  amount?: number;
  category?: string;
  paymentMethod?: 'cash' | 'account';
}

const unitLabels: Record<string, string> = {
  hotel: "Отель и бани",
  restaurant: "Ресторан",
  spa: "Спа-центр",
  pool: "Бассейн",
  bar: "Бар",
  all: "Все юниты"
};

export default function Operations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Получаем параметры из URL
  const initialUnit = searchParams.get('unit') || 'all';
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';
  const initialType = searchParams.get('type') || 'all';
  const initialCategory = searchParams.get('category') || '';
  const initialCategoryType = searchParams.get('categoryType') || '';
  
  const [unit, setUnit] = useState(initialUnit);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [type, setType] = useState(initialType);
  const [category, setCategory] = useState(initialCategory);
  const [categoryType, setCategoryType] = useState(initialCategoryType);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  
  // Функция для проверки соответствия категории типу
  const matchesCategoryType = (cat: string, catType: string): boolean => {
    if (!catType) return true;
    
    const normalized = cat.toLowerCase();
    
    if (catType === 'fot') {
      return normalized.includes('фот') || 
             normalized.includes('зп') || 
             normalized.includes('специалист') ||
             normalized.includes('трансфер') ||
             normalized.includes('персонал');
    } else if (catType === 'purchases') {
      return normalized.includes('продукт') || 
             normalized.includes('расходн') ||
             normalized.includes('материал');
    } else if (catType === 'other') {
      // Прочее - всё что не ФОТ и не закупки
      const isFot = normalized.includes('фот') || normalized.includes('зп') || 
                    normalized.includes('специалист') || normalized.includes('трансфер') || 
                    normalized.includes('персонал');
      const isPurchases = normalized.includes('продукт') || normalized.includes('расходн') || 
                          normalized.includes('материал');
      return !isFot && !isPurchases;
    }
    
    return true;
  };

  // Загружаем транзакции
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (unit !== 'all') params.append('unit', unit);
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (type !== 'all') params.append('type', type);
        if (category) params.append('category', category);
        
        const response = await fetch(`/api/transactions?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        // Фильтруем по типу категории на клиенте, если указан categoryType
        let filtered = data.transactions || [];
        if (categoryType && type === 'expense') {
          filtered = filtered.filter((t: Transaction) => 
            t.category && matchesCategoryType(t.category, categoryType)
          );
        }
        
        // Убираем транзакции с нулевыми суммами
        filtered = filtered.filter((t: Transaction) => {
          if (t.type === 'revenue') {
            return (t.total || 0) > 0;
          } else {
            return (t.amount || 0) > 0;
          }
        });
        
        setTransactions(filtered);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [unit, from, to, type, category, categoryType]);

  // Обновляем URL при изменении фильтров
  useEffect(() => {
    const params = new URLSearchParams();
    if (unit !== 'all') params.append('unit', unit);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (type !== 'all') params.append('type', type);
    if (category) params.append('category', category);
    if (categoryType) params.append('categoryType', categoryType);
    
    setSearchParams(params, { replace: true });
  }, [unit, from, to, type, category, categoryType, setSearchParams]);

  // Вычисляем суммарную информацию
  const summary = useMemo(() => {
    const revenueTransactions = transactions.filter(t => t.type === 'revenue');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      totalRevenue,
      totalExpense,
      profit: totalRevenue - totalExpense,
      revenueCount: revenueTransactions.length,
      expenseCount: expenseTransactions.length,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Функция экспорта в CSV
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Дата', 'Юнит', 'Тип', 'Сумма', 'Категория', 'Способ оплаты'];
    const rows = transactions.map(t => [
      t.date,
      unitLabels[t.unit] || t.unit,
      t.type === 'revenue' ? 'Доход' : 'Расход',
      t.type === 'revenue' ? (t.total || 0).toString() : (t.amount || 0).toString(),
      t.category || '-',
      t.paymentMethod === 'cash' ? 'Наличные' : t.paymentMethod === 'account' ? 'Счет' : '-'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Сброс фильтров
  const resetFilters = () => {
    setUnit('all');
    setFrom('');
    setTo('');
    setType('all');
    setCategory('');
    setCategoryType('');
  };

  const handleBack = () => {
    navigate('/');
  };
  
  // Форматирование даты в DD.MM.YYYY
  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Мобильная версия */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg"
              aria-label="Назад"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Операции</h1>
              <p className="text-sm text-gray-600">Детальный просмотр транзакций</p>
            </div>
          </div>
          
          <Button
            onClick={exportToCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Header - Десктопная версия (как на главной) */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          {/* Логотип для десктопа */}
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
          
          {/* Меню навигации */}
          <nav className="flex items-center gap-8 ml-auto">
            <div className="flex items-center gap-8">
              <a href="/summary" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Сводно
              </a>
              <a href="/operations" className="text-sm font-medium text-foreground transition-colors">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Всего транзакций</div>
              <div className="text-2xl font-bold">{summary.totalCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Доходы</div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(summary.totalRevenue).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs text-gray-500">{summary.revenueCount} операций</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-gray-600">Расходы</div>
              <div className="text-2xl font-bold text-red-600">
                {Math.round(summary.totalExpense).toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-xs text-gray-500">{summary.expenseCount} операций</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="h-4 w-4" />
                Фильтры
                {categoryType && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {categoryType === 'fot' ? 'ФОТ' : categoryType === 'purchases' ? 'Закупки' : 'Прочее'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={exportToCSV}
                  disabled={transactions.length === 0}
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Экспорт в CSV</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Сбросить
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Юнит</label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все юниты</SelectItem>
                    <SelectItem value="hotel">Отель и бани</SelectItem>
                    <SelectItem value="restaurant">Ресторан</SelectItem>
                    <SelectItem value="spa">Спа-центр</SelectItem>
                    <SelectItem value="pool">Бассейн</SelectItem>
                    <SelectItem value="bar">Бар</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Тип</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="revenue">Доходы</SelectItem>
                    <SelectItem value="expense">Расходы</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Дата от</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Дата до</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Категория</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Поиск..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">Ошибка: {error}</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Нет транзакций по выбранным фильтрам</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Дата</th>
                      <th className="text-left p-3 font-medium text-gray-700">Юнит</th>
                      <th className="text-left p-3 font-medium text-gray-700">Тип</th>
                      <th className="text-right p-3 font-medium text-gray-700">Сумма</th>
                      <th className="text-left p-3 font-medium text-gray-700">Категория</th>
                      <th className="text-left p-3 font-medium text-gray-700">Способ оплаты</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3">{formatDate(t.date)}</td>
                        <td className="p-3">{unitLabels[t.unit] || t.unit}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            t.type === 'revenue' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {t.type === 'revenue' ? 'Доход' : 'Расход'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {t.type === 'revenue' 
                            ? (t.total || 0).toLocaleString('ru-RU')
                            : (t.amount || 0).toLocaleString('ru-RU')
                          } ₽
                        </td>
                        <td className="p-3 text-gray-600">{t.category || '-'}</td>
                        <td className="p-3">
                          {t.paymentMethod === 'cash' ? (
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">Наличные</span>
                          ) : t.paymentMethod === 'account' ? (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-700">Счет</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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
                  className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Сводно
                </a>
                <a
                  href="/operations"
                  className="block px-4 py-3 text-sm text-gray-900 font-medium bg-gray-50 hover:bg-gray-100 transition-colors"
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
}

