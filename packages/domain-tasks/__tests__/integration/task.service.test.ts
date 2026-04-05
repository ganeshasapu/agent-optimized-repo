import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("taskService integration", () => {
  it("list() returns an array from the real database", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const result = await taskService.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create() and getById() round-trip", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const created = await taskService.create({
      title: "Integration test task",
      priority: "low",
    });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Integration test task");

    const fetched = await taskService.getById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(created.id);

    // cleanup
    await taskService.delete(created.id);
  });

  it("update() modifies an existing task", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const created = await taskService.create({ title: "Task to update" });

    const updated = await taskService.update(created.id, { status: "done" });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("done");

    // cleanup
    await taskService.delete(created.id);
  });

  it("list() filters by status", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const created = await taskService.create({
      title: "Status filter test",
      status: "in_progress",
    });

    const results = await taskService.list({ status: "in_progress" });
    expect(results.some((t) => t.id === created.id)).toBe(true);

    // cleanup
    await taskService.delete(created.id);
  });

  it("list() filters by priority", async () => {
    const { taskService } = await import("../../src/services/task.service");
    const created = await taskService.create({
      title: "Priority filter test",
      priority: "urgent",
    });

    const results = await taskService.list({ priority: "urgent" });
    expect(results.some((t) => t.id === created.id)).toBe(true);

    // cleanup
    await taskService.delete(created.id);
  });
});
