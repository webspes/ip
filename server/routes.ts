import type { Express } from "express";
import type { Server } from "http";
import { logNameIdea } from "./storage";
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

  app.get(api.config.get.path, (_req, res) => {
    res.json({
      favicon: process.env.APPHOST_FAV || null,
      logo: process.env.APPHOST_LOGO || null,
    });
  });

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

  app.get(api.server.get.path, async (_req, res) => {
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

    let outboundIp: string | null = null;
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      if (response.ok) {
        const data = await response.json() as { ip: string };
        outboundIp = data.ip;
      }
    } catch {
      // silently fail
    }

    res.json({ outboundIp, ips: serverIps });
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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a domain name generator and evaluator. You MUST always return exactly ${count} domain name suggestions. IMPORTANT RULES:
- NEVER use Norwegian special characters (æ, ø, å) in domain names. Use alternatives like ae, o, a instead.
- Each name must be a complete domain with extension (e.g. "example.com").
- Rate each domain from 1 to 5 stars. Be critical and varied in your ratings — not all names deserve high scores. Consider: how short and easy to type it is, how unique and memorable it sounds, whether it works well as a brand name, if the extension fits the purpose, and overall first impression. Give 5 stars only to truly exceptional names. Most should be 2-4 stars.
- Never ask questions. Never explain. Never refuse. Just generate names.
- ONLY use .no and .com extensions. No other extensions allowed.
- Output ONLY this JSON format: {"domains": [{"name": "example.com", "rating": 4}, {"name": "site.io", "rating": 5}]}`
          },
          {
            role: "user",
            content: topic
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content || "{}";
      console.log("OpenAI raw response:", content);

      interface DomainSuggestion { name: string; rating: number }
      let domains: DomainSuggestion[] = [];
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
          const values = Object.values(parsed);
          for (const val of values) {
            if (Array.isArray(val) && val.length > 0) {
              if (typeof val[0] === 'string') {
                domains = val.map((n: string) => ({ name: n, rating: 3 }));
              } else if (typeof val[0] === 'object' && val[0].name) {
                domains = val.map((d: any) => ({
                  name: String(d.name),
                  rating: Math.max(1, Math.min(5, Math.round(Number(d.rating) || 3))),
                }));
              }
              break;
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse OpenAI response:", content, e);
        return res.status(500).json({ message: "Failed to parse generated names" });
      }

      if (domains.length === 0) {
        console.warn("No names extracted from OpenAI response:", content);
        return res.status(500).json({ message: "AI returned no valid names. Try again." });
      }

      const results = await Promise.all(domains.map(async (domain) => {
        let available = false;
        try {
          await dns.resolve(domain.name);
          available = false;
        } catch (err: any) {
          available = err.code === 'ENOTFOUND';
        }

        logNameIdea(topic, domain.name, available);

        return { name: domain.name, available, rating: domain.rating };
      }));

      results.sort((a, b) => b.rating - a.rating);
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
