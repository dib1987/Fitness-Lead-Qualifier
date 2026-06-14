// Proves the ported scoring matches A's _score_lead behavior (F6).
import { describe, it, expect } from "vitest";
import { scoreLead } from "../T/scoring";

describe("scoreLead", () => {
  it("premium goal + phone + known location + full name = 100 (capped)", () => {
    expect(
      scoreLead({
        fitness_goal: "weight loss",
        phone_number: "555-1234",
        preferred_gym_location: "Tampa",
        full_name: "Ada Lovelace",
      })
    ).toBe(100); // 35 + 20 + 25 + 20 = 100
  });

  it("standard goal only = 20", () => {
    expect(scoreLead({ fitness_goal: "general fitness" })).toBe(20);
  });

  it("unknown goal = 10", () => {
    expect(scoreLead({ fitness_goal: "underwater basket weaving" })).toBe(10);
  });

  it("unknown location but present = 10", () => {
    expect(scoreLead({ preferred_gym_location: "Seattle" })).toBe(10);
  });

  it("single-word name does not earn the name points", () => {
    expect(scoreLead({ full_name: "Ada" })).toBe(0);
  });

  it("empty form = 0", () => {
    expect(scoreLead({})).toBe(0);
  });
});
