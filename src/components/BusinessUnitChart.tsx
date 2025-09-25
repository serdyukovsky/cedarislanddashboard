import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueData {
  date: string;
  unit: string;
  type: string;
  amount: number;
}

interface BusinessUnitChartProps {
  data: RevenueData[];
}

export const BusinessUnitChart = ({ data }: BusinessUnitChartProps) => {
  const chartData = [
    {
      unit: "Отель и бани",
      total: data.filter(item => item.unit === "hotel").reduce((sum, item) => sum + item.amount, 0),
      // Для отеля группируем новые типы оплаты
      "Онлайн и счета": data.filter(item => 
        item.unit === "hotel" && 
        ["legal-account", "personal-account", "online-payment"].includes(item.type)
      ).reduce((sum, item) => sum + item.amount, 0),
      "Терминал": data.filter(item => item.unit === "hotel" && item.type === "terminal").reduce((sum, item) => sum + item.amount, 0),
      "Наличные": data.filter(item => item.unit === "hotel" && item.type === "hotel-cash").reduce((sum, item) => sum + item.amount, 0),
    },
    {
      unit: "Ресторан", 
      total: data.filter(item => item.unit === "restaurant").reduce((sum, item) => sum + item.amount, 0),
      "Наличные": data.filter(item => item.unit === "restaurant" && item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      "Расчетный счет": data.filter(item => item.unit === "restaurant" && item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      "Эквайринг": data.filter(item => item.unit === "restaurant" && item.type === "card").reduce((sum, item) => sum + item.amount, 0),
    },
    {
      unit: "Спа-центр",
      total: data.filter(item => item.unit === "spa").reduce((sum, item) => sum + item.amount, 0),
      "Наличные": data.filter(item => item.unit === "spa" && item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      "Расчетный счет": data.filter(item => item.unit === "spa" && item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      "Эквайринг": data.filter(item => item.unit === "spa" && item.type === "card").reduce((sum, item) => sum + item.amount, 0),
    }
  ];

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Сравнение по бизнес-юнитам
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="unit" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}к`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
              formatter={(value: number) => [`${value.toLocaleString("ru-RU")} ₽`, ""]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar 
              dataKey="Наличные" 
              fill="hsl(var(--cash-color))" 
              name="Наличные"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="Расчетный счет" 
              fill="hsl(var(--bank-color))" 
              name="Расчетный счет"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="Эквайринг" 
              fill="hsl(var(--card-color))" 
              name="Эквайринг"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="Онлайн и счета" 
              fill="hsl(var(--online-payment-color))" 
              name="Онлайн и счета"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="Терминал" 
              fill="hsl(var(--terminal-color))" 
              name="Терминал"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};