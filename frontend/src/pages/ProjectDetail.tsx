import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { mockProjects } from "@/data/mockData";
import { Project } from "@/types/project";
import { createNewProject } from "@/utils/projectUtils";

const ProjectDetail = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenuItem, setActiveMenuItem] = useState("projects");
  const [project, setProject] = useState<Project | null>(null);

  const isNewProject = location.pathname === '/project/new';

  useEffect(() => {
    if (isNewProject) {
      // Create a new empty project
      const newProject = createNewProject();
      setProject(newProject);
    } else if (id) {
      // Load existing project
      const foundProject = mockProjects.find(p => p.id === id);
      setProject(foundProject || null);
    }
  }, [id, isNewProject]);

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

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    // TODO: In real app, this would save to backend
    console.log("Updated project:", updatedProject);
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
            isNewProject={isNewProject}
          />
        </main>
      </div>
    </div>
  );
};

export default ProjectDetail;