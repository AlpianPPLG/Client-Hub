import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serviceTypeEnum = pgEnum("service_type", [
  "logo_design",
  "branding",
  "web_design",
  "print_design",
  "social_media",
  "illustration",
  "other",
]);

export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);

export const requestsTable = pgTable("requests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  timeline: text("timeline"),
  status: requestStatusEnum("status").notNull().default("pending"),
  clientId: integer("client_id").notNull(),
  adminNotes: text("admin_notes"),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRequestSchema = createInsertSchema(requestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRequest = z.infer<typeof insertRequestSchema>;
export type Request = typeof requestsTable.$inferSelect;
