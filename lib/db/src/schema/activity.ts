import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTypeEnum = pgEnum("activity_type", [
  "project_created",
  "project_updated",
  "request_submitted",
  "request_approved",
  "request_rejected",
  "comment_added",
  "file_uploaded",
  "status_changed",
]);

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  type: activityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  projectId: integer("project_id"),
  projectTitle: text("project_title"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
