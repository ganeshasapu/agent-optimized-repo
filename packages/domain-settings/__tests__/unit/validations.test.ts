import { describe, it, expect } from "vitest";

import { profileSchema, appearanceSchema } from "../../src/lib/validations";

describe("profileSchema", () => {
  it("validates a valid profile", () => {
    const result = profileSchema.safeParse({ name: "Jane Doe", email: "jane@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = profileSchema.safeParse({ name: "", email: "jane@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name is required");
    }
  });

  it("rejects invalid email", () => {
    const result = profileSchema.safeParse({ name: "Jane", email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid email address");
    }
  });

  it("rejects name exceeding max length", () => {
    const result = profileSchema.safeParse({ name: "a".repeat(101), email: "jane@example.com" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Name is too long");
    }
  });
});

describe("appearanceSchema", () => {
  it("accepts valid theme values", () => {
    for (const theme of ["light", "dark", "system"] as const) {
      const result = appearanceSchema.safeParse({ theme });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid theme", () => {
    const result = appearanceSchema.safeParse({ theme: "blue" });
    expect(result.success).toBe(false);
  });
});
