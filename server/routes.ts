import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import dns from "dns/promises";
import os from "os";

// Initialize OpenAI client - supports own API key via OPENAI_API_KEY or Replit AI Integrations
const openaiConfig: { apiKey?: string; baseURL?: string } = {};
if (process.env.OPENAI_API_KEY) {
  openaiConfig.apiKey = process.env.OPENAI_API_KEY;
} else if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  openaiConfig.apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  openaiConfig.baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
}
const openai = new OpenAI(openaiConfig);

function classifyIp(ip: string): string {
  if (ip === '127.0.0.1' || ip === '::1') return 'loopback';
  if (ip.startsWith('10.')) return 'private (10.x)';
  if (ip.startsWith('192.168.')) return 'private (192.168.x)';
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 'private (172.16-31.x)';
  if (ip.startsWith('169.254.')) return 'link-local';
  if (ip.startsWith('fc') || ip.startsWith('fd')) return 'private (IPv6 ULA)';
  if (ip.startsWith('fe80')) return 'link-local (IPv6)';
  if (ip.startsWith('::ffff:')) return classifyIp(ip.slice(7));
  return 'public';
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Startup checks
  if (!process.env.ALLOWED_IP) {
    console.warn('\x1b[33m⚠ WARNING: ALLOWED_IP is not defined in environment variables. The name generator form will not be accessible to anyone.\x1b[0m');
  } else {
    console.log(`✓ ALLOWED_IP is set to: ${process.env.ALLOWED_IP}`);
  }

  if (!openaiConfig.apiKey) {
    console.warn('\x1b[33m⚠ WARNING: No OpenAI API key found. Set OPENAI_API_KEY or use Replit AI Integrations.\x1b[0m');
  } else if (process.env.OPENAI_API_KEY) {
    console.log('✓ Using own OpenAI API key (OPENAI_API_KEY)');
  } else {
    console.log('✓ Using Replit AI Integrations for OpenAI');
  }

  // Helper to get visitor IPs (from x-forwarded-for only, not the socket which is the server's own interface)
  const getVisitorIps = (req: any): string[] => {
    const forwarded = req.headers['x-forwarded-for'];
    const ips: string[] = [];
    if (forwarded) {
      const parts = typeof forwarded === 'string' ? forwarded : forwarded[0];
      parts.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((ip: string) => ips.push(ip));
    }
    if (ips.length === 0) {
      const remote = req.socket.remoteAddress;
      if (remote) ips.push(remote);
    }
    return ips.length > 0 ? ips : ['unknown'];
  };

  app.get(api.ip.get.path, (req, res) => {
    const ips = getVisitorIps(req);
    const allowedIp = process.env.ALLOWED_IP;
    const isAllowed = !!allowedIp && ips.some(ip => ip === allowedIp);
    
    const ipDetails = ips.map(ip => ({
      address: ip,
      type: classifyIp(ip),
    }));

    res.json({ ip: ips.join(', '), isAllowed, ips: ipDetails });
  });

  app.get(api.server.get.path, (_req, res) => {
    const interfaces = os.networkInterfaces();
    const serverIps: { address: string; type: string; interface: string }[] = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.address === '127.0.0.1' || addr.address === '::1') continue;
        if (addr.family === 'IPv6' && addr.address.startsWith('fe80')) continue;
        serverIps.push({
          address: addr.address,
          type: classifyIp(addr.address),
          interface: name,
        });
      }
    }
    res.json({ ips: serverIps });
  });

  app.post(api.names.generate.path, async (req, res) => {
    try {
      const ips = getVisitorIps(req);
      const allowedIp = process.env.ALLOWED_IP;
      
      if (!allowedIp || !ips.some(ip => ip === allowedIp)) {
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
