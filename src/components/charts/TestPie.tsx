import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

const COLORS = ["#16a34a", "#2563eb", "#8b5cf6"];

export function TestPie() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const data = [
    { name: "Наличные", value: 400 },
    { name: "Счет", value: 300 },
    { name: "Эквайринг", value: 300 },
  ];

  const handleLegendClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handlePieClick = (data: any, index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex justify-center gap-4 mt-2">
        {payload.map((entry: any, index: number) => (
          <div
            key={entry.value}
            className="flex items-center gap-1 cursor-pointer transition-all duration-300"
            onClick={() => handleLegendClick(index)}
            style={{
              opacity: activeIndex !== null && activeIndex !== index ? 0.6 : 1,
              fontWeight: activeIndex === index ? 'bold' : 'normal'
            }}
          >
            <div
              className="w-3 h-3 rounded-full transition-all duration-300"
              style={{ 
                backgroundColor: entry.color,
                transform: activeIndex === index ? 'scale(1.2)' : 'scale(1)',
                boxShadow: activeIndex === index ? `0 0 8px ${entry.color}40` : 'none'
              }}
            />
            <span className="text-xs transition-all duration-300" style={{
              color: activeIndex === index ? entry.color : 'inherit',
              fontWeight: activeIndex === index ? 'bold' : 'normal'
            }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <h3 className="font-semibold mb-2 text-sm sm:text-base">Тестовая диаграмма</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie 
            data={data} 
            dataKey="value" 
            nameKey="name" 
            outerRadius={80}
            innerRadius={0}
            stroke="none"
            strokeWidth={0}
            onClick={handlePieClick}
            activeIndex={activeIndex}
          >
            {data.map((_, i) => {
              const isActive = activeIndex === i;
              const RADIAN = Math.PI / 180;
              // Вычисляем средний угол для этой дольки
              const totalValue = data.reduce((sum, item) => sum + item.value, 0);
              const startAngle = data.slice(0, i).reduce((sum, item) => sum + (item.value / totalValue) * 360, 0);
              const endAngle = startAngle + (data[i].value / totalValue) * 360;
              const midAngle = (startAngle + endAngle) / 2;
              
              const sin = Math.sin(-RADIAN * midAngle);
              const cos = Math.cos(-RADIAN * midAngle);
              
              // Анимация выезжания только для активного элемента
              const offsetX = isActive ? cos * 15 : 0;
              const offsetY = isActive ? sin * 15 : 0;
              
              return (
                <Cell 
                  key={i} 
                  fill={COLORS[i % COLORS.length]} 
                  stroke="none"
                  strokeWidth={0}
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
              backgroundColor: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            formatter={(v: number, name: string) => {
              const total = data.reduce((sum, item) => sum + item.value, 0);
              const percentage = total > 0 ? ((v / total) * 100).toFixed(1) : 0;
              return [`${v.toLocaleString("ru-RU")} ₽ (${percentage}%)`, name];
            }}
          />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}