import { notFound } from "next/navigation";

import { Badge } from "@biarritz/ui";

import { projectService } from "../../services/project.service";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await projectService.getById(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <Badge
          variant={project.status === "active" ? "default" : "secondary"}
        >
          {project.status}
        </Badge>
      </div>
      {project.description && (
        <p className="text-muted-foreground mb-4">{project.description}</p>
      )}
      <p className="text-sm text-muted-foreground">
        Created {project.createdAt.toLocaleDateString()}
      </p>
    </main>
  );
}
