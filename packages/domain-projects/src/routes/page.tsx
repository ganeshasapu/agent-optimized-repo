import { projectService } from "../services/project.service";
import { ProjectList } from "../components/project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await projectService.list();

  return (
    <main className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Projects</h1>
      <ProjectList projects={projects} />
    </main>
  );
}
