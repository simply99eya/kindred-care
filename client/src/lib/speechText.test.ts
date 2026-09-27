import { describe, expect, it } from "vitest";
import { appendTranscription } from "./speechText";

describe("appendTranscription", () => {
  it("uses spoken words when the field is empty", () => {
    expect(appendTranscription("", "  Call my daughter. ")).toBe("Call my daughter.");
  });

  it("appends speech without replacing typed text", () => {
    expect(appendTranscription("Visit at noon", "bring a book")).toBe("Visit at noon bring a book");
  });

  it("does not add a duplicate separator", () => {
    expect(appendTranscription("A note ", "more detail")).toBe("A note more detail");
  });

  it("leaves the field unchanged for an empty transcript", () => {
    expect(appendTranscription("Keep my text", "  ")).toBe("Keep my text");
  });
});
