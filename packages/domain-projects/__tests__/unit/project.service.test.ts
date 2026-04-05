import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(),
  projects: {
    id: "id",
    name: "name",
    description: "description",
    ownerId: "owner_id",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

describe("projectService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { projectService } = await import("../../src/services/project.service");
    expect(projectService).toBeDefined();
    expect(projectService.getProjects).toBeInstanceOf(Function);
    expect(projectService.getProjectById).toBeInstanceOf(Function);
    expect(projectService.createProject).toBeInstanceOf(Function);
    expect(projectService.deleteProject).toBeInstanceOf(Function);
  });

  it("getProjects calls db.select().from(projects)", async () => {
    const mockRows = [
      {
        id: "660e8400-e29b-41d4-a716-446655440001",
        name: "Alpha Project",
        description: "First test project",
        ownerId: "550e8400-e29b-41d4-a716-446655440001",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-01"),
      },
    ];

    const mockFrom = vi.fn().mockResolvedValue(mockRows);
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ select: mockSelect } as never);

    const { projectService } = await import("../../src/services/project.service");
    const result = await projectService.getProjects();

    expect(mockSelect).toHaveBeenCalled();
    expect(result).toEqual(mockRows);
  });

  it("getProjectById returns null when not found", async () => {
    const mockWhere = vi.fn().mockResolvedValue([]);
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ select: mockSelect } as never);

    const { projectService } = await import("../../src/services/project.service");
    const result = await projectService.getProjectById("non-existent-id");

    expect(result).toBeNull();
  });

  it("createProject inserts and returns project", async () => {
    const newProject = {
      id: "660e8400-e29b-41d4-a716-446655440001",
      name: "New Project",
      description: null,
      ownerId: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockReturning = vi.fn().mockResolvedValue([newProject]);
    const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ insert: mockInsert } as never);

    const { projectService } = await import("../../src/services/project.service");
    const result = await projectService.createProject({
      name: "New Project",
      identifier: "NEW",
      ownerId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual(newProject);
  });

  it("deleteProject removes and returns deleted project", async () => {
    const deleted = {
      id: "660e8400-e29b-41d4-a716-446655440001",
      name: "Alpha Project",
      description: null,
      ownerId: "550e8400-e29b-41d4-a716-446655440001",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockReturning = vi.fn().mockResolvedValue([deleted]);
    const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
    const mockDelete = vi.fn().mockReturnValue({ where: mockWhere });
    const { getDb } = await import("@biarritz/db");
    vi.mocked(getDb).mockReturnValue({ delete: mockDelete } as never);

    const { projectService } = await import("../../src/services/project.service");
    const result = await projectService.deleteProject("660e8400-e29b-41d4-a716-446655440001");

    expect(mockDelete).toHaveBeenCalled();
    expect(result).toEqual(deleted);
  });
});
