import type { Request } from "express";
import net from "net";

// Visitor address behind Traefik: Traefik replaces X-Real-Ip / X-Forwarded-For with what it saw (client-sent
// values are dropped), so X-Real-Ip is the address to trust; the socket is the proxy hop.

export function clientIp(req: Request): string {
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && net.isIP(real.trim())) return real.trim();
  const xff = req.headers["x-forwarded-for"];
  const first = (Array.isArray(xff) ? xff[0] : xff || "").split(",")[0]?.trim();
  if (first && net.isIP(first)) return first;
  return (req.socket.remoteAddress || "unknown").replace(/^::ffff:/, "");
}

export function ipVersion(ip: string): 4 | 6 | null {
  const v = net.isIP(ip.replace(/^::ffff:/, ""));
  return v === 4 || v === 6 ? v : null;
}

export function classifyIp(ip: string): string {
  if (ip === "127.0.0.1" || ip === "::1") return "loopback";
  if (ip.startsWith("10.")) return "private (10.x)";
  if (ip.startsWith("192.168.")) return "private (192.168.x)";
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return "private (172.16-31.x)";
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return "CGNAT (100.64/10)";
  if (ip.startsWith("169.254.")) return "link-local";
  if (/^f[cd]/i.test(ip)) return "private (IPv6 ULA)";
  if (/^fe80/i.test(ip)) return "link-local (IPv6)";
  if (ip.startsWith("::ffff:")) return classifyIp(ip.slice(7));
  return "public";
}

/** Command-line clients (and anyone asking for text/plain) get the bare IP on "/". */
export function wantsPlainText(req: Request): boolean {
  const ua = String(req.headers["user-agent"] || "");
  if (/^(curl|wget|httpie|xh|aria2|lwp|libwww-perl|powershell|python-requests|python-urllib|go-http-client|fetch)\b/i.test(ua) || /WindowsPowerShell/i.test(ua)) return true;
  const accept = String(req.headers.accept || "");
  return /^text\/plain\b/i.test(accept);
}
