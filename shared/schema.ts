import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const nameIdeas = pgTable("name_ideas", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  generatedName: text("generated_name").notNull(),
  isAvailable: boolean("is_available").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNameIdeaSchema = createInsertSchema(nameIdeas).omit({ 
  id: true, 
  createdAt: true 
});

export type InsertNameIdea = z.infer<typeof insertNameIdeaSchema>;
export type NameIdea = typeof nameIdeas.$inferSelect;

export const generateNamesRequestSchema = z.object({
  topic: z.string().min(1, "Instructions/Topic is required"),
  count: z.number().min(1).max(100).default(5),
});

export type GenerateNamesRequest = z.infer<typeof generateNamesRequestSchema>;
