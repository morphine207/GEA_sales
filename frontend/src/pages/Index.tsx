import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectsList } from "@/components/projects/ProjectsList";
import { MachineSpecsTable } from "@/components/machines/MachineSpecsTable";
import { Project } from "@/types/project";
import { apiListProjects, mapBackendProjectToFrontend, apiCalculateProjectTCO } from "@/lib/api";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Handle URL parameters for section navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get('section');
    if (section && ['projects', 'machines', 'tco-formula'].includes(section)) {
      setActiveMenuItem(section);
    }
  }, [location.search]);

  // Load projects from backend
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiListProjects();
        if (!isMounted) return;
        const mapped = resp.projects.map(mapBackendProjectToFrontend);
        setProjects(mapped);
        // Auto-calculate TCO for each project after loading
        // Update each project in state as results arrive
        for (const p of mapped) {
          (async () => {
            try {
              const tcoResp = await apiCalculateProjectTCO(p.projectName, {
                years: p.years,
                electricity_eur_per_kwh: p.energyPriceEurPerKwh,
                water_eur_per_l: p.waterPriceEurPerL,
                operation_hours_per_day: 16,
                workdays_per_week: p.workdaysPerWeek,
              });
              const totals = (tcoResp.tco_results || []).map(r => {
                const last = Array.isArray(r.monthly_cum_total) && r.monthly_cum_total.length > 0
                  ? r.monthly_cum_total[r.monthly_cum_total.length - 1]
                  : (r.ca + r.cc + r.co + r.cm);
                return last;
              });
              const minTotal = totals.length ? Math.min(...totals) : 0;
              if (!isMounted) return;
              setProjects(prev => prev.map(pr => pr.id === p.id ? { ...pr, tcoTotal: minTotal } : pr));
            } catch (e) {
              // ignore TCO errors for list view; keep placeholder
            }
          })();
        }
        setError("");
      } catch (e: any) {
        if (!isMounted) return;
        setProjects([]);
        setError("Failed to load projects from backend.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleNewProject = () => {
    // Navigate to the new project route
    navigate('/project/new');
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    // Update URL to reflect the current section
    const newUrl = item === 'projects' ? '/' : `/?section=${item}`;
    window.history.replaceState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onNewProject={handleNewProject} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        <main className="flex-1 overflow-y-auto">
          {activeMenuItem === "projects" && (
            <>
              {loading && (
                <div className="p-6 text-sm text-muted-foreground">Loading projects…</div>
              )}
              {!loading && error && (
                <div className="p-6 text-sm text-red-600">{error}</div>
              )}
              {!loading && !error && (
                <ProjectsList 
                  projects={projects}
                  onProjectClick={handleProjectClick}
                />
              )}
            </>
          )}
          {activeMenuItem === "machines" && (
            <MachineSpecsTable />
          )}
          {activeMenuItem === "tco-formula" && (
            <div className="p-6 max-w-4xl">
              <h2 className="text-2xl font-bold text-primary mb-6">TCO Formula</h2>
              
              {/* Main Formula */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-primary mb-4">Total Cost of Ownership (TCO) - Nominal over horizon Y</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">
                    TCO = Ca + Cc + Co + Cm + Cp + Cd - Ve
                  </div>
                  <p className="text-muted-foreground">Complete lifecycle cost calculation</p>
                </div>
              </div>

              {/* Cost Components */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Ca</span>
                    Acquisition Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Engineering, procurement, auxiliary equipment</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Cc</span>
                    Commissioning Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Construction, start-up, training</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Co</span>
                    Operating Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Energy, operators, materials handling</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Cm</span>
                    Maintenance Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Personnel, spares, test equipment</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Cp</span>
                    Production Impact Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Downtime losses, quality, environment</p>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center">
                    <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Cd</span>
                    Removal Cost
                  </h4>
                  <p className="text-muted-foreground text-sm">Equipment disposal and removal</p>
                </div>
              </div>

              {/* End of Life Value */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">Ve</span>
                  Value End of Life (Benefit)
                </h4>
                <div className="text-green-700">
                  <p className="mb-2"><strong>Gross Scrap Value Recovery</strong></p>
                  <p className="text-sm">Stainless steel components retain significant value:</p>
                  <ul className="text-sm mt-2 ml-4 list-disc">
                    <li>Equipment ⌀300mm typically yields 500-700kg stainless steel</li>
                    <li>Current scrap rate: <strong>€0.60/kg</strong></li>
                    <li>Typical recovery: <strong>€300-420 per unit</strong></li>
                  </ul>
                </div>
              </div>

              {/* Sales Benefits */}
              <div className="mt-6 p-4 bg-accent/20 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">💡 Sales Benefits</h4>
                <div className="text-sm text-muted-foreground">
                  <p>• <strong>Complete transparency:</strong> Show customers the full cost picture</p>
                  <p>• <strong>Value justification:</strong> Demonstrate long-term savings vs. initial price</p>
                  <p>• <strong>Competitive advantage:</strong> GEA's superior efficiency reduces operating costs</p>
                  <p>• <strong>Asset recovery:</strong> Highlight end-of-life value that competitors often ignore</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
