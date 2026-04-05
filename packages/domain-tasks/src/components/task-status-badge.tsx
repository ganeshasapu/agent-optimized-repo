import { Badge } from "@biarritz/ui";

import type { TaskStatus } from "../types/index";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
};

const STATUS_VARIANTS: Record<TaskStatus, "default" | "secondary" | "outline"> = {
  todo: "outline",
  in_progress: "secondary",
  done: "default",
};

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
