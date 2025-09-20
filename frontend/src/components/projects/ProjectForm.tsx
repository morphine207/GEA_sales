import { useState } from "react";
import { Project, Machine } from "@/types/project";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReadOnlyMachineRow } from "./ReadOnlyMachineRow";
import { useNavigate } from "react-router-dom";
import { machineSpecifications } from "@/data/machineSpecifications";

interface ProjectFormProps {
  project: Project;
  onUpdate: (project: Project) => void;
  isNewProject?: boolean;
}

export function ProjectForm({ project, onUpdate, isNewProject = false }: ProjectFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Project>(project);
  const [hasCalculated, setHasCalculated] = useState(!isNewProject);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMachineTCO = (machine: Machine): number => {
    return machine.listPrice + machine.totalOperationCosts + machine.totalMaintenanceCosts;
  };

  const handleFieldChange = (field: keyof Project, value: string | number) => {
    const updatedProject = { ...formData, [field]: value };
    setFormData(updatedProject);
  };

  const getTop3CheapestMachines = (): Machine[] => {
    // Get existing machine names in this project to avoid duplicates
    const existingMachineNames = formData.machines.map(m => m.name);
    
    // Select 3 different machines from the specifications database, excluding ones already in project
    const availableSpecs = machineSpecifications.filter(spec => 
      !existingMachineNames.includes(spec.modelNumber)
    );
    
    // Pick diverse machines with different price points
    const selectedSpecs = [
      availableSpecs.find(spec => spec.application === "Wine"),
      availableSpecs.find(spec => spec.application === "Tea"),
      availableSpecs.find(spec => spec.application === "Citrus"),
      availableSpecs.find(spec => spec.application === "Beer"),
      availableSpecs.find(spec => spec.application === "Fruit Juice")
    ].filter(spec => spec !== undefined).slice(0, 3);

    // If we still don't have 3 unique machines, add more from remaining available specs
    if (selectedSpecs.length < 3) {
      const additionalSpecs = availableSpecs.filter(spec => !selectedSpecs.includes(spec))
        .slice(0, 3 - selectedSpecs.length);
      selectedSpecs.push(...additionalSpecs);
    }

    const exampleMachines: Machine[] = selectedSpecs.map((spec, index) => ({
      id: `example-${index + 1}`,
      projectId: formData.id,
      name: spec!.modelNumber, // Use actual model number as name
      listPrice: spec!.listPrice,
      totalOperationCosts: Math.round(spec!.powerConsumptionTotalKW * 0.156 * 4000), // Realistic operating costs based on power consumption
      totalMaintenanceCosts: Math.round(spec!.listPrice * 0.08), // 8% of list price for maintenance
      tco: 0 // Will be calculated below
    }));

    // Calculate TCO for example machines
    exampleMachines.forEach(machine => {
      machine.tco = machine.listPrice + machine.totalOperationCosts + machine.totalMaintenanceCosts;
    });

    // Sort by TCO ascending (most cost-effective first)
    exampleMachines.sort((a, b) => a.tco - b.tco);

    // If we have actual machine data, calculate and sort them by TCO ascending
    if (formData.machines.length > 0) {
      const calculatedMachines = [...formData.machines]
        .map(machine => ({
          ...machine,
          tco: calculateMachineTCO(machine)
        }))
        .sort((a, b) => a.tco - b.tco);

      // Return top 3 calculated machines, pad with unique machine examples if needed
      const result = [...calculatedMachines];
      let exampleIndex = 0;
      while (result.length < 3 && exampleIndex < exampleMachines.length) {
        // Only add if the machine name is not already in the result
        const machineToAdd = exampleMachines[exampleIndex];
        if (!result.some(existing => existing.name === machineToAdd.name)) {
          result.push(machineToAdd);
        }
        exampleIndex++;
      }
      
      // Final sort to ensure everything is in TCO ascending order
      return result.sort((a, b) => a.tco - b.tco).slice(0, 3);
    }

    // If no machines, return the 3 unique machines sorted by TCO ascending
    return exampleMachines.slice(0, 3);
  };

  const handleCalculate = () => {
    const recalculatedMachines = formData.machines.map(machine => ({
      ...machine,
      tco: calculateMachineTCO(machine)
    }));

    const updatedProject = {
      ...formData,
      machines: recalculatedMachines,
      updatedAt: new Date()
    };

    setFormData(updatedProject);
    setHasCalculated(true);
    onUpdate(updatedProject);
  };

  return (
    <div className="p-6 space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">COMPANY</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleFieldChange('company', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="telephone" className="text-sm font-medium text-muted-foreground">TELEPHONE</Label>
            <Input
              id="telephone"
              value={formData.telephone}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="application" className="text-sm font-medium text-muted-foreground">APPLICATION</Label>
            <Input
              id="application"
              value={formData.application}
              onChange={(e) => handleFieldChange('application', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="feedSolid" className="text-sm font-medium text-muted-foreground">FEED SOLID</Label>
            <Input
              id="feedSolid"
              value={formData.feedSolid}
              onChange={(e) => handleFieldChange('feedSolid', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="protectionClass" className="text-sm font-medium text-muted-foreground">PROTECTION CLASS</Label>
            <Input
              id="protectionClass"
              value={formData.protectionClass}
              onChange={(e) => handleFieldChange('protectionClass', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxWidth" className="text-sm font-medium text-muted-foreground">MAX WIDTH</Label>
            <Input
              id="maxWidth"
              type="number"
              value={formData.maxWidth}
              onChange={(e) => handleFieldChange('maxWidth', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxHeight" className="text-sm font-medium text-muted-foreground">MAX HEIGHT</Label>
            <Input
              id="maxHeight"
              type="number"
              value={formData.maxHeight}
              onChange={(e) => handleFieldChange('maxHeight', Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-muted-foreground">CONTACT</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => handleFieldChange('contact', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="mail" className="text-sm font-medium text-muted-foreground">MAIL</Label>
            <Input
              id="mail"
              type="email"
              value={formData.mail}
              onChange={(e) => handleFieldChange('mail', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subApplication" className="text-sm font-medium text-muted-foreground">SUB APPLICATION</Label>
            <Input
              id="subApplication"
              value={formData.subApplication}
              onChange={(e) => handleFieldChange('subApplication', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="capacityPerDay" className="text-sm font-medium text-muted-foreground">CAPACITY / DAY</Label>
            <Input
              id="capacityPerDay"
              type="number"
              value={formData.capacityPerDay}
              onChange={(e) => handleFieldChange('capacityPerDay', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="motorEfficiency" className="text-sm font-medium text-muted-foreground">MOTOR EFFICIENCY</Label>
            <Input
              id="motorEfficiency"
              value={formData.motorEfficiency}
              onChange={(e) => handleFieldChange('motorEfficiency', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxLength" className="text-sm font-medium text-muted-foreground">MAX LENGTH</Label>
            <Input
              id="maxLength"
              type="number"
              value={formData.maxLength}
              onChange={(e) => handleFieldChange('maxLength', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="maxWeight" className="text-sm font-medium text-muted-foreground">MAX WEIGHT</Label>
            <Input
              id="maxWeight"
              type="number"
              value={formData.maxWeight}
              onChange={(e) => handleFieldChange('maxWeight', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          {/* Calculate Button */}
          <div className="mt-6">
            <Button 
              onClick={handleCalculate}
              className="w-full bg-primary hover:bg-primary/90 py-3 text-lg"
            >
              CALCULATE
            </Button>
          </div>
        </div>
      </div>

      {/* Machines Section - Most Cost-Effective */}
      {hasCalculated && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">MOST COST-EFFECTIVE MACHINES (TCO)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              These are the 3 most cost-effective machines based on Total Cost of Ownership
            </p>
          </div>

        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
            <div>MACHINE NAME</div>
            <div>LIST PRICE</div>
            <div>OPERATING COSTS</div>
            <div>MAINTENANCE COSTS</div>
            <div>TCO €</div>
          </div>

          {/* Top 3 Machine Rows - Always show 3 with comprehensive data */}
          {getTop3CheapestMachines().map((machine) => (
            <ReadOnlyMachineRow
              key={machine.id}
              machine={machine}
            />
          ))}
          
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