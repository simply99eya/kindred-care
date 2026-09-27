import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { familiarPeople } from "../drizzle/schema";
import { requireCaregiver, requireDb, uploadProfilePhoto } from "./careHelpers";
import { storageGetSignedUrl } from "./storage";
import { hasPhotoConsent } from "./photoRules";
import { protectedProcedure, router } from "./_core/trpc";

const personFields = {
  name: z.string().trim().min(1).max(120),
  relationship: z.string().trim().min(1).max(80),
  description: z.string().max(1000).default(""),
};
const photoSchema = z.string().max(7_000_000).nullable().optional();

export const peopleRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const rows = await db.select({
      id: familiarPeople.id,
      name: familiarPeople.name,
      relationship: familiarPeople.relationship,
      description: familiarPeople.description,
      isDemo: familiarPeople.isDemo,
      hasPhoto: familiarPeople.photoKey,
    }).from(familiarPeople).where(eq(familiarPeople.userId, ctx.user.id)).orderBy(asc(familiarPeople.name));
    return rows.map(({ hasPhoto, ...person }) => ({ ...person, hasPhoto: Boolean(hasPhoto) }));
  }),

  photoUrl: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [person] = await db.select({ photoKey: familiarPeople.photoKey }).from(familiarPeople)
      .where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.id, input.id))).limit(1);
    if (!person) throw new TRPCError({ code: "NOT_FOUND", message: "That person could not be found." });
    if (!person.photoKey) return { url: null };
    try {
      return { url: await storageGetSignedUrl(person.photoKey) };
    } catch (error) {
      console.error("[Care] Photo signing failed", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "This photo is temporarily unavailable." });
    }
  }),

  create: protectedProcedure.input(z.object({ ...personFields, photoDataUrl: photoSchema, photoConsent: z.boolean().default(false) }).refine(
    (value) => hasPhotoConsent(value.photoDataUrl, value.photoConsent),
    { path: ["photoConsent"], message: "Please confirm you have permission to store this photo." },
  )).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    const db = await requireDb();
    const uploaded = input.photoDataUrl ? await uploadProfilePhoto(ctx.user.id, input.photoDataUrl) : null;
    await db.insert(familiarPeople).values({
      userId: ctx.user.id,
      name: input.name,
      relationship: input.relationship,
      description: input.description,
      photoKey: uploaded?.key ?? null,
      photoUrl: null,
      isDemo: false,
    });
    return { success: true };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    ...personFields,
    photoDataUrl: photoSchema,
    photoConsent: z.boolean().default(false),
    removePhoto: z.boolean().default(false),
  }).refine(
    (value) => hasPhotoConsent(value.photoDataUrl, value.photoConsent),
    { path: ["photoConsent"], message: "Please confirm you have permission to store this photo." },
  )).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    const db = await requireDb();
    const [existing] = await db.select({ id: familiarPeople.id, photoKey: familiarPeople.photoKey }).from(familiarPeople)
      .where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.id, input.id))).limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "That person could not be found." });
    const uploaded = input.photoDataUrl ? await uploadProfilePhoto(ctx.user.id, input.photoDataUrl) : null;
    const photoKey = uploaded?.key ?? (input.removePhoto ? null : existing.photoKey);
    await db.update(familiarPeople).set({
      name: input.name,
      relationship: input.relationship,
      description: input.description,
      photoKey,
      photoUrl: null,
      isDemo: false,
    }).where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.id, input.id)));
    return { success: true };
  }),

  remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireCaregiver(ctx.user.id);
    const db = await requireDb();
    await db.delete(familiarPeople).where(and(eq(familiarPeople.userId, ctx.user.id), eq(familiarPeople.id, input.id)));
    return { success: true };
  }),
});
