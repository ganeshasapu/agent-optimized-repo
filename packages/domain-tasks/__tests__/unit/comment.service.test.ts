import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockComments } from "../fixtures/tasks";

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockValues = vi.fn();
const mockReturning = vi.fn();

const mockDb = {
  select: mockSelect,
  insert: mockInsert,
};

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(() => mockDb),
  tasks: { id: "id" },
  taskComments: {
    id: "id",
    taskId: "task_id",
    authorId: "author_id",
    body: "body",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val, type: "eq" })),
}));

describe("commentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockWhere.mockResolvedValue(mockComments);
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });

    mockReturning.mockResolvedValue([mockComments[0]]);
    mockValues.mockReturnValue({ returning: mockReturning });
    mockInsert.mockReturnValue({ values: mockValues });
  });

  it("should export commentService", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    expect(commentService).toBeDefined();
  });

  it("listByTaskId() should be a function", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    expect(commentService.listByTaskId).toBeInstanceOf(Function);
  });

  it("create() should be a function", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    expect(commentService.create).toBeInstanceOf(Function);
  });

  it("listByTaskId() queries by taskId", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    const result = await commentService.listByTaskId("550e8400-e29b-41d4-a716-446655440010");
    expect(mockSelect).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
    expect(result).toEqual(mockComments);
  });

  it("create() inserts a new comment", async () => {
    const { commentService } = await import("../../src/services/comment.service");
    const input = {
      taskId: "550e8400-e29b-41d4-a716-446655440010",
      authorId: "550e8400-e29b-41d4-a716-446655440001",
      body: "A new comment",
    };
    const result = await commentService.create(input);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(input);
    expect(result).toEqual(mockComments[0]);
  });
});
