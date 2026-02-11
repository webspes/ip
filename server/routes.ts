import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import dns from "dns/promises";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Helper to get IP
  const getIp = (req: any) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? (typeof forwarded === 'string' ? forwarded : forwarded[0]) : req.socket.remoteAddress;
    return ip || 'unknown';
  };

  app.get(api.ip.get.path, (req, res) => {
    const ip = getIp(req);
    // Check against .env allowed IP
    const allowedIp = process.env.ALLOWED_IP;
    const isAllowed = !!allowedIp && ip === allowedIp;
    
    res.json({ ip, isAllowed });
  });

  app.post(api.names.generate.path, async (req, res) => {
    try {
      const ip = getIp(req);
      const allowedIp = process.env.ALLOWED_IP;
      
      if (!allowedIp || ip !== allowedIp) {
        return res.status(403).json({ message: "Access denied: IP not allowed" });
      }

      const { topic, count } = api.names.generate.input.parse(req.body);

      // Generate names with OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          {
            role: "system",
            content: "You are a creative naming assistant. Generate a list of unique, catchy, and relevant website domain names based on the user's topic. Return ONLY a JSON array of strings, e.g., [\"example.com\", \"site.net\"]. Do not include markdown formatting."
          },
          {
            role: "user",
            content: `Topic: ${topic}. Generate ${count} names. Prefer .com, .net, .io, .app extensions.`
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{\"names\": []}";
      let names: string[] = [];
      try {
        const parsed = JSON.parse(content);
        // Handle different possible JSON structures OpenAI might return
        if (Array.isArray(parsed)) names = parsed;
        else if (parsed.names && Array.isArray(parsed.names)) names = parsed.names;
        else if (parsed.domains && Array.isArray(parsed.domains)) names = parsed.domains;
        else names = [];
      } catch (e) {
        console.error("Failed to parse OpenAI response", e);
        return res.status(500).json({ message: "Failed to parse generated names" });
      }

      // Check availability (DNS resolution)
      const results = await Promise.all(names.map(async (name) => {
        let available = false;
        try {
          // If DNS resolution succeeds, the domain is likely TAKEN.
          // If it throws ENOTFOUND, it is likely AVAILABLE.
          await dns.resolve(name);
          available = false; 
        } catch (err: any) {
          if (err.code === 'ENOTFOUND') {
            available = true;
          } else {
            // Other errors (timeout, servfail) -> assume taken or unknown, set false to be safe?
            // Or true? Let's assume unavailable if we can't verify.
            available = false; 
          }
        }
        
        // Log to DB (optional, but defined in schema)
        try {
            await storage.logNameIdea({
                prompt: topic,
                generatedName: name,
                isAvailable: available,
            });
        } catch (e) {
            console.error("Failed to log name idea", e);
        }

        return { name, available };
      }));

      res.json({ results });

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
