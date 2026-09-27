import { TRPCError } from "@trpc/server";
import { and, asc, between, eq } from "drizzle-orm";
import { z } from "zod";
import { activities } from "../drizzle/schema";
import { requireCaregiver, requireDb, requireEditableDate } from "./careHelpers";
import { isValidDateKey } from "./careRules";
import { protectedProcedure, router } from "./_core/trpc";

const dateKeySchema = z.string().refine(isValidDateKey, "Choose a valid calendar date.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time.");
const activityFields = {
  title: z.string().trim().min(1).max(140),
  notes: z.string().max(2000).default(""),
  category: z.enum(["routine", "appointment", "visit", "reminder", "rest", "other"]),
  dateKey: dateKeySchema,
  startTime: timeSchema,
  reminderTime: timeSchema.nullable(),
};

async function findOwnedActivity(userId: number, id: number) {
  const db = await requireDb();
  const [activity] = await db.select().from(activities).where(and(eq(activities.userId, userId), eq(activities.id, id))).limit(1);
  if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "That activity could not be found." });
  return activity;
}

export const activityRouter = router({
  list: protectedProcedure.input(z.object({ from: dateKeySchema, to: dateKeySchema })).query(async ({ ctx, input }) => {
    if (input.from > input.to) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid date range." });
    const db = await requireDb();
    return db.select().from(activities)
      .where(and(eq(activities.userId, ctx.user.id), between(activities.dateKey, input.from, input.to)))
      .orderBy(asc(activities.dateKey), asc(activities.startTime));
  }),

  create: protectedProcedure.input(z.object(activityFields)).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    await requireEditableDate(input.dateKey, ctx.user.id);
    const db = await requireDb();
    await db.insert(activities).values({ userId: ctx.user.id, ...input, status: "planned", isDemo: false });
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({ id: z.number().int().positive(), ...activityFields })).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    const current = await findOwnedActivity(ctx.user.id, input.id);
    await requireEditableDate(current.dateKey, ctx.user.id);
    await requireEditableDate(input.dateKey, ctx.user.id);
    const db = await requireDb();
    const { id, ...changes } = input;
    await db.update(activities).set({ ...changes, isDemo: false }).where(and(eq(activities.userId, ctx.user.id), eq(activities.id, id)));
    return { success: true };
  }),

  setCompleted: protectedProcedure.input(z.object({ id: z.number().int().positive(), completed: z.boolean() })).mutation(async ({ ctx, input }) => {
    const current = await findOwnedActivity(ctx.user.id, input.id);
    await requireEditableDate(current.dateKey, ctx.user.id);
    const db = await requireDb();
    await db.update(activities).set({ status: input.completed ? "completed" : "planned", isDemo: false })
      .where(and(eq(activities.userId, ctx.user.id), eq(activities.id, input.id)));
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    const current = await findOwnedActivity(ctx.user.id, input.id);
    await requireEditableDate(current.dateKey, ctx.user.id);
    const db = await requireDb();
    await db.delete(activities).where(and(eq(activities.userId, ctx.user.id), eq(activities.id, input.id)));
    return { success: true };
  }),
});
