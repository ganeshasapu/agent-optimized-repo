import { User } from "lucide-react";

interface TaskAssigneeProps {
  name: string | null;
}

export function TaskAssignee({ name }: TaskAssigneeProps) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <User className="h-3 w-3" />
      <span className="text-xs">{name ?? "Unassigned"}</span>
    </span>
  );
}
