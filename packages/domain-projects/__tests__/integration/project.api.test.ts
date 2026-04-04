import { describe, it, expect } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("projectService integration", () => {
  it("should connect to database", async () => {
    const { getDb } = await import("@biarritz/db");
    const db = getDb();
    expect(db).toBeDefined();
  });

  it("should list projects from the database", async () => {
    const { projectService } = await import(
      "../../src/services/project.service"
    );
    const projects = await projectService.list();
    expect(Array.isArray(projects)).toBe(true);
  });
});
