import { pgTable, text, serial, timestamp, integer, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectStatusEnum = pgEnum("project_status", ["pending", "in_progress", "review", "completed", "cancelled"]);
export const projectPriorityEnum = pgEnum("project_priority", ["low", "medium", "high", "urgent"]);

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: projectStatusEnum("status").notNull().default("pending"),
  priority: projectPriorityEnum("priority").notNull().default("medium"),
  clientId: integer("client_id").notNull(),
  budget: numeric("budget", { precision: 10, scale: 2 }),
  deadline: date("deadline"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projectsTable.$inferSelect;
