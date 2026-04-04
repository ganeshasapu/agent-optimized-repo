import { FolderKanban } from "lucide-react";

import { projectService } from "../services/project.service";
import { ProjectList } from "../components/project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await projectService.getProjects();

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <div className="flex items-center gap-1.5">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-sm font-medium">Projects</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="section-heading px-4 py-1.5 border-b">
          <span>Name</span>
        </div>
        <ProjectList projects={projects} />
      </div>
    </div>
  );
}
