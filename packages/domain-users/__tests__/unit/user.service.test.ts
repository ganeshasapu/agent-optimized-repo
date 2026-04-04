import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@biarritz/db", () => ({
  getDb: vi.fn(),
  users: { id: "id", email: "email", name: "name" },
}));

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be importable", async () => {
    const { userService } = await import("../../src/services/user.service");
    expect(userService).toBeDefined();
    expect(userService.list).toBeInstanceOf(Function);
    expect(userService.getById).toBeInstanceOf(Function);
    expect(userService.create).toBeInstanceOf(Function);
  });
});
