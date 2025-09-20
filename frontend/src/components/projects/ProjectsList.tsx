import { Project } from "@/types/project";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { machineSpecifications } from "@/data/machineSpecifications";

interface ProjectsListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectsList({ projects, onProjectClick }: ProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(
    (project) =>
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate the most cost-effective TCO for a project (lowest TCO from the 3 machines)
  const getMostCostEffectiveTCO = (project: Project): number => {
    // Get existing machine names in this project to avoid duplicates
    const existingMachineNames = project.machines.map(m => m.name);
    
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

    const exampleMachines = selectedSpecs.map((spec) => ({
      listPrice: spec!.listPrice,
      totalOperationCosts: Math.round(spec!.powerConsumptionTotalKW * 0.156 * 4000),
      totalMaintenanceCosts: Math.round(spec!.listPrice * 0.08),
      tco: 0
    }));

    // Calculate TCO for each machine
    exampleMachines.forEach(machine => {
      machine.tco = machine.listPrice + machine.totalOperationCosts + machine.totalMaintenanceCosts;
    });

    // Include existing project machines in the calculation
    const projectMachines = project.machines.map(machine => ({
      tco: machine.listPrice + machine.totalOperationCosts + machine.totalMaintenanceCosts
    }));

    // Combine all machines and get the lowest TCO
    const allMachines = [...exampleMachines, ...projectMachines];
    const sortedByTCO = allMachines.sort((a, b) => a.tco - b.tco);
    
    // Return the most cost-effective (lowest) TCO
    return sortedByTCO.length > 0 ? sortedByTCO[0].tco : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Projects</h2>
        <div className="w-64">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Header Row */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
          <div>PROJECT NAME</div>
          <div>COMPANY</div>
          <div>CONTACT</div>
          <div>APPLICATION</div>
          <div>THROUGHPUT</div>
          <div>TCO €</div>
        </div>

        {/* Project Rows */}
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onProjectClick(project)}
          >
            <div className="grid grid-cols-6 gap-4 px-4 py-4 items-center">
              <div className="font-medium text-foreground">
                {project.projectName}
              </div>
              <div className="text-foreground">
                {project.company}
              </div>
              <div className="text-foreground">
                {project.contact}
              </div>
              <div className="text-foreground">
                {project.application}
              </div>
              <div className="text-foreground">
                {project.capacityPerDay.toLocaleString('de-DE')}
              </div>
              <div className="font-semibold text-foreground">
                {formatCurrency(getMostCostEffectiveTCO(project))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}