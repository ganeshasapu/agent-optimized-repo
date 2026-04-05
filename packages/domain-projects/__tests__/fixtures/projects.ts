import type { Project } from "../../src/types/index";

export const mockProjects: Project[] = [
  {
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "Alpha Project",
    identifier: "ALPHA",
    description: "First test project",
    ownerId: "550e8400-e29b-41d4-a716-446655440001",
    issueCount: 0,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440002",
    name: "Beta Project",
    identifier: "BETA",
    description: null,
    ownerId: "550e8400-e29b-41d4-a716-446655440002",
    issueCount: 0,
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
];
