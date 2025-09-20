import { TCOComponents } from "@/types/tco";
import { Card } from "@/components/ui/card";

interface TCOBreakdownProps {
  tcoComponents: TCOComponents;
  machineName: string;
}

export function TCOBreakdown({ tcoComponents, machineName }: TCOBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const components = [
    { label: 'Ca - Acquisition', value: tcoComponents.Ca_acquisition, description: 'Engineering, procurement, auxiliary equipment' },
    { label: 'Cc - Commissioning', value: tcoComponents.Cc_commissioning, description: 'Construction, start-up, training' },
    { label: 'Co - Operating', value: tcoComponents.Co_operating, description: 'Energy, operators, materials handling' },
    { label: 'Cm - Maintenance', value: tcoComponents.Cm_maintenance, description: 'Personnel, spares, test equipment' },
    { label: 'Cp - Production Impact', value: tcoComponents.Cp_production_impact, description: 'Downtime losses, quality, environment' },
    { label: 'Cd - Disposal', value: tcoComponents.Cd_disposal, description: 'Removal cost' },
    { label: 'Ve - End of Life Value', value: -tcoComponents.Ve_end_of_life, description: 'Gross scrap value (negative = benefit)', isNegative: true },
  ];

  return (
    <Card className="p-6">
      <h4 className="text-lg font-semibold mb-4">{machineName} - TCO Breakdown</h4>
      
      <div className="space-y-3">
        {components.map((component, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
            <div className="flex-1">
              <div className="font-medium text-foreground">{component.label}</div>
              <div className="text-xs text-muted-foreground">{component.description}</div>
            </div>
            <div className={`font-semibold text-right ${component.isNegative ? 'text-green-600' : 'text-foreground'}`}>
              {formatCurrency(component.value)}
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-4 border-t-2 border-border">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-foreground">Subtotal (Before Discount)</div>
            <div className="font-semibold text-foreground">
              {formatCurrency(tcoComponents.total_before_discount)}
            </div>
          </div>
          
          {tcoComponents.discount_amount > 0 && (
            <div className="flex items-center justify-between mt-2">
              <div className="font-medium text-muted-foreground">Discount Applied</div>
              <div className="font-medium text-green-600">
                -{formatCurrency(tcoComponents.discount_amount)}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="text-lg font-bold text-primary">Total TCO</div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(tcoComponents.total_after_discount)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}