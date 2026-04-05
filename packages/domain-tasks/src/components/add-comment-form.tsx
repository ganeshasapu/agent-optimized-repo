"use client";

import { useRef } from "react";

import { Button, Textarea } from "@biarritz/ui";

import { addCommentAction } from "../actions/task.actions";

interface AddCommentFormProps {
  taskId: string;
  authorId: string;
}

export function AddCommentForm({ taskId, authorId }: AddCommentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    await addCommentAction(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="authorId" value={authorId} />
      <Textarea
        name="body"
        placeholder="Add a comment..."
        className="resize-none text-[13px]"
        rows={3}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm">
          Comment
        </Button>
      </div>
    </form>
  );
}
