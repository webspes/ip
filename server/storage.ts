import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "name_ideas.log");

export interface NameIdeaLog {
  prompt: string;
  generatedName: string;
  isAvailable: boolean;
  timestamp: string;
}

export function logNameIdea(prompt: string, generatedName: string, isAvailable: boolean): void {
  const entry: NameIdeaLog = {
    prompt,
    generatedName,
    isAvailable,
    timestamp: new Date().toISOString(),
  };
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // silently fail
  }
}
