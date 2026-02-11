import { db } from "./db";
import { nameIdeas, type InsertNameIdea, type NameIdea } from "@shared/schema";

export interface IStorage {
  logNameIdea(idea: InsertNameIdea): Promise<NameIdea | null>;
}

export class DatabaseStorage implements IStorage {
  async logNameIdea(idea: InsertNameIdea): Promise<NameIdea | null> {
    if (!db) return null;
    const [log] = await db.insert(nameIdeas).values(idea).returning();
    return log;
  }
}

export const storage = new DatabaseStorage();
