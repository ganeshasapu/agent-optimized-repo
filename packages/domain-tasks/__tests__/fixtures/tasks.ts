import type { TaskCommentWithAuthor, TaskWithRelations } from "../../src/types/index";

export const mockTasks: TaskWithRelations[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010",
    title: "Set up CI pipeline",
    description: "Configure GitHub Actions for automated testing",
    status: "in_progress",
    projectId: "550e8400-e29b-41d4-a716-446655440020",
    assigneeId: "550e8400-e29b-41d4-a716-446655440001",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    projectName: "Alpha",
    assigneeName: "Alice",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011",
    title: "Write unit tests",
    description: null,
    status: "todo",
    projectId: "550e8400-e29b-41d4-a716-446655440020",
    assigneeId: null,
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
    projectName: "Alpha",
    assigneeName: null,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012",
    title: "Deploy to production",
    description: "Final deployment steps",
    status: "done",
    projectId: "550e8400-e29b-41d4-a716-446655440021",
    assigneeId: "550e8400-e29b-41d4-a716-446655440002",
    createdAt: new Date("2025-01-03"),
    updatedAt: new Date("2025-01-03"),
    projectName: "Beta",
    assigneeName: "Bob",
  },
];

export const mockComments: TaskCommentWithAuthor[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440030",
    taskId: "550e8400-e29b-41d4-a716-446655440010",
    authorId: "550e8400-e29b-41d4-a716-446655440001",
    body: "Started working on this.",
    createdAt: new Date("2025-01-02"),
    authorName: "Alice",
    authorEmail: "alice@example.com",
  },
];
