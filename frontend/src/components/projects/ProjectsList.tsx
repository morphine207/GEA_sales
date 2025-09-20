import { Project } from "@/types/project";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

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

  // TCO will be calculated in detail view; keep column but show placeholder
  const getMostCostEffectiveTCO = (_project: Project): string => {
    return "—";
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
              <div className="font-semibold text-foreground text-muted-foreground">
                {getMostCostEffectiveTCO(project)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}