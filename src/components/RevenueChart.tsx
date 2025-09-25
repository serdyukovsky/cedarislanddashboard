import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface RevenueData {
  date: string;
  unit: string;
  type: string;
  amount: number;
}

interface RevenueChartProps {
  data: RevenueData[];
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  // Группируем данные по датам и юнитам (суммируем все типы оплаты для каждого юнита)
  const chartData = data.reduce((acc, item) => {
    const existingDate = acc.find(d => d.date === item.date);
    if (existingDate) {
      existingDate[item.unit] = (existingDate[item.unit] || 0) + item.amount;
    } else {
      acc.push({
        date: new Date(item.date).toLocaleDateString("ru-RU", { 
          month: "short", 
          day: "numeric" 
        }),
        [item.unit]: item.amount
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Динамика выручки по дням
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
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
            <Line 
              type="monotone" 
              dataKey="hotel" 
              stroke="hsl(var(--hotel-color))" 
              strokeWidth={3}
              name="Отель и бани"
              dot={{ fill: "hsl(var(--hotel-color))", strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="restaurant" 
              stroke="hsl(var(--restaurant-color))" 
              strokeWidth={3}
              name="Ресторан"
              dot={{ fill: "hsl(var(--restaurant-color))", strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="spa" 
              stroke="hsl(var(--spa-color))" 
              strokeWidth={3}
              name="Спа-центр"
              dot={{ fill: "hsl(var(--spa-color))", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};