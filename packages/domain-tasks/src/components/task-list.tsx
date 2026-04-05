import Link from "next/link";

import type { TaskWithRelations } from "../types/index";
import { TaskAssignee } from "./task-assignee";
import { TaskStatusBadge } from "./task-status-badge";

interface TaskListProps {
  tasks: TaskWithRelations[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create your first task to get started.
        </p>
      </div>
    );
  }

  // Group tasks by project
  const grouped = tasks.reduce<Record<string, { projectName: string; tasks: TaskWithRelations[] }>>(
    (acc, task) => {
      const existing = acc[task.projectId];
      if (existing) {
        existing.tasks.push(task);
      } else {
        acc[task.projectId] = { projectName: task.projectName, tasks: [task] };
      }
      return acc;
    },
    {}
  );

  return (
    <div>
      {Object.entries(grouped).map(([projectId, group]) => (
        <div key={projectId}>
          <div className="section-heading px-4 py-1.5 border-b">
            <span>{group.projectName}</span>
          </div>
          <div className="divide-y">
            {group.tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="list-row">
                <span className="font-medium text-foreground truncate flex-1">
                  {task.title}
                </span>
                <div className="flex items-center gap-3 ml-auto shrink-0">
                  <TaskAssignee name={task.assigneeName} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
