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
  // Группируем данные по датам и юнитам
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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-elevated)"
              }}
              formatter={(value: number) => [`${value.toLocaleString("ru-RU")} ₽`, ""]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
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