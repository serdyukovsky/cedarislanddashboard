import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregatedDailyUnit } from "@/server/types";
import { Building2, User, Globe, CreditCard, Banknote } from "lucide-react";

interface Props {
  data: AggregatedDailyUnit[];
}

export function RevenueBreakdown({ data }: Props) {
  const totals = (Array.isArray(data) ? data : []).reduce(
    (acc, d) => {
      try {
        const br = d.revenue?.breakdown;
        if (br) {
          acc.bankLegal += Number(br.bankLegal) || 0;
          acc.bankIndividual += Number(br.bankIndividual) || 0;
          acc.online += Number(br.online) || 0;
          acc.acquiring += Number(br.acquiringTerminal) || 0;
          acc.cash += Number(br.cash) || 0;
        } else {
          // Fallback: distribute aggregate into minimal buckets
          acc.acquiring += Number(d.revenue?.acquiring) || 0;
          acc.bank += Number(d.revenue?.bank) || 0;
          acc.cash += Number(d.revenue?.cash) || 0;
        }
      } catch (error) {
        console.warn('Error processing revenue data:', error, d);
      }
      return acc;
    },
    { bankLegal: 0, bankIndividual: 0, online: 0, acquiring: 0, cash: 0, bank: 0 }
  );

  const items = [
    { 
      label: "Счёт юр. лица", 
      value: totals.bankLegal,
      icon: Building2,
      color: "text-blue-500"
    },
    { 
      label: "Счёт физ. лица", 
      value: totals.bankIndividual,
      icon: User,
      color: "text-green-500"
    },
    { 
      label: "Онлайн оплаты", 
      value: totals.online,
      icon: Globe,
      color: "text-purple-500"
    },
    { 
      label: "Эквайринг", 
      value: totals.acquiring,
      icon: CreditCard,
      color: "text-orange-500"
    },
    { 
      label: "Наличка", 
      value: totals.cash,
      icon: Banknote,
      color: "text-emerald-500"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {items.map((it) => {
        const IconComponent = it.icon;
        return (
          <Card key={it.label} className="shadow-card h-20 relative overflow-hidden group">
            {/* Блюрная иконка на фоне */}
            <div className="absolute top-1 right-1 opacity-50 blur-[2px] group-hover:blur-[0px] transition-all duration-300 transform rotate-12">
              <IconComponent className={`h-12 w-12 ${it.color}`} />
            </div>
            
            <CardContent className="flex flex-col items-start justify-center h-full py-1 relative z-10">
              <CardTitle className="text-xs text-muted-foreground">{it.label}</CardTitle>
              <div className="text-sm font-semibold text-foreground">{Math.round(Number(it.value) || 0).toLocaleString("ru-RU")} ₽</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}


