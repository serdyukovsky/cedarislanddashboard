import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, UtensilsCrossed, Waves, Banknote, CreditCard, Landmark } from "lucide-react";

interface FilterPanelProps {
  selectedUnit: string;
  selectedType: string;
  onUnitChange: (unit: string) => void;
  onTypeChange: (type: string) => void;
}

export function FilterPanel({
  selectedUnit,
  selectedType,
  onUnitChange,
  onTypeChange
}: FilterPanelProps) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="unit-filter" className="text-sm font-medium text-foreground">
              Бизнес-юнит
            </Label>
            <Select value={selectedUnit} onValueChange={onUnitChange}>
              <SelectTrigger id="unit-filter">
                <SelectValue placeholder="Выберите бизнес-юнит" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    Все юниты
                  </div>
                </SelectItem>
                <SelectItem value="hotel">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-hotel" />
                    Отель и бани
                  </div>
                </SelectItem>
                <SelectItem value="restaurant">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-restaurant" />
                    Ресторан
                  </div>
                </SelectItem>
                <SelectItem value="spa">
                  <div className="flex items-center gap-2">
                    <Waves className="h-4 w-4 text-spa" />
                    Спа-центр
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-filter" className="text-sm font-medium text-foreground">
              Тип выручки
            </Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Выберите тип выручки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                    Все типы
                  </div>
                </SelectItem>
                <SelectItem value="cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-cash" />
                    Наличные
                  </div>
                </SelectItem>
                <SelectItem value="bank">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-bank" />
                    Расчетный счет
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-card" />
                    Эквайринг
                  </div>
                </SelectItem>
                <SelectItem value="legal-account">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-legal-account" />
                    Счет юр.лица
                  </div>
                </SelectItem>
                <SelectItem value="personal-account">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-personal-account" />
                    Счет физ.лица
                  </div>
                </SelectItem>
                <SelectItem value="online-payment">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-online-payment" />
                    Онлайн оплаты
                  </div>
                </SelectItem>
                <SelectItem value="terminal">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-terminal" />
                    Терминал
                  </div>
                </SelectItem>
                <SelectItem value="hotel-cash">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-hotel-cash" />
                    Наличка (отель)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}