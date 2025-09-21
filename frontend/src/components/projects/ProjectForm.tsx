import { useEffect, useMemo, useRef, useState } from "react";
import { Project, Machine } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { apiCalculateProjectTCO } from "@/lib/api";
import { apiMagicFill } from "@/lib/api";
import { apiListMachines } from "@/lib/api";
import type { BackendMachine } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { machineSpecifications } from "@/data/machineSpecifications";

interface ProjectFormProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

export function ProjectForm({ project, onUpdate }: ProjectFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Project>(project);
  const [hasCalculated, setHasCalculated] = useState(true);
  const [tcoResults, setTcoResults] = useState<Array<{ name: string; ca: number; cc: number; co: number; cm: number; total: number }>>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const tcoResultsRef = useRef<HTMLDivElement | null>(null);
  const [allMachines, setAllMachines] = useState<BackendMachine[] | null>(null);

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(formData.projectName);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync edited title when project changes
  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(formData.projectName);
    }
  }, [formData.projectName, isEditingTitle]);

  // Magic Fill state
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicText, setMagicText] = useState("");
  const [isFilling, setIsFilling] = useState(false);
  const [magicError, setMagicError] = useState("");

  const mergeParsedIntoForm = (parsed: Partial<Project>) => {
    const updated: Project = {
      ...formData,
      ...parsed,
    } as Project;
    setFormData(updated);
    onUpdate(updated);
  };

  const handleMagicFill = async () => {
    if (!formData.projectName || !magicText.trim()) return;
    try {
      setIsFilling(true);
      setMagicError("");
      const resp = await apiMagicFill(formData.projectName, magicText);
      // Map backend keys to frontend Project shape
      const p = resp.parsed as any;
      const patch: Partial<Project> = {
        company: p?.company_name ?? formData.company,
        contact: p?.contact_person ?? formData.contact,
        telephone: p?.telefon_nummer ?? formData.telephone,
        mail: p?.email ?? formData.mail,
        application: p?.application ?? formData.application,
        subApplication: p?.sub_application ?? formData.subApplication,
        feedSolid: (p?.solids_percentage != null && !Number.isNaN(Number(p.solids_percentage))) ? Number(p.solids_percentage) : Number(formData.feedSolid) || 0,
        capacityPerDay: (p?.customer_throughput_per_day != null) ? Number(p.customer_throughput_per_day) : formData.capacityPerDay,
        years: (p?.years != null) ? Number(p.years) : formData.years,
        workdaysPerWeek: (p?.workdays_per_week != null) ? Number(p.workdays_per_week) : formData.workdaysPerWeek,
        energyPriceEurPerKwh: (p?.energy_price_eur_per_kwh != null) ? Number(p.energy_price_eur_per_kwh) : formData.energyPriceEurPerKwh,
        waterPriceEurPerL: (p?.water_price_eur_per_l != null) ? Number(p.water_price_eur_per_l) : formData.waterPriceEurPerL,
        protectionClass: p?.protection_class ?? formData.protectionClass,
        motorEfficiency: p?.motor_efficiency ?? formData.motorEfficiency,
        maxWidth: (p?.width_mm != null) ? Number(p.width_mm) : formData.maxWidth,
        maxLength: (p?.length_mm != null) ? Number(p.length_mm) : formData.maxLength,
        maxHeight: (p?.height_mm != null) ? Number(p.height_mm) : formData.maxHeight,
        maxWeight: (p?.weight_kg != null) ? Number(p.weight_kg) : formData.maxWeight,
      };
      mergeParsedIntoForm(patch);
      setMagicOpen(false);
      setMagicText("");
    } catch (e: any) {
      setMagicError(e?.message || "Magic Fill failed");
    } finally {
      setIsFilling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFieldChange = (field: keyof Project, value: string | number) => {
    const updatedProject = { ...formData, [field]: value };
    setFormData(updatedProject);
  };

  // Load machine list from backend to drive dropdowns
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const resp = await apiListMachines();
        if (!isMounted) return;
        setAllMachines(resp.machines || []);
      } catch {
        // Fallback to static dataset if backend fetch fails
        setAllMachines(null);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Derived dropdown options from machine specifications
  const applicationOptions = useMemo(() => {
    const set = new Set<string>();
    if (allMachines && allMachines.length > 0) {
      allMachines.forEach(m => { if (m.application) set.add(m.application); });
    } else {
      machineSpecifications.forEach(m => { if (m.application) set.add(m.application); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allMachines]);

  const subApplicationOptions = useMemo(() => {
    const set = new Set<string>();
    if (allMachines && allMachines.length > 0) {
      allMachines
        .filter(m => !formData.application || m.application === formData.application)
        .forEach(m => { if (m.sub_application) set.add(m.sub_application); });
    } else {
      machineSpecifications
        .filter(m => !formData.application || m.application === formData.application)
        .forEach(m => { if (m.subApplication) set.add(m.subApplication); });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [formData.application, allMachines]);

  const protectionClassOptions = useMemo(() => {
    const set = new Set<string>();
    if (allMachines && allMachines.length > 0) {
      allMachines.forEach(m => { if (m.protection_class) set.add(m.protection_class); });
    } else {
      machineSpecifications.forEach(m => { if (m.protectionClass) set.add(m.protectionClass); });
    }
    return Array.from(set).sort();
  }, [allMachines]);

  const motorEfficiencyOptions = useMemo(() => {
    const set = new Set<string>();
    if (allMachines && allMachines.length > 0) {
      allMachines.forEach(m => { if (typeof m.motor_efficiency === 'string' && m.motor_efficiency && m.motor_efficiency.trim().length > 0) set.add(m.motor_efficiency); });
    } else {
      machineSpecifications.forEach(m => { if (typeof m.motorEfficiency === 'string' && m.motorEfficiency.trim().length > 0) set.add(m.motorEfficiency); });
    }
    return Array.from(set).sort();
  }, [allMachines]);

  // Ensure subApplication is always a valid option for the selected application
  useEffect(() => {
    if (!formData.application) return;
    if (!subApplicationOptions.includes(formData.subApplication)) {
      const first = subApplicationOptions[0] || "";
      if (first !== formData.subApplication) {
        setFormData(prev => ({ ...prev, subApplication: first }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.application, subApplicationOptions]);

  const handleCalculate = async () => {
    // Call backend TCO calculation using the project name as identifier
    try {
      setIsCalculating(true);
      setCalcError("");
      await onUpdate(formData); // ensure project is saved before calculation
      const resp = await apiCalculateProjectTCO(formData.projectName, {
        years: formData.years,
        electricity_eur_per_kwh: formData.energyPriceEurPerKwh,
        water_eur_per_l: formData.waterPriceEurPerL,
        operation_hours_per_day: 16,
        workdays_per_week: formData.workdaysPerWeek,
      });

      // Map backend minimal TCO results for rendering using machine name (langtyp)
      const mapped = (resp.tco_results || []).map((r, i) => {
        const machine = resp.relevant_machines?.[i];
        const name = (machine?.langtyp || "").toString().trim() || r.label;
        return {
          name,
          ca: r.ca,
          cc: r.cc,
          co: r.co,
          cm: r.cm,
          total: Array.isArray(r.monthly_cum_total) && r.monthly_cum_total.length > 0 ? r.monthly_cum_total[r.monthly_cum_total.length - 1] : (r.ca + r.cc + r.co + r.cm),
        };
      });
      // Sort ascending by total cost
      mapped.sort((a, b) => a.total - b.total);
      setTcoResults(mapped);

      setHasCalculated(true);
      // Smoothly scroll to the machines (TCO results) section
      setTimeout(() => {
        tcoResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (e) {
      setCalcError("Backend calculation failed.");
      setTcoResults([]);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditedTitle(formData.projectName);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleTitleConfirm = async () => {
    if (editedTitle.trim() && editedTitle !== formData.projectName) {
      const updatedProject = { ...formData, projectName: editedTitle.trim() };
      setFormData(updatedProject);
      await onUpdate(updatedProject);
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(formData.projectName);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleConfirm();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Auto-calc on mount for existing projects
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsCalculating(true);
        setCalcError("");
        const resp = await apiCalculateProjectTCO(formData.projectName, {
          years: formData.years,
          electricity_eur_per_kwh: formData.energyPriceEurPerKwh,
          water_eur_per_l: formData.waterPriceEurPerL,
          operation_hours_per_day: 16,
          workdays_per_week: formData.workdaysPerWeek,
        });
        if (!isMounted) return;
        const mapped = (resp.tco_results || []).map((r, i) => {
          const machine = resp.relevant_machines?.[i];
          const name = (machine?.langtyp || "").toString().trim() || r.label;
          return {
            name,
            ca: r.ca,
            cc: r.cc,
            co: r.co,
            cm: r.cm,
            total: Array.isArray(r.monthly_cum_total) && r.monthly_cum_total.length > 0 ? r.monthly_cum_total[r.monthly_cum_total.length - 1] : (r.ca + r.cc + r.co + r.cm),
          };
        });
        mapped.sort((a, b) => a.total - b.total);
        setTcoResults(mapped);
        setHasCalculated(true);
      } catch (e) {
        if (!isMounted) return;
        setCalcError("Backend calculation failed.");
        setTcoResults([]);
      } finally {
        if (isMounted) setIsCalculating(false);
      }
    })();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.projectName]);

  return (
    <div className="p-3 space-y-3 md:p-5 md:space-y-5">
      {/* Editable Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <Input
                ref={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="text-3xl font-bold text-primary bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                style={{ width: `${Math.max(editedTitle.length, 10)}ch` }}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleTitleConfirm}
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleTitleCancel}
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1 
              onClick={handleTitleClick}
              className="text-3xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors"
            >
              {formData.projectName}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={magicOpen} onOpenChange={setMagicOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <Wand2 className="h-4 w-4" />
                Magic Fill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Magic Fill</DialogTitle>
                <DialogDescription>
                  Paste email threads or notes. The assistant will extract project details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Textarea
                  rows={14}
                  value={magicText}
                  onChange={(e) => setMagicText(e.target.value)}
                  placeholder="Paste text here..."
                />
                {magicError && (
                  <div className="text-sm text-red-600">{magicError}</div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMagicOpen(false)}>Cancel</Button>
                <Button onClick={handleMagicFill} disabled={!formData.projectName || !magicText.trim() || isFilling}>
                  {isFilling ? 'Filling…' : 'Fill In'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3 md:space-y-5">
        {/* Company details */}
        <div className="border border-border rounded-lg p-2.5 md:p-3">
          <h4 className="text-base md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">Company details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">COMPANY</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="contact" className="text-sm font-medium text-muted-foreground">CONTACT</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => handleFieldChange('contact', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="telephone" className="text-sm font-medium text-muted-foreground">TELEPHONE</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => handleFieldChange('telephone', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="mail" className="text-sm font-medium text-muted-foreground">MAIL</Label>
              <Input
                id="mail"
                type="email"
                value={formData.mail}
                onChange={(e) => handleFieldChange('mail', e.target.value)}
                className="mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Application */}
        <div className="border border-border rounded-lg p-2.5 md:p-3">
          <h4 className="text-base md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">Application</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="application" className="text-sm font-medium text-muted-foreground">APPLICATION</Label>
              <Select
                value={formData.application || undefined}
                onValueChange={(val) => {
                  const subs = (allMachines && allMachines.length > 0)
                    ? allMachines.filter(m => m.application === val).map(m => m.sub_application)
                    : machineSpecifications.filter(m => m.application === val).map(m => m.subApplication);
                  const first = subs.sort((a, b) => a.localeCompare(b))[0] || "";
                  setFormData(prev => ({ ...prev, application: val, subApplication: first }));
                }}
              >
                <SelectTrigger id="application" className="mt-0.5">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {applicationOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subApplication" className="text-sm font-medium text-muted-foreground">SUB APPLICATION</Label>
              <Select
                value={formData.subApplication || undefined}
                onValueChange={(val) => handleFieldChange('subApplication', val)}
              >
                <SelectTrigger id="subApplication" className="mt-0.5">
                  <SelectValue placeholder="Select sub application" />
                </SelectTrigger>
                <SelectContent>
                  {subApplicationOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="feedSolid" className="text-sm font-medium text-muted-foreground">FEED SOLID (%)</Label>
              <Input
                id="feedSolid"
                type="number"
                step="0.1"
                value={Number(formData.feedSolid) ?? 0}
                onChange={(e) => handleFieldChange('feedSolid', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="capacityPerDay" className="text-sm font-medium text-muted-foreground">INPUT / DAY</Label>
              <Input
                id="capacityPerDay"
                type="number"
                value={formData.capacityPerDay}
                onChange={(e) => handleFieldChange('capacityPerDay', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Calculation details */}
        <div className="border border-border rounded-lg p-2.5 md:p-3">
          <h4 className="text-base md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">Calculation details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="years" className="text-sm font-medium text-muted-foreground">YEARS RUNTIME</Label>
              <Input
                id="years"
                type="number"
                value={formData.years}
                onChange={(e) => handleFieldChange('years', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="workdaysPerWeek" className="text-sm font-medium text-muted-foreground">WORKDAYS / WEEK</Label>
              <Input
                id="workdaysPerWeek"
                type="number"
                value={formData.workdaysPerWeek}
                onChange={(e) => handleFieldChange('workdaysPerWeek', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="energyPriceEurPerKwh" className="text-sm font-medium text-muted-foreground">ENERGY PRICE (€/kWh)</Label>
              <Input
                id="energyPriceEurPerKwh"
                type="number"
                step="0.001"
                value={formData.energyPriceEurPerKwh}
                onChange={(e) => handleFieldChange('energyPriceEurPerKwh', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="waterPriceEurPerL" className="text-sm font-medium text-muted-foreground">WATER PRICE (€/L)</Label>
              <Input
                id="waterPriceEurPerL"
                type="number"
                step="0.0001"
                value={formData.waterPriceEurPerL}
                onChange={(e) => handleFieldChange('waterPriceEurPerL', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Constraints */}
        <div className="border border-border rounded-lg p-2.5 md:p-3">
          <h4 className="text-base md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">Constraints</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <div>
              <Label htmlFor="protectionClass" className="text-sm font-medium text-muted-foreground">PROTECTION CLASS</Label>
              <Select
                value={formData.protectionClass || undefined}
                onValueChange={(val) => handleFieldChange('protectionClass', val)}
              >
                <SelectTrigger id="protectionClass" className="mt-0.5">
                  <SelectValue placeholder="Select protection class" />
                </SelectTrigger>
                <SelectContent>
                  {protectionClassOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="motorEfficiency" className="text-sm font-medium text-muted-foreground">MOTOR EFFICIENCY</Label>
              <Select
                value={formData.motorEfficiency || undefined}
                onValueChange={(val) => handleFieldChange('motorEfficiency', val)}
              >
                <SelectTrigger id="motorEfficiency" className="mt-0.5">
                  <SelectValue placeholder="Select motor efficiency" />
                </SelectTrigger>
                <SelectContent>
                  {motorEfficiencyOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxWidth" className="text-sm font-medium text-muted-foreground">MAX WIDTH (mm)</Label>
              <Input
                id="maxWidth"
                type="number"
                value={formData.maxWidth}
                onChange={(e) => handleFieldChange('maxWidth', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="maxLength" className="text-sm font-medium text-muted-foreground">MAX LENGTH (mm)</Label>
              <Input
                id="maxLength"
                type="number"
                value={formData.maxLength}
                onChange={(e) => handleFieldChange('maxLength', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="maxHeight" className="text-sm font-medium text-muted-foreground">MAX HEIGHT (mm)</Label>
              <Input
                id="maxHeight"
                type="number"
                value={formData.maxHeight}
                onChange={(e) => handleFieldChange('maxHeight', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="maxWeight" className="text-sm font-medium text-muted-foreground">MAX WEIGHT (kg)</Label>
              <Input
                id="maxWeight"
                type="number"
                value={formData.maxWeight}
                onChange={(e) => handleFieldChange('maxWeight', Number(e.target.value))}
                className="mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="pt-0">
          <div className="grid grid-cols-2 gap-1">
            <Button
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary/90 py-2.5 text-sm md:text-base"
            >
              CALCULATE
            </Button>
            <Button
              onClick={() => {
                if (tcoResults.length > 0) {
                  navigate(`/project/${encodeURIComponent(formData.projectName)}/compare`);
                }
              }}
              disabled={tcoResults.length === 0}
              className={`${tcoResults.length > 0 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted'} w-full py-2.5 text-sm md:text-base`}
            >
              COMPARE
            </Button>
          </div>
        </div>
      </div>

      {/* TCO Results Section */}
      {hasCalculated && (
        <div ref={tcoResultsRef} className="mt-4 md:mt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">MOST COST-EFFECTIVE MACHINES (TCO)</h3>
            {isCalculating && (
              <p className="text-sm text-muted-foreground mt-1">Calculating…</p>
            )}
            {!isCalculating && (
              <p className="text-sm text-muted-foreground mt-1">
                {tcoResults.length > 0
                  ? "Calculated from backend for relevant machines"
                  : "No results yet"}
              </p>
            )}
            {calcError && (
              <p className="text-sm text-red-600 mt-1">{calcError}</p>
            )}
          </div>

        <div className="space-y-2">
          {tcoResults.length > 0 ? (
            <>
              {/* Backend results table */}
              <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                <div>MACHINE</div>
                <div>Acquisition</div>
                <div>Commissioning</div>
                <div>Operating</div>
                <div>Maintenance</div>
                <div>Total</div>
              </div>
              {tcoResults.map((r, idx) => (
                <Card key={idx} className="p-4 bg-accent/10">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-foreground">{formatCurrency(r.ca)}</div>
                    <div className="text-foreground">{formatCurrency(r.cc)}</div>
                    <div className="text-foreground">{formatCurrency(r.co)}</div>
                    <div className="text-foreground">{formatCurrency(r.cm)}</div>
                    <div className="font-bold text-primary text-lg">{formatCurrency(r.total)}</div>
                  </div>
                </Card>
              ))}
            </>
          ) : null}

          {/* TCO Formula Info */}
          <div className="mt-4 p-3 bg-muted/30 rounded-md">
            <p className="text-xs text-muted-foreground">
              <strong>TCO Formula:</strong> Ca (Acquisition) + Cc (Commissioning) + Co (Operating) + Cm (Maintenance) + Cp (Production Impact) + Cd (Disposal) - Ve (End-of-Life Value)
            </p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}