import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  tokens: integer("tokens").notNull().default(0),
  computeProvider: boolean("compute_provider").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Contribution model
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  modelId: integer("model_id").notNull(),
  type: text("type").notNull(), // code, compute, data, hyperparameters
  description: text("description").notNull(),
  code: text("code"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  reward: integer("reward"),
});

export const insertContributionSchema = createInsertSchema(contributions).pick({
  userId: true,
  modelId: true,
  type: true,
  description: true,
  code: true,
});

// AI Model
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  architecture: text("architecture").notNull(),
  code: text("code").notNull(),
  currentAccuracy: text("current_accuracy").notNull(),
  previousAccuracy: text("previous_accuracy"),
  parameters: text("parameters").notNull(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

export const insertModelSchema = createInsertSchema(models).pick({
  name: true,
  description: true,
  architecture: true,
  code: true,
  currentAccuracy: true,
  previousAccuracy: true,
  parameters: true,
});

// Activity records for the feed
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  modelId: integer("model_id").notNull(),
  action: text("action").notNull(), // contributed_code, updated_performance, etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  modelId: true,
  action: true,
  description: true,
  metadata: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Form schemas
export const contributionTypeSchema = z.enum(["code", "compute", "data", "hyperparameters"]);
export type ContributionType = z.infer<typeof contributionTypeSchema>;
