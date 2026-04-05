import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@biarritz/ui";
import { getDb, users } from "@biarritz/db";

import { updateTaskStatusAction } from "../../actions/task.actions";
import { AddCommentForm } from "../../components/add-comment-form";
import { TaskAssignee } from "../../components/task-assignee";
import { taskService } from "../../services/task.service";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, allUsers] = await Promise.all([
    taskService.getById(id),
    getDb().select({ id: users.id, name: users.name, email: users.email }).from(users),
  ]);

  if (!task) {
    notFound();
  }

  const comments = await taskService.getComments(id);
  const firstUser = allUsers[0];

  return (
    <div className="flex flex-col h-full">
      <header className="page-header">
        <div className="flex items-center gap-1.5">
          <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground">
            Tasks
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium">{task.title}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl flex flex-col gap-6">
          {/* Task title and description */}
          <div>
            <h1 className="text-sm font-medium mb-2">{task.title}</h1>
            {task.description && (
              <p className="text-muted-foreground text-[13px]">{task.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {/* Status selector */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 shrink-0 text-[13px]">Status</span>
              <form action={updateTaskStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="taskId" value={task.id} />
                <Label className="sr-only" htmlFor="status">Status</Label>
                <Select name="status" defaultValue={task.status}>
                  <SelectTrigger id="status" className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                  Update
                </Button>
              </form>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 shrink-0 text-[13px]">Assignee</span>
              <TaskAssignee name={task.assigneeName} />
            </div>

            {/* Project */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-24 shrink-0 text-[13px]">Project</span>
              <span className="text-[13px] text-foreground">{task.projectName}</span>
            </div>
          </div>

          {/* Comments thread */}
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <span className="section-heading">Comments</span>

            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {comment.authorName ?? comment.authorEmail}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {comment.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[13px] text-foreground">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}

            {firstUser && (
              <div className="pt-2">
                <AddCommentForm taskId={task.id} authorId={firstUser.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
