import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import os from "os";
import { clientIp, classifyIp, ipVersion, wantsPlainText } from "./visitor";
import { lookup, reverseDns, startGeo } from "./geo";

let outbound: { ip: string | null; at: number } = { ip: null, at: 0 };

async function outboundIp(): Promise<string | null> {
  if (outbound.ip && Date.now() - outbound.at < 10 * 60_000) return outbound.ip;
  try {
    const response = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    if (response.ok) outbound = { ip: ((await response.json()) as { ip: string }).ip, at: Date.now() };
  } catch {
    // keep the last known value
  }
  return outbound.ip;
}

async function details(req: Request) {
  const ip = clientIp(req);
  const geo = lookup(ip);
  return {
    ip,
    version: ipVersion(ip),
    type: classifyIp(ip),
    hostname: await reverseDns(ip),
    ...geo,
    userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
  };
}

const text = (res: Response, body: string, status = 200) => {
  res.status(status).type("text/plain; charset=utf-8").setHeader("Cache-Control", "no-store");
  res.send(body + "\n");
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  if (!process.env.ALLOWED_IP) {
    console.warn('\x1b[33m⚠ WARNING: ALLOWED_IP is not defined in environment variables. No visitor will be shown as authorized.\x1b[0m');
  }
  startGeo();

  // curl / wget / HTTPie on "/" get the bare address; browsers fall through to the page.
  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    if (!wantsPlainText(req)) return next();
    text(res, clientIp(req));
  });

  app.get("/ip", (req, res) => text(res, clientIp(req)));

  app.get("/ipv4", (req, res) => {
    const ip = clientIp(req);
    if (ipVersion(ip) === 4) text(res, ip);
    else text(res, "Ingen IPv4-adresse i denne forbindelsen.", 404);
  });

  // The server is only reachable over IPv4, so an IPv6 address can't be seen from here.
  app.get("/ipv6", (req, res) => {
    const ip = clientIp(req);
    if (ipVersion(ip) === 6) text(res, ip);
    else text(res, "Denne tjenesten er bare tilgjengelig over IPv4, så IPv6-adressen din kan ikke vises her.", 404);
  });

  app.get("/json", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(await details(req));
  });

  app.get(api.config.get.path, (_req, res) => {
    res.json({
      favicon: process.env.APPHOST_FAV || null,
      logo: process.env.APPHOST_LOGO || null,
    });
  });

  app.get(api.ip.get.path, async (req, res) => {
    const d = await details(req);
    const allowedIp = process.env.ALLOWED_IP;
    res.setHeader("Cache-Control", "no-store");
    res.json({
      ip: d.ip,
      isAllowed: !!allowedIp && d.ip === allowedIp,
      ips: [{ address: d.ip, type: d.type }],
      version: d.version,
      hostname: d.hostname,
      country: d.country,
      countryCode: d.countryCode,
      asn: d.asn,
      org: d.org,
      userAgent: d.userAgent,
    });
  });

  app.get(api.server.get.path, async (_req, res) => {
    const interfaces = os.networkInterfaces();
    const serverIps: { address: string; type: string; interface: string }[] = [];
    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue;
      for (const addr of addrs) {
        if (addr.address === '127.0.0.1' || addr.address === '::1') continue;
        if (addr.family === 'IPv6' && addr.address.startsWith('fe80')) continue;
        serverIps.push({ address: addr.address, type: classifyIp(addr.address), interface: name });
      }
    }
    res.json({ outboundIp: await outboundIp(), ips: serverIps });
  });

  return httpServer;
}
