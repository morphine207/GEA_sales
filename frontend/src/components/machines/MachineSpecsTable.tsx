import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";
import { machineSpecifications } from "@/data/machineSpecifications";

export function MachineSpecsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationFilter, setApplicationFilter] = useState<string>("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('de-DE').format(num);
  };

  const applications = useMemo(() => {
    const set = new Set<string>(machineSpecifications.map(m => m.application));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredMachines = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return machineSpecifications.filter((m) => {
      const matchesSearch =
        m.modelNumber.toLowerCase().includes(lower) ||
        m.application.toLowerCase().includes(lower) ||
        m.subApplication.toLowerCase().includes(lower);
      const matchesApp = applicationFilter === "all" || m.application === applicationFilter;
      return matchesSearch && matchesApp;
    });
  }, [searchTerm, applicationFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Machine Specifications Database</h2>
        <div className="flex gap-4 items-center">
          <div className="w-64">
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <Select value={applicationFilter} onValueChange={setApplicationFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Applications" />
            </SelectTrigger>
            <SelectContent>
              {applications.map(app => (
                <SelectItem key={app} value={app}>{app === "all" ? "All Applications" : app}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-12 md:grid-cols-13 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 rounded-t-lg">
            <div className="col-span-2">MODEL & APPLICATION</div>
            <div>CAPACITY</div>
            <div>PRICE</div>
            <div>POWER</div>
            <div>DIMENSIONS</div>
            <div>WEIGHT</div>
            <div>BOWL</div>
            <div>WATER</div>
            <div>DRIVE</div>
            <div>PROTECTION</div>
            <div>EFFICIENCY</div>
            <div>EJECTION</div>
          </div>

          <div className="space-y-2 mt-2">
            {filteredMachines.map((m, index) => (
              <Card key={`${m.modelNumber}-${index}`} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="grid grid-cols-12 md:grid-cols-13 gap-2 text-sm">
                  <div className="col-span-2">
                    <div className="font-semibold text-primary hover:underline cursor-pointer">{m.modelNumber}</div>
                    <div className="text-xs text-muted-foreground">{m.application}</div>
                    <div className="text-xs text-muted-foreground">{m.subApplication}</div>
                    <div className="text-xs">⌀{formatNumber(m.bowlDiameter)}mm</div>
                  </div>

                  <div>
                    <div className="font-medium">{formatNumber(m.capacityMinInp)}-{formatNumber(m.capacityMaxInp)} L/h</div>
                    <div className="text-xs text-muted-foreground">Solids: {m.feedSolidsMin}-{m.feedSolidsMax}%</div>
                  </div>

                  <div>
                    <div className="font-semibold text-green-700">{formatCurrency(m.listPrice)}</div>
                  </div>

                  <div>
                    <div className="font-medium">{m.motorPowerKW} kW</div>
                    <div className="text-xs text-muted-foreground">Total: {m.powerConsumptionTotalKW} kW</div>
                  </div>

                  <div>
                    <div className="text-xs">L: {formatNumber(m.length)}mm</div>
                    <div className="text-xs">W: {formatNumber(m.width)}mm</div>
                    <div className="text-xs">H: {formatNumber(m.height)}mm</div>
                  </div>

                  <div>
                    <div className="font-medium">{formatNumber(m.totalWeightKg)} kg</div>
                  </div>

                  <div>
                    <div className="font-medium">{formatNumber(m.bowlVolumeL)} L</div>
                  </div>

                  <div>
                    <div className="text-xs">{m.waterFlowLs} L/s</div>
                    <div className="text-xs">{m.waterPerEjectionL} L/ejection</div>
                    <div className="text-xs">{m.waterSupplyBar} bar</div>
                  </div>

                  <div>
                    <div className="text-xs">{m.driveType}</div>
                    <div className="text-2xs text-muted-foreground">{m.level}</div>
                  </div>

                  <div>
                    <div className="font-medium">{m.protectionClass}</div>
                  </div>

                  <div>
                    <div className="text-xs">{m.motorEfficiency}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium">{m.ejectionSystem}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredMachines.length === 0 && (
            <Card className="p-8 text-center mt-4">
              <p className="text-muted-foreground">No machines found.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}