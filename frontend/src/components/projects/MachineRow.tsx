import { Machine } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface MachineRowProps {
  machine: Machine;
  onChange: (machineId: string, field: keyof Machine, value: string | number) => void;
  onDelete: (machineId: string) => void;
}

export function MachineRow({ machine, onChange, onDelete }: MachineRowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="p-4">
      <div className="grid grid-cols-6 gap-4 items-center">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Name</div>
          <Input
            value={machine.name}
            onChange={(e) => onChange(machine.id, 'name', e.target.value)}
            className="font-medium text-base"
          />
        </div>
        
        <div>
          <Input
            type="number"
            value={machine.listPrice}
            onChange={(e) => onChange(machine.id, 'listPrice', Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Input
            type="number"
            value={machine.totalOperationCosts}
            onChange={(e) => onChange(machine.id, 'totalOperationCosts', Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div>
          <Input
            type="number"
            value={machine.totalMaintenanceCosts}
            onChange={(e) => onChange(machine.id, 'totalMaintenanceCosts', Number(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        
        <div className="font-semibold text-primary">
          {formatCurrency(machine.tco)}
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(machine.id)}
            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}