import { useEffect, useRef, useState } from "react";
import { Project, Machine } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { apiCalculateProjectTCO } from "@/lib/api";

interface ProjectFormProps {
  project: Project;
  onUpdate: (project: Project) => void;
  isNewProject?: boolean;
}

export function ProjectForm({ project, onUpdate, isNewProject = false }: ProjectFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Project>(project);
  const [hasCalculated, setHasCalculated] = useState(!isNewProject);
  const [tcoResults, setTcoResults] = useState<Array<{ name: string; ca: number; cc: number; co: number; cm: number; total: number }>>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const tcoResultsRef = useRef<HTMLDivElement | null>(null);

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

  // Auto-calc on mount for existing projects
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isNewProject) return;
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
  }, [isNewProject, formData.projectName]);

  return (
    <div className="p-3 space-y-3 md:p-5 md:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-primary hover:text-primary/80"
          >
            PROJECTS
          </Button>
          <span className="text-muted-foreground">/</span>
          <Input
            value={formData.projectName}
            onChange={(e) => handleFieldChange('projectName', e.target.value)}
            className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
            style={{ width: `${formData.projectName.length + 1}ch` }}
          />
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
              <Input
                id="application"
                value={formData.application}
                onChange={(e) => handleFieldChange('application', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="subApplication" className="text-sm font-medium text-muted-foreground">SUB APPLICATION</Label>
              <Input
                id="subApplication"
                value={formData.subApplication}
                onChange={(e) => handleFieldChange('subApplication', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="feedSolid" className="text-sm font-medium text-muted-foreground">FEED SOLID (%)</Label>
              <Input
                id="feedSolid"
                value={formData.feedSolid}
                onChange={(e) => handleFieldChange('feedSolid', e.target.value)}
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
              <Input
                id="protectionClass"
                value={formData.protectionClass}
                onChange={(e) => handleFieldChange('protectionClass', e.target.value)}
                className="mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="motorEfficiency" className="text-sm font-medium text-muted-foreground">MOTOR EFFICIENCY</Label>
              <Input
                id="motorEfficiency"
                value={formData.motorEfficiency}
                onChange={(e) => handleFieldChange('motorEfficiency', e.target.value)}
                className="mt-0.5"
              />
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