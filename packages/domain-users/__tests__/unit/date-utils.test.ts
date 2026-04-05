import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRelativeDate } from "../../src/lib/date-utils";

describe("formatRelativeDate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for dates less than a minute ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T11:59:30Z");
    expect(formatRelativeDate(date)).toBe("just now");
  });

  it("returns minutes ago for dates less than an hour ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T11:45:00Z");
    expect(formatRelativeDate(date)).toBe("15 minutes ago");
  });

  it("returns singular minute for exactly 1 minute ago", () => {
    const now = new Date("2025-06-01T12:01:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 minute ago");
  });

  it("returns hours ago for dates less than a day ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T09:00:00Z");
    expect(formatRelativeDate(date)).toBe("3 hours ago");
  });

  it("returns singular hour for exactly 1 hour ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T11:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 hour ago");
  });

  it("returns days ago for dates less than 30 days ago", () => {
    const now = new Date("2025-06-10T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-07T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("3 days ago");
  });

  it("returns singular day for exactly 1 day ago", () => {
    const now = new Date("2025-06-02T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-06-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 day ago");
  });

  it("returns months ago for dates less than a year ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-03-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("3 months ago");
  });

  it("returns singular month for exactly 1 month ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2025-05-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 month ago");
  });

  it("returns years ago for dates more than a year ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2023-06-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("2 years ago");
  });

  it("returns singular year for exactly 1 year ago", () => {
    const now = new Date("2025-06-01T12:00:00Z");
    vi.setSystemTime(now);
    const date = new Date("2024-06-01T12:00:00Z");
    expect(formatRelativeDate(date)).toBe("1 year ago");
  });
});
