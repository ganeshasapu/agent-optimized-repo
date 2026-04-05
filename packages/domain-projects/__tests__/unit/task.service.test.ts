import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(),
  tasks: {
    id: "id",
    projectId: "project_id",
    title: "title",
    status: "status",
    assigneeId: "assignee_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService).toBeDefined();
    expect(taskService.getTasksByProjectId).toBeInstanceOf(Function);
    expect(taskService.createTask).toBeInstanceOf(Function);
  });

  it("getTasksByProjectId returns tasks for a project", async () => {
    const projectId = "660e8400-e29b-41d4-a716-446655440001";
    const mockRows = [
      {
        id: "770e8400-e29b-41d4-a716-446655440001",
        projectId,
        title: "Fix login bug",
        status: "todo",
        assigneeId: null,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ];

    const mockWhere = vi.fn().mockResolvedValue(mockRows);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ select: mockSelect } as never);

    const { taskService } = await import("../../src/services/task.service");
    const result = await taskService.getTasksByProjectId(projectId);

    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(result).toEqual(mockRows);
  });

  it("createTask inserts and returns task", async () => {
    const newTask = {
      id: "770e8400-e29b-41d4-a716-446655440001",
      projectId: "660e8400-e29b-41d4-a716-446655440001",
      title: "Fix login bug",
      status: "todo",
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockReturning = vi.fn().mockResolvedValue([newTask]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const { taskService } = await import("../../src/services/task.service");
    const result = await taskService.createTask({
      projectId: "660e8400-e29b-41d4-a716-446655440001",
      title: "Fix login bug",
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual(newTask);
  });
});
