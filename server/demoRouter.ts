import { and, eq } from "drizzle-orm";
import { familiarPeople, activities } from "../drizzle/schema";
import { getCareProfile, requireDb } from "./careHelpers";
import { shiftDateKey, todayInTimezone } from "./careRules";
import { protectedProcedure, router } from "./_core/trpc";

export const demoRouter = router({
  loadSamples: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const profile = await getCareProfile(ctx.user.id);
    const timezone = profile?.timezone ?? "UTC";
    const today = todayInTimezone(timezone);
    const yesterday = shiftDateKey(today, -1);
    const tomorrow = shiftDateKey(today, 1);
    const alreadyLoaded = await db.select({ id: activities.id }).from(activities)
      .where(and(eq(activities.userId, ctx.user.id), eq(activities.isDemo, true))).limit(1);
    if (alreadyLoaded.length > 0) return { success: true, alreadyLoaded: true };

    await db.insert(activities).values([
      { userId: ctx.user.id, title: "A walk in the garden", notes: "Sample history — view only", category: "routine", dateKey: yesterday, startTime: "10:30", reminderTime: null, status: "completed", isDemo: true },
      { userId: ctx.user.id, title: "Breakfast together", notes: "A gentle start to the day", category: "routine", dateKey: today, startTime: "09:00", reminderTime: "08:45", status: "planned", isDemo: true },
      { userId: ctx.user.id, title: "Time outside", notes: "Take a short stroll if it feels right", category: "rest", dateKey: today, startTime: "15:00", reminderTime: "14:50", status: "planned", isDemo: true },
      { userId: ctx.user.id, title: "Family call", notes: "Sample future activity", category: "visit", dateKey: tomorrow, startTime: "11:00", reminderTime: "10:45", status: "planned", isDemo: true },
    ]);
    const existingPeople = await db.select({ id: familiarPeople.id }).from(familiarPeople)
      .where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.isDemo, true))).limit(1);
    if (existingPeople.length === 0) {
      await db.insert(familiarPeople).values({
        userId: ctx.user.id,
        name: "Maya",
        relationship: "Granddaughter",
        description: "A fictional demo profile. She enjoys hearing stories about the garden.",
        photoKey: null,
        photoUrl: null,
        isDemo: true,
      });
    }
    return { success: true, alreadyLoaded: false };
  }),

  resetSamples: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    await db.delete(activities).where(and(eq(activities.userId, ctx.user.id), eq(activities.isDemo, true)));
    await db.delete(familiarPeople).where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.isDemo, true)));
    return { success: true };
  }),
});
