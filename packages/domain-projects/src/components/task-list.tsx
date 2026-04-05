import { Circle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@biarritz/ui";

import type { Task } from "../types/index";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "outline" }> = {
  todo: {
    label: "Todo",
    icon: <Circle className="h-3 w-3" />,
    variant: "secondary",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock className="h-3 w-3" />,
    variant: "default",
  },
  done: {
    label: "Done",
    icon: <CheckCircle2 className="h-3 w-3" />,
    variant: "outline",
  },
};

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm font-medium text-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground mt-1">Create the first task for this project.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {tasks.map((task) => {
        const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG["todo"]!;
        return (
          <div key={task.id} className="list-row">
            <div className="flex items-center gap-2">
              <Badge variant={config.variant} className="flex items-center gap-1 text-[11px] h-5 px-1.5">
                {config.icon}
                {config.label}
              </Badge>
              <span className="text-foreground truncate">{task.title}</span>
            </div>
            {task.assigneeId && (
              <span className="text-muted-foreground text-xs ml-auto shrink-0">
                {task.assigneeId}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
