import { describe, expect, it } from "vitest";
import { hasExpectedImageSignature, hasPhotoConsent } from "./photoRules";

describe("private photo validation", () => {
  it("accepts matching JPEG, PNG and WebP signatures", () => {
    expect(hasExpectedImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]), "image/jpeg")).toBe(true);
    expect(hasExpectedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(hasExpectedImageSignature(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "image/webp")).toBe(true);
  });

  it("rejects mismatched, unknown and truncated signatures", () => {
    expect(hasExpectedImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/jpeg")).toBe(false);
    expect(hasExpectedImageSignature(Uint8Array.from([0xff]), "image/jpeg")).toBe(false);
    expect(hasExpectedImageSignature(Uint8Array.from([0, 1, 2, 3]), "image/gif")).toBe(false);
  });

  it("requires explicit consent only when a photo is being stored", () => {
    expect(hasPhotoConsent(null, false)).toBe(true);
    expect(hasPhotoConsent(undefined, false)).toBe(true);
    expect(hasPhotoConsent("data:image/jpeg;base64,...", false)).toBe(false);
    expect(hasPhotoConsent("data:image/jpeg;base64,...", true)).toBe(true);
  });
});
