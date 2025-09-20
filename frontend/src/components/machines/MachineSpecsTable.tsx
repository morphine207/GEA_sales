import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { apiCalculateProjectTCO, apiListProjects, mapBackendProjectToFrontend } from "@/lib/api";
import { Project } from "@/types/project";

export function MachineSpecsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [rows, setRows] = useState<Array<{
    label: string;
    application: string;
    sub_application: string;
    capacity_min_inp: number;
    capacity_max_inp: number;
    list_price: number;
    motor_power_kw: number;
    length_mm: number;
    width_mm: number;
    height_mm: number;
    total_weight_kg: number;
    bowl_volume_lit: number;
    op_water_l_s: number;
    op_water_l_it_eject: number;
    op_water_supply_bar: number;
    drive_type: string;
    protection_class: string;
    motor_efficiency?: string | null;
    ejection_system: string;
    dmr: number;
    tco_total: number;
  }>>([]);

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

  const filteredMachines = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return rows.filter((m) =>
      m.label.toLowerCase().includes(lower) ||
      m.application.toLowerCase().includes(lower) ||
      m.sub_application.toLowerCase().includes(lower)
    );
  }, [rows, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const resp = await apiListProjects();
        if (!isMounted) return;
        const mapped = resp.projects.map(mapBackendProjectToFrontend);
        setProjects(mapped);
        if (mapped.length > 0) setSelectedProject(mapped[0].projectName);
      } catch (e) {
        setProjects([]);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!selectedProject) {
        setRows([]);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const resp = await apiCalculateProjectTCO(selectedProject, {
          years: 5,
          electricity_eur_per_kwh: 0.25,
          water_eur_per_l: 0.002,
          workdays_per_week: 5,
          operation_hours_per_day: 16,
        });
        if (!isMounted) return;
        const combined = (resp.relevant_machines || []).map((m: any, idx: number) => {
          const t = resp.tco_results?.[idx];
          const total = t && Array.isArray(t.monthly_cum_total) && t.monthly_cum_total.length > 0
            ? t.monthly_cum_total[t.monthly_cum_total.length - 1]
            : (t ? (t.ca + t.cc + t.co + t.cm) : 0);
        
          return {
            label: t?.label || `${m.application} – ${m.sub_application}`,
            application: m.application,
            sub_application: m.sub_application,
            capacity_min_inp: m.capacity_min_inp,
            capacity_max_inp: m.capacity_max_inp,
            list_price: m.list_price,
            motor_power_kw: m.motor_power_kw,
            length_mm: m.length_mm,
            width_mm: m.width_mm,
            height_mm: m.height_mm,
            total_weight_kg: m.total_weight_kg,
            bowl_volume_lit: m.bowl_volume_lit,
            op_water_l_s: m.op_water_l_s,
            op_water_l_it_eject: m.op_water_l_it_eject,
            op_water_supply_bar: m.op_water_supply_bar,
            drive_type: m.drive_type,
            protection_class: m.protection_class,
            motor_efficiency: m.motor_efficiency,
            ejection_system: m.ejection_system,
            dmr: m.dmr,
            tco_total: total,
          };
        });
        setRows(combined);
      } catch (e: any) {
        if (!isMounted) return;
        setRows([]);
        setError("Failed to load machines from backend.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [selectedProject]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Relevant Machines (from backend)</h2>
        <div className="flex gap-4 items-center">
          <div className="w-64">
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.projectName} value={p.projectName}>{p.projectName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Header */}
          <div className="grid grid-cols-13 gap-2 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30 rounded-t-lg">
            <div className="col-span-2">LABEL & APPLICATION</div>
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
            <div>TCO</div>
          </div>

          {/* Machine Rows */}
          <div className="space-y-2 mt-2">
            {loading && (
              <Card className="p-8 text-center mt-4">
                <p className="text-muted-foreground">Loading machines…</p>
              </Card>
            )}
            {!loading && error && (
              <Card className="p-8 text-center mt-4">
                <p className="text-red-600">{error}</p>
              </Card>
            )}
            {!loading && !error && filteredMachines.map((machine, index) => (
              <Card key={index} className="p-4 hover:bg-accent/20 transition-colors">
                <div className="grid grid-cols-13 gap-2 text-sm">
                  <div className="col-span-2">
                    <div className="font-semibold text-primary">{machine.label}</div>
                    <div className="text-xs text-muted-foreground">{machine.application}</div>
                    <div className="text-xs text-muted-foreground">{machine.sub_application}</div>
                    <div className="text-xs">⌀{formatNumber(machine.dmr)}mm</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{formatNumber(machine.capacity_min_inp)}-</div>
                    <div className="font-medium">{formatNumber(machine.capacity_max_inp)} L/h</div>
                  </div>
                  
                  <div>
                    <div className="font-semibold text-green-700">{formatCurrency(machine.list_price)}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{machine.motor_power_kw} kW</div>
                    <div className="text-xs text-muted-foreground">Water: {machine.op_water_l_s} L/s</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">L: {formatNumber(machine.length_mm)}mm</div>
                    <div className="text-xs">W: {formatNumber(machine.width_mm)}mm</div>
                    <div className="text-xs">H: {formatNumber(machine.height_mm)}mm</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{formatNumber(machine.total_weight_kg)} kg</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{formatNumber(machine.bowl_volume_lit)} L</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.op_water_l_s} L/s</div>
                    <div className="text-xs">{machine.op_water_l_it_eject} L/ejection</div>
                    <div className="text-xs">{machine.op_water_supply_bar} bar</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.drive_type}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{machine.protection_class}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs">{machine.motor_efficiency || ""}</div>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium">{machine.ejection_system}</div>
                  </div>

                  <div>
                    <div className="font-semibold text-primary">{formatCurrency(machine.tco_total)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {!loading && !error && filteredMachines.length === 0 && (
            <Card className="p-8 text-center mt-4">
              <p className="text-muted-foreground">No machines found for the selected project.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{filteredMachines.length}</div>
          <div className="text-xs text-muted-foreground">Relevant Models</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{projects.length}</div>
          <div className="text-xs text-muted-foreground">Projects</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{selectedProject || "—"}</div>
          <div className="text-xs text-muted-foreground">Selected Project</div>
        </Card>
      </div>
    </div>
  );
}