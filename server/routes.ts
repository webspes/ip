import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import os from "os";

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
    console.warn('\x1b[33m⚠ WARNING: ALLOWED_IP is not defined in environment variables. No visitor will be shown as authorized.\x1b[0m');
  } else {
    console.log(`✓ ALLOWED_IP is set to: ${process.env.ALLOWED_IP}`);
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

  return httpServer;
}
