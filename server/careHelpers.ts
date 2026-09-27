import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { careProfiles } from "../drizzle/schema";
import { getDb } from "./db";
import { canEditDate, isValidDateKey, PAST_DAY_MESSAGE } from "./careRules";
import { storagePut } from "./storage";
import { hasExpectedImageSignature } from "./photoRules";

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your secure care space is unavailable. Please try again." });
  return db;
}

export async function getCareProfile(userId: number) {
  const db = await requireDb();
  const [profile] = await db.select().from(careProfiles).where(eq(careProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function requireCaregiver(userId: number) {
  const profile = await getCareProfile(userId);
  if (profile?.role === "supported") {
    throw new TRPCError({ code: "FORBIDDEN", message: "A caregiver manages these details. You can still view your day and familiar people." });
  }
  return profile;
}

export async function requireEditableDate(dateKey: string, userId: number) {
  if (!isValidDateKey(dateKey)) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid calendar date." });
  const profile = await getCareProfile(userId);
  const timezone = profile?.timezone ?? "UTC";
  if (!canEditDate(dateKey, timezone)) throw new TRPCError({ code: "FORBIDDEN", message: PAST_DAY_MESSAGE });
  return timezone;
}

export async function uploadProfilePhoto(userId: number, dataUrl: string) {
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a JPEG, PNG, or WebP image." });
  const mime = match[1] === "jpg" ? "image/jpeg" : `image/${match[1]}`;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 1 || bytes.length > 5 * 1024 * 1024) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please choose a photo smaller than 5 MB." });
  }
  if (!hasExpectedImageSignature(bytes, mime)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The photo data does not match its image type." });
  }
  const extension = mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);
  try {
    return await storagePut(`${userId}/familiar/${crypto.randomUUID()}.${extension}`, bytes, mime);
  } catch (error) {
    console.error("[Care] Photo upload failed", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Your photo could not be saved. Please try again." });
  }
}
