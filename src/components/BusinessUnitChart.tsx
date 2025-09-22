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
  // Группируем данные по юнитам
  const chartData = [
    {
      unit: "Отель и бани",
      total: data.filter(item => item.unit === "hotel").reduce((sum, item) => sum + item.amount, 0),
      cash: data.filter(item => item.unit === "hotel" && item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      bank: data.filter(item => item.unit === "hotel" && item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      card: data.filter(item => item.unit === "hotel" && item.type === "card").reduce((sum, item) => sum + item.amount, 0),
    },
    {
      unit: "Ресторан", 
      total: data.filter(item => item.unit === "restaurant").reduce((sum, item) => sum + item.amount, 0),
      cash: data.filter(item => item.unit === "restaurant" && item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      bank: data.filter(item => item.unit === "restaurant" && item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      card: data.filter(item => item.unit === "restaurant" && item.type === "card").reduce((sum, item) => sum + item.amount, 0),
    },
    {
      unit: "Спа-центр",
      total: data.filter(item => item.unit === "spa").reduce((sum, item) => sum + item.amount, 0),
      cash: data.filter(item => item.unit === "spa" && item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      bank: data.filter(item => item.unit === "spa" && item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      card: data.filter(item => item.unit === "spa" && item.type === "card").reduce((sum, item) => sum + item.amount, 0),
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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "var(--shadow-elevated)"
              }}
              formatter={(value: number) => [`${value.toLocaleString("ru-RU")} ₽`, ""]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Bar 
              dataKey="cash" 
              fill="hsl(var(--cash-color))" 
              name="Наличные"
              radius={[0, 0, 4, 4]}
            />
            <Bar 
              dataKey="bank" 
              fill="hsl(var(--bank-color))" 
              name="Расчетный счет"
              radius={[0, 0, 4, 4]}
            />
            <Bar 
              dataKey="card" 
              fill="hsl(var(--card-color))" 
              name="Эквайринг"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};