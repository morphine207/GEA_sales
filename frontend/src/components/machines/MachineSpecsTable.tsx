import { machineSpecifications, MachineSpecification } from "@/data/machineSpecifications";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function MachineSpecsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("all");

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

  const filteredMachines = machineSpecifications.filter(machine => {
    const matchesSearch = machine.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.application.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.subApplication.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesApplication = applicationFilter === "all" || machine.application === applicationFilter;
    return matchesSearch && matchesApplication;
  });

  const applications = Array.from(new Set(machineSpecifications.map(m => m.application)));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Machine Specifications Database</h2>
        <div className="flex gap-4">
          <div className="w-64">
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <Select value={applicationFilter} onValueChange={setApplicationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Application" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              {applications.map(app => (
                <SelectItem key={app} value={app}>{app}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 rounded-t-lg">
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

          {/* Machine Rows */}
          <div className="space-y-2 mt-2">
            {filteredMachines.map((machine, index) => (
              <Card key={index} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="grid grid-cols-12 gap-2 text-sm">
                  <div className="col-span-2">
                    <div className="font-semibold text-primary">{machine.modelNumber}</div>
                    <div className="text-xs text-muted-foreground">{machine.application}</div>
                    <div className="text-xs text-muted-foreground">{machine.subApplication}</div>
                    <div className="text-xs">⌀{machine.bowlDiameter}mm</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{formatNumber(machine.capacityMinInp)}-</div>
                    <div className="font-medium">{formatNumber(machine.capacityMaxInp)} L/h</div>
                    <div className="text-xs text-muted-foreground">Solids: {machine.feedSolidsMin}-{machine.feedSolidsMax}%</div>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-green-700">{formatCurrency(machine.listPrice)}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{machine.motorPowerKW} kW</div>
                    <div className="text-xs text-muted-foreground">Total: {machine.powerConsumptionTotalKW} kW</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">L: {formatNumber(machine.length)}mm</div>
                    <div className="text-xs">W: {formatNumber(machine.width)}mm</div>
                    <div className="text-xs">H: {formatNumber(machine.height)}mm</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{formatNumber(machine.totalWeightKg)} kg</div>
                    <div className="text-xs text-muted-foreground">Bowl: {formatNumber(machine.bowlWeightKg)} kg</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{machine.bowlVolumeL} L</div>
                    <div className="text-xs text-muted-foreground">⌀{machine.bowlDiameter}mm</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.waterFlowLs} L/s</div>
                    <div className="text-xs">{machine.waterPerEjectionL} L/ejection</div>
                    <div className="text-xs">{machine.waterSupplyBar} bar</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.driveType}</div>
                    <div className="text-xs text-muted-foreground">{machine.level}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{machine.protectionClass}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.motorEfficiency}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium">{machine.ejectionSystem}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredMachines.length === 0 && (
            <Card className="p-8 text-center mt-4">
              <p className="text-muted-foreground">No machines found matching your criteria.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{filteredMachines.length}</div>
          <div className="text-xs text-muted-foreground">Available Models</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{applications.length}</div>
          <div className="text-xs text-muted-foreground">Applications</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(Math.min(...filteredMachines.map(m => m.listPrice)))}
          </div>
          <div className="text-xs text-muted-foreground">Starting Price</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {formatNumber(Math.max(...filteredMachines.map(m => m.capacityMaxInp)))} L/h
          </div>
          <div className="text-xs text-muted-foreground">Max Capacity</div>
        </Card>
      </div>
    </div>
  );
}