// Proves the 24h / 30d dedup windows match A's logic (F1).
import { describe, it, expect } from "vitest";
import { dedupDecision } from "../T/dedup";

const now = new Date("2026-06-13T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000);

describe("dedupDecision", () => {
  it("no prior lead = new", () => {
    expect(dedupDecision(null, now)).toBe("new");
  });

  it("submitted 2h ago, not completed = already_enrolled", () => {
    expect(
      dedupDecision({ createdAt: hoursAgo(2), status: "email_sent", hasActiveEnrollment: false }, now)
    ).toBe("already_enrolled");
  });

  it("submitted 2h ago but completed = new (re-enquiry allowed)", () => {
    expect(
      dedupDecision({ createdAt: hoursAgo(2), status: "completed", hasActiveEnrollment: false }, now)
    ).toBe("new");
  });

  it("submitted 5 days ago with active enrollment = already_submitted", () => {
    expect(
      dedupDecision({ createdAt: hoursAgo(120), status: "email_sent", hasActiveEnrollment: true }, now)
    ).toBe("already_submitted");
  });

  it("submitted 5 days ago, no active enrollment = new", () => {
    expect(
      dedupDecision({ createdAt: hoursAgo(120), status: "email_sent", hasActiveEnrollment: false }, now)
    ).toBe("new");
  });

  it("submitted 40 days ago = new (outside window)", () => {
    expect(
      dedupDecision({ createdAt: hoursAgo(24 * 40), status: "email_sent", hasActiveEnrollment: true }, now)
    ).toBe("new");
  });
});
