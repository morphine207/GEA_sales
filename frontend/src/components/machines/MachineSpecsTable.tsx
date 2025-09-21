import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { apiListMachines, BackendMachine } from "@/lib/api";

type UIMachine = {
  application: string;
  subApplication: string;
  feedSolidsMin: number;
  feedSolidsMax: number;
  capacityMinInp: number;
  capacityMaxInp: number;
  driveType: string;
  level: string;
  modelNumber: string;
  bowlDiameter: number;
  listPrice: number;
  motorPowerKW: number;
  protectionClass: string;
  motorEfficiency: string;
  waterSupplyBar: number;
  waterFlowLs: number;
  waterPerEjectionL: number;
  length: number;
  width: number;
  height: number;
  totalWeightKg: number;
  bowlWeightKg: number;
  motorWeightKg: number;
  bowlVolumeL: number;
  ejectionSystem: string;
  powerConsumptionTotalKW: number;
};

function mapBackendMachineToUI(m: BackendMachine): UIMachine {
  const model = (m.langtyp || "").trim();
  const modelFallback = [m.application, m.sub_application, Number.isFinite(m.dmr) ? `DMR ${Math.round(m.dmr)}mm` : ""].filter(Boolean).join(" – ");
  return {
    application: m.application || "",
    subApplication: m.sub_application || "",
    feedSolidsMin: Number(m.feed_solids_min_vol_perc) || 0,
    feedSolidsMax: Number(m.feed_solids_max_vol_perc) || 0,
    capacityMinInp: Number(m.capacity_min_inp) || 0,
    capacityMaxInp: Number(m.capacity_max_inp) || 0,
    driveType: m.drive_type || "",
    level: m.level || "",
    modelNumber: model || modelFallback || "Machine",
    bowlDiameter: Number(m.dmr) || 0,
    listPrice: Number(m.list_price) || 0,
    motorPowerKW: Number(m.motor_power_kw) || 0,
    protectionClass: m.protection_class || "",
    motorEfficiency: (m.motor_efficiency || "-").toString(),
    waterSupplyBar: Number(m.op_water_supply_bar) || 0,
    waterFlowLs: Number(m.op_water_l_s) || 0,
    waterPerEjectionL: Number(m.op_water_l_it_eject) || 0,
    length: Number(m.length_mm) || 0,
    width: Number(m.width_mm) || 0,
    height: Number(m.height_mm) || 0,
    totalWeightKg: Number(m.total_weight_kg) || 0,
    bowlWeightKg: Number(m.bowl_weight_kg) || 0,
    motorWeightKg: Number(m.motor_weight_kg) || 0,
    bowlVolumeL: Number(m.bowl_volume_lit) || 0,
    ejectionSystem: m.ejection_system || "",
    powerConsumptionTotalKW: Number(m.power_consumption_total_kw) || 0,
  };
}

export function MachineSpecsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [applicationFilter, setApplicationFilter] = useState<string>("all");
  const [machines, setMachines] = useState<UIMachine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiListMachines();
        if (!isMounted) return;
        const mapped = resp.machines.map(mapBackendMachineToUI);
        setMachines(mapped);
        setError("");
      } catch (e: any) {
        if (!isMounted) return;
        setMachines([]);
        setError("Failed to load machines from backend.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

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
    const set = new Set<string>(machines.map(m => m.application));
    return ["all", ...Array.from(set)];
  }, [machines]);

  const filteredMachines = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return machines.filter((m) => {
      const matchesSearch =
        (m.modelNumber || "").toLowerCase().includes(lower) ||
        (m.application || "").toLowerCase().includes(lower) ||
        (m.subApplication || "").toLowerCase().includes(lower);
      const matchesApp = applicationFilter === "all" || m.application === applicationFilter;
      return matchesSearch && matchesApp;
    });
  }, [machines, searchTerm, applicationFilter]);

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
        {loading && (
          <Card className="p-6 mt-4 text-sm text-muted-foreground">Loading machines…</Card>
        )}
        {!loading && error && (
          <Card className="p-6 mt-4 text-sm text-red-600">{error}</Card>
        )}
        <div className="min-w-full">
          <div className="grid grid-cols-12 md:grid-cols-14 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 rounded-t-lg">
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
            <div>EDIT</div>
            <div>EFFICIENCY</div>
            <div>EJECTION</div>
          </div>

          <div className="space-y-2 mt-2">
            {filteredMachines.map((m, index) => (
              <Card key={`${m.modelNumber}-${index}`} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="grid grid-cols-12 md:grid-cols-14 gap-2 text-sm">
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

                  <div className="flex items-start justify-start">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Settings2 className="h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl md:max-w-4xl lg:max-w-6xl w-[95vw]">
                        <DialogHeader>
                          <DialogTitle>Edit Machine</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-2 md:grid-cols-4">
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Model</div>
                            <Input defaultValue={m.modelNumber} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Application</div>
                            <Input defaultValue={m.application} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Sub-Application</div>
                            <Input defaultValue={m.subApplication} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Bowl ⌀ (mm)</div>
                            <Input type="number" defaultValue={m.bowlDiameter} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Capacity Min (L/h)</div>
                            <Input type="number" defaultValue={m.capacityMinInp} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Capacity Max (L/h)</div>
                            <Input type="number" defaultValue={m.capacityMaxInp} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Feed Solids Min (%)</div>
                            <Input type="number" defaultValue={m.feedSolidsMin} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Feed Solids Max (%)</div>
                            <Input type="number" defaultValue={m.feedSolidsMax} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">List Price (€)</div>
                            <Input type="number" defaultValue={m.listPrice} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Motor Power (kW)</div>
                            <Input type="number" defaultValue={m.motorPowerKW} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Total Power (kW)</div>
                            <Input type="number" defaultValue={m.powerConsumptionTotalKW} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Length (mm)</div>
                            <Input type="number" defaultValue={m.length} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Width (mm)</div>
                            <Input type="number" defaultValue={m.width} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Height (mm)</div>
                            <Input type="number" defaultValue={m.height} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Total Weight (kg)</div>
                            <Input type="number" defaultValue={m.totalWeightKg} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Bowl Volume (L)</div>
                            <Input type="number" defaultValue={m.bowlVolumeL} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Water Flow (L/s)</div>
                            <Input type="number" defaultValue={m.waterFlowLs} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Water per Ejection (L)</div>
                            <Input type="number" defaultValue={m.waterPerEjectionL} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Water Supply (bar)</div>
                            <Input type="number" defaultValue={m.waterSupplyBar} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Drive Type</div>
                            <Input defaultValue={m.driveType} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Level</div>
                            <Input defaultValue={m.level} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Protection Class</div>
                            <Input defaultValue={m.protectionClass} className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Motor Efficiency</div>
                            <Input defaultValue={m.motorEfficiency} className="col-span-3" />
                          </div>

                          <div className="grid grid-cols-4 items-center gap-2">
                            <div className="text-sm text-muted-foreground col-span-1">Ejection System</div>
                            <Input defaultValue={m.ejectionSystem} className="col-span-3" />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button>Save</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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