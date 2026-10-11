import fs from "fs";
import path from "path";
import zlib from "zlib";
import dns from "dns/promises";
import { Reader } from "mmdb-lib";

// Country and ASN lookups from the free DB-IP Lite databases (CC BY 4.0, https://db-ip.com), read locally so
// no third party sees our visitors' addresses. The files are downloaded to DATA_DIR/geo on first start and
// refreshed when a new month's release is out. Lookups return null until the files are in place.

const DIR = path.join(process.env.DATA_DIR || (fs.existsSync("/data") ? "/data" : path.resolve("data")), "geo");
const FILES = { country: "dbip-country-lite.mmdb", asn: "dbip-asn-lite.mmdb" } as const;
type Kind = keyof typeof FILES;

const readers: Partial<Record<Kind, Reader<any>>> = {};

function load(kind: Kind) {
  const file = path.join(DIR, FILES[kind]);
  if (fs.existsSync(file)) {
    try {
      readers[kind] = new Reader(fs.readFileSync(file));
    } catch (err) {
      console.error(`[geo] could not read ${file}:`, (err as Error).message);
    }
  }
}

async function download(kind: Kind, month: string): Promise<boolean> {
  const url = `https://download.db-ip.com/free/dbip-${kind}-lite-${month}.mmdb.gz`;
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) return false;
  const buf = zlib.gunzipSync(Buffer.from(await res.arrayBuffer()));
  new Reader(buf); // validate before replacing the current file
  fs.mkdirSync(DIR, { recursive: true });
  const tmp = path.join(DIR, `${FILES[kind]}.tmp`);
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, path.join(DIR, FILES[kind]));
  return true;
}

/** Downloads missing/outdated databases (this month's release, else last month's). Never throws. */
export async function refreshGeo(): Promise<void> {
  const now = new Date();
  const months = [0, 1].map((back) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    return d.toISOString().slice(0, 7);
  });
  for (const kind of Object.keys(FILES) as Kind[]) {
    const file = path.join(DIR, FILES[kind]);
    const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 32 * 86400_000;
    if (fresh && readers[kind]) continue;
    try {
      for (const m of months) {
        if (await download(kind, m)) {
          console.log(`[geo] ${kind} database ${m} installed`);
          break;
        }
      }
    } catch (err) {
      console.error(`[geo] ${kind} download failed:`, (err as Error).message);
    }
    load(kind);
  }
}

export function startGeo(): void {
  load("country");
  load("asn");
  void refreshGeo();
  setInterval(() => void refreshGeo(), 24 * 3600_000).unref();
}

export interface GeoInfo {
  country: string | null;
  countryCode: string | null;
  asn: number | null;
  org: string | null;
}

export function lookup(ip: string): GeoInfo {
  const out: GeoInfo = { country: null, countryCode: null, asn: null, org: null };
  try {
    const c = readers.country?.get(ip);
    if (c?.country) {
      out.countryCode = c.country.iso_code ?? null;
      out.country = c.country.names?.en ?? null;
    }
    const a = readers.asn?.get(ip);
    if (a) {
      out.asn = a.autonomous_system_number ?? null;
      out.org = a.autonomous_system_organization ?? null;
    }
  } catch {
    // invalid / private address
  }
  return out;
}

const rdnsCache = new Map<string, { host: string | null; at: number }>();

/** Reverse DNS with a short timeout and a 10-minute cache. */
export async function reverseDns(ip: string): Promise<string | null> {
  const hit = rdnsCache.get(ip);
  if (hit && Date.now() - hit.at < 600_000) return hit.host;
  const host = await Promise.race([
    dns.reverse(ip).then((r) => r[0] ?? null).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
  ]);
  if (rdnsCache.size > 5000) rdnsCache.clear();
  rdnsCache.set(ip, { host, at: Date.now() });
  return host;
}
