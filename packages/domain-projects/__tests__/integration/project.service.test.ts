import { describe, it, expect } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("projectService integration", () => {
  it("should connect to database and list projects", async () => {
    const { projectService } = await import("../../src/services/project.service");
    const projects = await projectService.getProjects();
    expect(Array.isArray(projects)).toBe(true);
  });
});
