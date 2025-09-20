import { Machine } from "@/types/project";
import { Card } from "@/components/ui/card";

interface ReadOnlyMachineRowProps {
  machine: Machine;
}

export function ReadOnlyMachineRow({ machine }: ReadOnlyMachineRowProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '€ 0';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-4 bg-accent/10">
      <div className="grid grid-cols-5 gap-4 items-center">
        <div className="font-medium text-foreground">
          {machine.name}
        </div>
        
        <div className="text-foreground">
          {formatCurrency(machine.listPrice)}
        </div>
        
        <div className="text-foreground">
          {formatCurrency(machine.totalOperationCosts)}
        </div>
        
        <div className="text-foreground">
          {formatCurrency(machine.totalMaintenanceCosts)}
        </div>
        
        <div className="font-bold text-primary text-lg">
          {formatCurrency(machine.tco)}
        </div>
      </div>
    </Card>
  );
}