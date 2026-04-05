import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(),
  tasks: { id: "id", title: "title", status: "status", projectId: "project_id", assigneeId: "assignee_id" },
  taskComments: { id: "id", taskId: "task_id", authorId: "author_id", body: "body" },
  taskStatusEnum: {},
  projects: { id: "id", name: "name" },
  users: { id: "id", name: "name", email: "email" },
}));

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService).toBeDefined();
    expect(taskService.list).toBeInstanceOf(Function);
    expect(taskService.getById).toBeInstanceOf(Function);
    expect(taskService.create).toBeInstanceOf(Function);
    expect(taskService.update).toBeInstanceOf(Function);
    expect(taskService.delete).toBeInstanceOf(Function);
    expect(taskService.getComments).toBeInstanceOf(Function);
  });
});

describe("commentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    expect(commentService).toBeDefined();
    expect(commentService.create).toBeInstanceOf(Function);
    expect(commentService.delete).toBeInstanceOf(Function);
  });
});
