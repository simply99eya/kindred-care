import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./careHelpers", () => ({
  getCareProfile: vi.fn(),
  requireDb: vi.fn(),
}));

import { getCareProfile, requireDb } from "./careHelpers";
import { profileInput, profileRouter } from "./profileRouter";

const baseProfile = {
  role: "caregiver" as const,
  displayName: "Care partner",
  supportedName: "",
  timezone: "Europe/London",
  onboardingStep: 3,
  onboardingComplete: true,
  speechRate: 90,
  notificationsEnabled: false,
};

describe("profile language preference", () => {
  it("accepts Arabic without changing other profile fields", () => {
    const parsed = profileInput.parse({ ...baseProfile, language: "ar" });
    expect(parsed.language).toBe("ar");
    expect(parsed.displayName).toBe("Care partner");
    expect(parsed.timezone).toBe("Europe/London");
  });

  it("keeps English as the default and rejects unsupported languages", () => {
    expect(profileInput.parse(baseProfile).language).toBe("en");
    expect(profileInput.safeParse({ ...baseProfile, language: "fr" }).success).toBe(false);
  });

  it("updates only the language column through the authenticated preference procedure", async () => {
    const updateSets: Record<string, unknown>[] = [];
    const profile = { userId: 42, language: "ar" };
    const db = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 7 }] }) }) }),
      update: () => ({ set: (values: Record<string, unknown>) => { updateSets.push(values); return { where: async () => undefined }; } }),
    };
    vi.mocked(requireDb).mockResolvedValue(db as never);
    vi.mocked(getCareProfile).mockResolvedValue(profile as never);

    const ctx = {
      user: { id: 42, openId: "test-user", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;
    const result = await profileRouter.createCaller(ctx).setLanguage("ar");

    expect(updateSets).toEqual([{ language: "ar" }]);
    expect(result).toEqual(profile);
    vi.clearAllMocks();
  });
});
