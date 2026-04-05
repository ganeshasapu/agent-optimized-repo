import Link from "next/link";

import type { Project } from "../types/index";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No projects yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create your first project to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`} className="list-row">
          <span className="font-medium text-foreground truncate">{project.name}</span>
          {project.description && (
            <span className="text-muted-foreground text-xs truncate ml-3 flex-1">
              {project.description}
            </span>
          )}
          <span className="text-muted-foreground ml-auto text-xs shrink-0">
            {project.createdAt.toLocaleDateString()}
          </span>
        </Link>
      ))}
    </div>
  );
}
