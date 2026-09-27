import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { careProfiles } from "../drizzle/schema";
import { getCareProfile, requireDb } from "./careHelpers";
import { protectedProcedure, router } from "./_core/trpc";

const profileInput = z.object({
  role: z.enum(["caregiver", "supported"]),
  displayName: z.string().trim().min(1).max(120),
  supportedName: z.string().trim().max(120).default(""),
  timezone: z.string().min(1).max(80),
  language: z.enum(["en"]).default("en"),
  onboardingStep: z.number().int().min(0).max(3),
  onboardingComplete: z.boolean(),
  speechRate: z.number().int().min(70).max(120),
  notificationsEnabled: z.boolean(),
});

export const profileRouter = router({
  get: protectedProcedure.query(({ ctx }) => getCareProfile(ctx.user.id)),
  save: protectedProcedure.input(profileInput).mutation(async ({ ctx, input }) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: input.timezone });
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid time zone." });
    }
    const db = await requireDb();
    const [existing] = await db.select({ id: careProfiles.id }).from(careProfiles).where(eq(careProfiles.userId, ctx.user.id)).limit(1);
    if (existing) {
      await db.update(careProfiles).set(input).where(eq(careProfiles.userId, ctx.user.id));
    } else {
      await db.insert(careProfiles).values({ userId: ctx.user.id, ...input });
    }
    return getCareProfile(ctx.user.id);
  }),
});
