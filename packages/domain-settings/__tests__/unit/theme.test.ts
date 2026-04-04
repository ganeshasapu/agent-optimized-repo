import { describe, it, expect } from "vitest";

describe("theme utilities", () => {
  it("should be importable", async () => {
    const mod = await import("../../src/lib/theme");
    expect(mod.getStoredTheme).toBeInstanceOf(Function);
    expect(mod.setStoredTheme).toBeInstanceOf(Function);
    expect(mod.applyTheme).toBeInstanceOf(Function);
    expect(mod.getActiveTheme).toBeInstanceOf(Function);
  });

  it("getStoredTheme returns null in non-browser environment", async () => {
    const { getStoredTheme } = await import("../../src/lib/theme");
    // In node environment, window is undefined, so returns null
    expect(getStoredTheme()).toBeNull();
  });

  it("setStoredTheme is a no-op in non-browser environment", async () => {
    const { setStoredTheme } = await import("../../src/lib/theme");
    // Should not throw in node environment
    expect(() => setStoredTheme("dark")).not.toThrow();
    expect(() => setStoredTheme("light")).not.toThrow();
  });

  it("applyTheme is a no-op in non-browser environment", async () => {
    const { applyTheme } = await import("../../src/lib/theme");
    // Should not throw in node environment
    expect(() => applyTheme("dark")).not.toThrow();
    expect(() => applyTheme("light")).not.toThrow();
  });

  it("getActiveTheme returns light in non-browser environment", async () => {
    const { getActiveTheme } = await import("../../src/lib/theme");
    expect(getActiveTheme()).toBe("light");
  });

  it("THEME_STORAGE_KEY is the expected string", async () => {
    const { THEME_STORAGE_KEY } = await import("../../src/lib/theme");
    expect(THEME_STORAGE_KEY).toBe("biarritz-theme");
  });
});
