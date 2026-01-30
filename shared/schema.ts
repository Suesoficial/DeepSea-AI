import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const pipelineJobs = pgTable("pipeline_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0), // 0-100
  currentStage: text("current_stage"),
  uploadedFiles: jsonb("uploaded_files").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  parameters: jsonb("parameters").$type<{
    minSequenceLength: number;
    maxSequenceLength: number;
    clusteringMethod: string;
    qualityFiltering: boolean;
  }>().notNull(),
  results: jsonb("results").$type<{
    abundanceCsvPath?: string;
    taxonomyCsvPath?: string;
    diversityMetrics?: {
      shannonIndex: number;
      simpsonIndex: number;
      speciesRichness: number;
      novelTaxa: number;
    };
    taxonomicDistribution?: Array<{
      kingdom: string;
      phylum: string;
      class: string;
      family: string;
      genus: string;
      species: string;
      abundance: number;
      confidence: number;
    }>;
  }>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  path: text("path").notNull(),
  jobId: varchar("job_id").references(() => pipelineJobs.id),
  uploadedAt: timestamp("uploaded_at").notNull().default(sql`now()`),
});

export const pipelineStages = pgTable("pipeline_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => pipelineJobs.id).notNull(),
  stageName: text("stage_name").notNull(),
  stageNumber: integer("stage_number").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: real("duration"), // seconds
  metadata: jsonb("metadata"),
});

export const insertPipelineJobSchema = createInsertSchema(pipelineJobs).omit({
  id: true,
  createdAt: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertPipelineStageSchema = createInsertSchema(pipelineStages).omit({
  id: true,
});

export type InsertPipelineJob = z.infer<typeof insertPipelineJobSchema>;
export type PipelineJob = typeof pipelineJobs.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineStage = typeof pipelineStages.$inferSelect;
