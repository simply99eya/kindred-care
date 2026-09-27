import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { activities } from "../drizzle/schema";
import { answerFromSavedSchedule } from "./assistantLogic";
import { getCareProfile, requireDb } from "./careHelpers";
import { isValidDateKey } from "./careRules";
import { protectedProcedure, router } from "./_core/trpc";

export const assistantRouter = router({
  ask: protectedProcedure.input(z.object({ message: z.string().trim().min(1).max(1000), dateKey: z.string().refine(isValidDateKey) })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const items = await db.select({ title: activities.title, startTime: activities.startTime, status: activities.status })
      .from(activities).where(and(eq(activities.userId, ctx.user.id), eq(activities.dateKey, input.dateKey)))
      .orderBy(asc(activities.startTime));
    const profile = await getCareProfile(ctx.user.id);
    const localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: profile?.timezone ?? "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    return { text: answerFromSavedSchedule(input.message, input.dateKey, items, localTime), mode: "demo" as const };
  }),
});
