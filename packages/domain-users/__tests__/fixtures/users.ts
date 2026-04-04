import type { User } from "../../src/types/index";

export const mockUsers: User[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "alice@example.com",
    name: "Alice",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "bob@example.com",
    name: "Bob",
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
];
