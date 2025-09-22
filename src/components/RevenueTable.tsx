import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface RevenueData {
  date: string;
  unit: string;
  type: string;
  amount: number;
}

interface RevenueTableProps {
  data: RevenueData[];
}

const UNIT_NAMES = {
  hotel: "Отель и бани",
  restaurant: "Ресторан",
  spa: "Спа-центр"
};

const TYPE_NAMES = {
  cash: "Наличные",
  bank: "Расчетный счет",
  card: "Эквайринг",
  "legal-account": "Счет юр.лица",
  "personal-account": "Счет физ.лица",
  "online-payment": "Онлайн оплаты",
  terminal: "Терминал",
  "hotel-cash": "Наличка"
};

const UNIT_COLORS = {
  hotel: "hotel",
  restaurant: "restaurant", 
  spa: "spa"
};

export const RevenueTable = ({ data }: RevenueTableProps) => {
  // Группируем данные по дате и юниту
  const tableData = data.reduce((acc, item) => {
    const key = `${item.date}-${item.unit}`;
    if (!acc[key]) {
      acc[key] = {
        date: item.date,
        unit: item.unit,
        cash: 0,
        bank: 0,
        card: 0,
        "legal-account": 0,
        "personal-account": 0,
        "online-payment": 0,
        terminal: 0,
        "hotel-cash": 0,
        total: 0
      };
    }
    acc[key][item.type] += item.amount;
    acc[key].total += item.amount;
    return acc;
  }, {} as any);

  const sortedData = Object.values(tableData).sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Детализация по выручке
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Дата</TableHead>
                <TableHead className="text-muted-foreground">Бизнес-юнит</TableHead>
                <TableHead className="text-right text-muted-foreground">Счет юр.л</TableHead>
                <TableHead className="text-right text-muted-foreground">Счет физ.л</TableHead>
                <TableHead className="text-right text-muted-foreground">Онлайн</TableHead>
                <TableHead className="text-right text-muted-foreground">Термин.</TableHead>
                <TableHead className="text-right text-muted-foreground">Наличка</TableHead>
                <TableHead className="text-right text-muted-foreground">Нал.(общ)</TableHead>
                <TableHead className="text-right text-muted-foreground">Расч.счет</TableHead>
                <TableHead className="text-right text-muted-foreground">Эквайр.</TableHead>
                <TableHead className="text-right text-muted-foreground">Итого</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row: any, index) => (
                <TableRow key={index} className="border-border">
                  <TableCell className="font-medium text-foreground">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`border-${UNIT_COLORS[row.unit as keyof typeof UNIT_COLORS]} text-${UNIT_COLORS[row.unit as keyof typeof UNIT_COLORS]}`}
                    >
                      {UNIT_NAMES[row.unit as keyof typeof UNIT_NAMES]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row["legal-account"].toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row["personal-account"].toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row["online-payment"].toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.terminal.toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row["hotel-cash"].toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.cash.toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.bank.toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono text-foreground">
                    {row.card.toLocaleString("ru-RU")} ₽
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-foreground">
                    {row.total.toLocaleString("ru-RU")} ₽
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};