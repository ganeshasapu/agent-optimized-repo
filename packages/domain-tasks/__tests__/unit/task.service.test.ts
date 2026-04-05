import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockTasks } from "../fixtures/tasks";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
};

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(() => mockDb),
  tasks: {
    id: "id",
    title: "title",
    status: "status",
    priority: "priority",
  },
  taskComments: {
    id: "id",
    taskId: "task_id",
    authorId: "author_id",
    body: "body",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, type: "eq" })),
  and: vi.fn((...conditions) => ({ conditions, type: "and" })),
}));

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue(mockTasks);
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockImplementation(() => ({
      where: mockWhere,
      then: (resolve: (v: typeof mockTasks) => void) => resolve(mockTasks),
    }));

    mockReturning.mockResolvedValue([mockTasks[0]]);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });

    mockSet.mockReturnValue({ where: mockWhere });
    mockWhere.mockImplementation(() => ({
      returning: mockReturning,
      then: (resolve: (v: typeof mockTasks) => void) => resolve(mockTasks),
    }));
    mockUpdate.mockReturnValue({ set: mockSet });

    mockDelete.mockReturnValue({ where: mockWhere });
  });

  it("should export taskService", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService).toBeDefined();
  });

  it("list() should be a function", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService.list).toBeInstanceOf(Function);
  });

  it("getById() should be a function", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService.getById).toBeInstanceOf(Function);
  });

  it("create() should be a function", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService.create).toBeInstanceOf(Function);
  });

  it("update() should be a function", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService.update).toBeInstanceOf(Function);
  });

  it("delete() should be a function", async () => {
    const { taskService } = await import("../../src/services/task.service");
    expect(taskService.delete).toBeInstanceOf(Function);
  });

  it("list() calls db.select().from(tasks) without filters", async () => {
    mockFrom.mockReturnValue({
      then: (resolve: (v: typeof mockTasks) => void) => resolve(mockTasks),
    });
    const { taskService } = await import("../../src/services/task.service");
    const result = await taskService.list();
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(result).toEqual(mockTasks);
  });

  it("list() calls where() when status filter is provided", async () => {
    mockWhere.mockResolvedValue([mockTasks[1]]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const { taskService } = await import("../../src/services/task.service");
    await taskService.list({ status: "in_progress" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("list() calls where() when priority filter is provided", async () => {
    mockWhere.mockResolvedValue([mockTasks[0]]);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    const { taskService } = await import("../../src/services/task.service");
    await taskService.list({ priority: "high" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("create() calls db.insert with values", async () => {
    mockReturning.mockResolvedValue([mockTasks[0]]);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });

    const { taskService } = await import("../../src/services/task.service");
    const result = await taskService.create({ title: "New task" });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({ title: "New task" });
    expect(result).toEqual(mockTasks[0]);
  });
});
