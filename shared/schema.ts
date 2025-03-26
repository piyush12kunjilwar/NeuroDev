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
  profileImageCid: text("profile_image_cid"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// IPFS storage reference
export const ipfsStorage = pgTable("ipfs_storage", {
  id: serial("id").primaryKey(),
  cid: text("cid").notNull().unique(),
  contentType: text("content_type").notNull(), // model, data, code, weights
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pinned: boolean("pinned").notNull().default(false),
  userId: integer("user_id"),
});

export const insertIpfsStorageSchema = createInsertSchema(ipfsStorage).pick({
  cid: true,
  contentType: true,
  fileName: true,
  fileSize: true,
  description: true,
  userId: true,
});

// Contribution model
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  modelId: integer("model_id").notNull(),
  type: text("type").notNull(), // code, compute, data, hyperparameters
  description: text("description").notNull(),
  code: text("code"),
  dataCid: text("data_cid"), // IPFS CID for contributed data
  codeCid: text("code_cid"), // IPFS CID for contributed code
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
  dataCid: true,
  codeCid: true,
});

// AI Model
export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  architecture: text("architecture").notNull(),
  code: text("code").notNull(),
  codeCid: text("code_cid"), // IPFS CID for model code
  weightsCid: text("weights_cid"), // IPFS CID for model weights
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
  codeCid: true,
  weightsCid: true,
  currentAccuracy: true,
  previousAccuracy: true,
  parameters: true,
});

// Dataset storage
export const datasets = pgTable("datasets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  dataCid: text("data_cid").notNull(), // IPFS CID for the dataset
  sizeBytes: integer("size_bytes"),
  format: text("format").notNull(), // csv, json, images, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull(),
});

export const insertDatasetSchema = createInsertSchema(datasets).pick({
  name: true,
  description: true,
  dataCid: true,
  sizeBytes: true,
  format: true,
  userId: true,
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
  relatedCid: text("related_cid"), // Optional reference to IPFS content
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  modelId: true,
  action: true,
  description: true,
  metadata: true,
  relatedCid: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type IpfsStorage = typeof ipfsStorage.$inferSelect;
export type InsertIpfsStorage = z.infer<typeof insertIpfsStorageSchema>;

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = z.infer<typeof insertContributionSchema>;

export type Model = typeof models.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = z.infer<typeof insertDatasetSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Form schemas
export const contributionTypeSchema = z.enum(["code", "compute", "data", "hyperparameters"]);
export type ContributionType = z.infer<typeof contributionTypeSchema>;

export const ipfsContentTypeSchema = z.enum(["model", "data", "code", "weights", "image", "document"]);
export type IpfsContentType = z.infer<typeof ipfsContentTypeSchema>;
