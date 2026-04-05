import { describe, expect, it } from "vitest";

import { taskService } from "../../src/services/task.service";

describe.skipIf(!process.env["DATABASE_URL"])("taskService integration", () => {
  it("should list tasks", async () => {
    const tasks = await taskService.list();
    expect(Array.isArray(tasks)).toBe(true);
  });
});
