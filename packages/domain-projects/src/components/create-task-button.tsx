"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input } from "@biarritz/ui";

import { createTaskAction } from "../actions/task.actions";

interface CreateTaskButtonProps {
  projectId: string;
}

export function CreateTaskButton({ projectId }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const result = await createTaskAction(formData);
    if (result.success) {
      setOpen(false);
      setError(null);
    } else {
      setError("Failed to create task. Please try again.");
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Create Task
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="projectId" value={projectId} />
      <Input
        name="title"
        placeholder="Task title"
        className="h-8 text-xs"
        autoFocus
        required
      />
      <Button type="submit" size="sm">
        Add
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => { setOpen(false); setError(null); }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
