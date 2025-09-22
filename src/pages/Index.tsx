import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, TrendingUp, Building2, UtensilsCrossed, Waves } from "lucide-react";
import { RevenueChart } from "@/components/RevenueChart";
import { RevenueTable } from "@/components/RevenueTable";
import { BusinessUnitChart } from "@/components/BusinessUnitChart";
import { RevenueTypeChart } from "@/components/RevenueTypeChart";
import { DateRangePicker } from "@/components/DateRangePicker";
import { FilterPanel } from "@/components/FilterPanel";

// Mock data
const mockData = [
  // Отель - расширенные типы оплаты
  { date: "2024-01-15", unit: "hotel", type: "legal-account", amount: 120000 },
  { date: "2024-01-15", unit: "hotel", type: "personal-account", amount: 85000 },
  { date: "2024-01-15", unit: "hotel", type: "online-payment", amount: 65000 },
  { date: "2024-01-15", unit: "hotel", type: "terminal", amount: 45000 },
  { date: "2024-01-15", unit: "hotel", type: "hotel-cash", amount: 35000 },
  // Ресторан - стандартные типы
  { date: "2024-01-15", unit: "restaurant", type: "cash", amount: 25000 },
  { date: "2024-01-15", unit: "restaurant", type: "bank", amount: 35000 },
  { date: "2024-01-15", unit: "restaurant", type: "card", amount: 55000 },
  // Спа - стандартные типы
  { date: "2024-01-15", unit: "spa", type: "cash", amount: 15000 },
  { date: "2024-01-15", unit: "spa", type: "bank", amount: 28000 },
  { date: "2024-01-15", unit: "spa", type: "card", amount: 32000 },
  // Следующий день
  { date: "2024-01-16", unit: "hotel", type: "legal-account", amount: 135000 },
  { date: "2024-01-16", unit: "hotel", type: "personal-account", amount: 90000 },
  { date: "2024-01-16", unit: "hotel", type: "online-payment", amount: 72000 },
  { date: "2024-01-16", unit: "hotel", type: "terminal", amount: 52000 },
  { date: "2024-01-16", unit: "hotel", type: "hotel-cash", amount: 38000 },
  { date: "2024-01-16", unit: "restaurant", type: "cash", amount: 28000 },
  { date: "2024-01-16", unit: "restaurant", type: "bank", amount: 42000 },
  { date: "2024-01-16", unit: "restaurant", type: "card", amount: 62000 },
  { date: "2024-01-16", unit: "spa", type: "cash", amount: 18000 },
  { date: "2024-01-16", unit: "spa", type: "bank", amount: 31000 },
  { date: "2024-01-16", unit: "spa", type: "card", amount: 38000 },
];

const Index = () => {
  const [selectedDateRange, setSelectedDateRange] = useState({ from: new Date(2024, 0, 15), to: new Date(2024, 0, 16) });
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate totals
  const totalRevenue = mockData.reduce((sum, item) => sum + item.amount, 0);
  const hotelTotal = mockData.filter(item => item.unit === "hotel").reduce((sum, item) => sum + item.amount, 0);
  const restaurantTotal = mockData.filter(item => item.unit === "restaurant").reduce((sum, item) => sum + item.amount, 0);
  const spaTotal = mockData.filter(item => item.unit === "spa").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Дашборд выручки</h1>
            <p className="text-muted-foreground mt-2">Аналитика по бизнес-юнитам компании</p>
          </div>
          
          <div className="flex items-center gap-4">
            <DateRangePicker 
              dateRange={selectedDateRange}
              onDateRangeChange={setSelectedDateRange}
            />
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Фильтры
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            selectedUnit={selectedUnit}
            selectedType={selectedType}
            onUnitChange={setSelectedUnit}
            onTypeChange={setSelectedType}
          />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общая выручка
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalRevenue.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-success mt-1">
                +12.5% к прошлому периоду
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-hotel">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Отель и бани
              </CardTitle>
              <Building2 className="h-4 w-4 text-hotel" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {hotelTotal.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-success mt-1">
                +8.2% к прошлому периоду
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-restaurant">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ресторан
              </CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-restaurant" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {restaurantTotal.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-success mt-1">
                +15.7% к прошлому периоду
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-spa">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Спа-центр
              </CardTitle>
              <Waves className="h-4 w-4 text-spa" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {spaTotal.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-success mt-1">
                +22.1% к прошлому периоду
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={mockData} />
          <BusinessUnitChart data={mockData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueTypeChart data={mockData} />
          <RevenueTable data={mockData} />
        </div>
      </div>
    </div>
  );
};

export default Index;