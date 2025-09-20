import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Project } from "@/types/project";
import { apiGetProject, mapBackendProjectToFrontend, apiUpsertProject, mapFrontendProjectToBackend } from "@/lib/api";

const ProjectDetail = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState("projects");
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (id) {
        // Try to load from backend by project name (id is set to name in mapping)
        try {
          const resp = await apiGetProject(id);
          if (!isMounted) return;
          setProject(mapBackendProjectToFrontend(resp.project));
        } catch (e) {
          if (isMounted) setProject(null);
        }
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  const handleMenuItemClick = (item: string) => {
    setActiveMenuItem(item);
    if (item === 'projects') {
      navigate('/');
    } else if (item === 'machines') {
      navigate('/?section=machines');
    } else if (item === 'tco-formula') {
      navigate('/?section=tco-formula');
    }
  };

  const handleProjectUpdate = async (updatedProject: Project) => {
    setProject(updatedProject);
    try {
      const payload = mapFrontendProjectToBackend(updatedProject);
      await apiUpsertProject(payload);
    } catch (e) {
      // keep UI responsive; error can be handled with toast in future
      console.error("Failed to save project to backend", e);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
          <main className="flex-1 p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Project not found</h2>
              <p className="text-muted-foreground mt-2">The requested project could not be found.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeItem={activeMenuItem} onItemClick={handleMenuItemClick} />
        <main className="flex-1 overflow-y-auto">
          <ProjectForm 
            project={project}
            onUpdate={handleProjectUpdate}
          />
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;