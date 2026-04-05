import type { TaskWithRelations } from "../types/index";
import { taskService } from "../services/task.service";
import { TaskList } from "../components/task-list";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let tasks: TaskWithRelations[] = [];
  let error: string | null = null;

  try {
    tasks = await taskService.list();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load tasks";
  }

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <h1 className="text-sm font-medium">Tasks</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-foreground">Unable to load tasks</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        ) : (
          <TaskList tasks={tasks} />
        )}
      </div>
    </div>
  );
}
