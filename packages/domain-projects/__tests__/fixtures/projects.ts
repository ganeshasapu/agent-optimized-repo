import type { Project } from "../../src/types/index";

export const mockProjects: Project[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Alpha Project",
    description: "First test project",
    status: "active",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Beta Project",
    description: "Second test project",
    status: "archived",
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
];
