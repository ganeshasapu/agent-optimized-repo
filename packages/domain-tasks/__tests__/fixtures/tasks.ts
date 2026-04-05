import type { Task, TaskComment } from "../../src/types/index";

export const mockTasks: Task[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    title: "Set up CI pipeline",
    description: "Configure GitHub Actions for automated testing",
    status: "todo",
    priority: "high",
    projectId: null,
    assigneeId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    title: "Write unit tests",
    description: null,
    status: "in_progress",
    priority: "medium",
    projectId: null,
    assigneeId: null,
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    title: "Deploy to production",
    description: "Deploy the latest release",
    status: "done",
    priority: "urgent",
    projectId: null,
    assigneeId: null,
    createdAt: new Date("2026-01-03"),
    updatedAt: new Date("2026-01-03"),
  },
];

export const mockComments: TaskComment[] = [
  {
    id: "660e8400-e29b-41d4-a716-446655440020",
    taskId: "550e8400-e29b-41d4-a716-446655440010",
    authorId: "550e8400-e29b-41d4-a716-446655440001",
    body: "This is the first comment",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "660e8400-e29b-41d4-a716-446655440021",
    taskId: "550e8400-e29b-41d4-a716-446655440010",
    authorId: "550e8400-e29b-41d4-a716-446655440002",
    body: "Working on it now",
    createdAt: new Date("2026-01-02"),
    updatedAt: new Date("2026-01-02"),
  },
];
