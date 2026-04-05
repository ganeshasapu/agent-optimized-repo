import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { projectService } from "../../services/project.service";
import { taskService } from "../../services/task.service";
import { TaskList } from "../../components/task-list";
import { CreateTaskButton } from "../../components/create-task-button";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, tasks] = await Promise.all([
    projectService.getProjectById(id),
    taskService.getTasksByProjectId(id),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <div className="flex items-center gap-1.5">
          <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">{project.name}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl flex flex-col gap-6">
          <div>
            <h1 className="text-sm font-medium mb-4">{project.name}</h1>
            <div className="flex flex-col gap-3">
              {project.description && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground w-24 shrink-0 text-xs">Description</span>
                  <span className="text-foreground text-xs">{project.description}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">Owner</span>
                <span className="text-foreground text-xs">{project.ownerId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">Created</span>
                <span className="text-foreground text-xs">
                  {project.createdAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-24 shrink-0 text-xs">Updated</span>
                <span className="text-foreground text-xs">
                  {project.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="section-heading">Tasks</span>
              <CreateTaskButton projectId={project.id} />
            </div>
            <div className="border border-border rounded-md overflow-hidden">
              <TaskList tasks={tasks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
