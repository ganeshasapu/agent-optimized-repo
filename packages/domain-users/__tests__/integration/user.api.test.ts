import { describe, it, expect } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("userService integration", () => {
  it("should connect to database", async () => {
    const { getDb } = await import("@biarritz/db");
    const db = getDb();
    expect(db).toBeDefined();
  });
});
