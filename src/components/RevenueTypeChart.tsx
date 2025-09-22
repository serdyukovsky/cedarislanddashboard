import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  card: "hsl(var(--card-color))"
};

const NAMES = {
  cash: "Наличные",
  bank: "Расчетный счет", 
  card: "Эквайринг"
};

export const RevenueTypeChart = ({ data }: RevenueTypeChartProps) => {
  // Группируем данные по типам оплаты
  const chartData = [
    {
      name: NAMES.cash,
      value: data.filter(item => item.type === "cash").reduce((sum, item) => sum + item.amount, 0),
      type: "cash"
    },
    {
      name: NAMES.bank,
      value: data.filter(item => item.type === "bank").reduce((sum, item) => sum + item.amount, 0),
      type: "bank"
    },
    {
      name: NAMES.card,
      value: data.filter(item => item.type === "card").reduce((sum, item) => sum + item.amount, 0),
      type: "card"
    }
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

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
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Структура выручки по типам оплаты
        </CardTitle>
      </CardHeader>
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
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
              ))}
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
            <Legend 
              wrapperStyle={{ 
                paddingTop: "20px",
                fontSize: "14px"
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};