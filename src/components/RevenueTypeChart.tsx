import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

interface RevenueData {
  date: string;
  unit: string;
  type: string;
  amount: number;
}

interface RevenueTypeChartProps {
  data: RevenueData[];
}

const COLORS = {
  cash: "hsl(var(--cash-color))",
  bank: "hsl(var(--bank-color))",
  card: "hsl(var(--card-color))",
  "legal-account": "hsl(var(--legal-account-color))",
  "personal-account": "hsl(var(--personal-account-color))",
  "online-payment": "hsl(var(--online-payment-color))",
  terminal: "hsl(var(--terminal-color))",
  "hotel-cash": "hsl(var(--hotel-cash-color))"
};

const NAMES = {
  cash: "Наличные",
  bank: "Расчетный счет", 
  card: "Эквайринг",
  "legal-account": "Счет юр.лица",
  "personal-account": "Счет физ.лица",
  "online-payment": "Онлайн оплаты",
  terminal: "Терминал",
  "hotel-cash": "Наличка"
};

export const RevenueTypeChart = ({ data }: RevenueTypeChartProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showCustomTooltip, setShowCustomTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState<any>(null);
  
  // Группируем данные по типам оплаты
  const allTypes = ["cash", "bank", "card", "legal-account", "personal-account", "online-payment", "terminal", "hotel-cash"];
  const chartData = allTypes.map(type => ({
    name: NAMES[type as keyof typeof NAMES],
    value: data.filter(item => item.type === type).reduce((sum, item) => sum + item.amount, 0),
    type: type
  })).filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const handleLegendClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
    
    // Показываем подсказку при клике на легенду
    if (activeIndex !== index) {
      const total = chartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = total > 0 ? ((chartData[index].value / total) * 100).toFixed(1) : 0;
      
      setTooltipContent({
        name: chartData[index].name,
        value: chartData[index].value,
        percentage: percentage,
        color: COLORS[chartData[index].type as keyof typeof COLORS]
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
      <div className="flex justify-center gap-4 mt-2 flex-wrap">
        {payload.map((entry: any, index: number) => (
          <div
            key={entry.value}
            className="flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => handleLegendClick(index)}
            style={{
              opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1,
              fontWeight: activeIndex === index ? 'bold' : 'normal'
            }}
          >
            <div
              className="w-3 h-3 rounded-full transition-all duration-200"
              style={{ 
                backgroundColor: entry.color,
                transform: activeIndex === index ? 'scale(1.2)' : 'scale(1)',
                boxShadow: activeIndex === index ? `0 0 8px ${entry.color}40` : 'none'
              }}
            />
            <span className="text-xs">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Card className="shadow-elevated relative">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Структура выручки по типам оплаты
        </CardTitle>
      </CardHeader>
      
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
      
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              stroke="none"
              strokeWidth={0}
              onClick={handlePieClick}
              activeIndex={activeIndex}
            >
              {chartData.map((entry, index) => {
                const isActive = activeIndex === index;
                const RADIAN = Math.PI / 180;
                // Вычисляем средний угол для этой дольки
                const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
                const startAngle = chartData.slice(0, index).reduce((sum, item) => sum + (item.value / totalValue) * 360, 0);
                const endAngle = startAngle + (chartData[index].value / totalValue) * 360;
                const midAngle = (startAngle + endAngle) / 2;
                
                const sin = Math.sin(-RADIAN * midAngle);
                const cos = Math.cos(-RADIAN * midAngle);
                
                // Анимация выезжания только для активного элемента
                const offsetX = isActive ? cos * 15 : 0;
                const offsetY = isActive ? sin * 15 : 0;
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.type as keyof typeof COLORS]}
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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-elevated)"
              }}
              formatter={(value: number) => [
                `${value.toLocaleString("ru-RU")} ₽ (${((value / total) * 100).toFixed(1)}%)`,
                ""
              ]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};