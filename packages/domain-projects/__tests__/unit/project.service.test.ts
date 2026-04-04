import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(),
  projects: {
    id: "id",
    name: "name",
    description: "description",
    status: "status",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

describe("projectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { projectService } = await import(
      "../../src/services/project.service"
    );
    expect(projectService).toBeDefined();
    expect(projectService.list).toBeInstanceOf(Function);
    expect(projectService.getById).toBeInstanceOf(Function);
    expect(projectService.create).toBeInstanceOf(Function);
    expect(projectService.update).toBeInstanceOf(Function);
    expect(projectService.delete).toBeInstanceOf(Function);
  });

  it("should call getDb when listing projects", async () => {
    const { getDb } = await import("@biarritz/db");
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockResolvedValue([]),
    });
    vi.mocked(getDb).mockReturnValue({ select: mockSelect } as never);

    const { projectService } = await import(
      "../../src/services/project.service"
    );
    const result = await projectService.list();

    expect(getDb).toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("should call getDb when creating a project", async () => {
    const { getDb } = await import("@biarritz/db");
    const mockProject = {
      id: "test-id",
      name: "Test Project",
      description: null,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockInsert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockProject]),
      }),
    });
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const { projectService } = await import(
      "../../src/services/project.service"
    );
    const result = await projectService.create({ name: "Test Project" });

    expect(getDb).toHaveBeenCalled();
    expect(result).toEqual(mockProject);
  });

  it("should return null when project is not found", async () => {
    const { getDb } = await import("@biarritz/db");
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    vi.mocked(getDb).mockReturnValue({ select: mockSelect } as never);

    const { projectService } = await import(
      "../../src/services/project.service"
    );
    const result = await projectService.getById("nonexistent-id");

    expect(result).toBeNull();
  });
});
