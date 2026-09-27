import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the built-in OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const careProfiles = mysqlTable("care_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["caregiver", "supported"]).default("caregiver").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  supportedName: varchar("supported_name", { length: 120 }).notNull().default(""),
  timezone: varchar("timezone", { length: 80 }).notNull().default("UTC"),
  language: varchar("language", { length: 12 }).notNull().default("en"),
  onboardingStep: int("onboarding_step").notNull().default(0),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  speechRate: int("speech_rate").notNull().default(90),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const activities = mysqlTable("care_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 140 }).notNull(),
  notes: text("notes"),
  category: mysqlEnum("category", ["routine", "appointment", "visit", "reminder", "rest", "other"]).notNull().default("routine"),
  dateKey: varchar("date_key", { length: 10 }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  reminderTime: varchar("reminder_time", { length: 5 }),
  status: mysqlEnum("status", ["planned", "completed"]).notNull().default("planned"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userDateIndex: index("care_activities_user_date_idx").on(table.userId, table.dateKey) }));

export const familiarPeople = mysqlTable("familiar_people", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  relationship: varchar("relationship", { length: 80 }).notNull(),
  description: text("description"),
  photoKey: varchar("photo_key", { length: 500 }),
  photoUrl: text("photo_url"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ userIndex: index("familiar_people_user_idx").on(table.userId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CareProfile = typeof careProfiles.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type FamiliarPerson = typeof familiarPeople.$inferSelect;
