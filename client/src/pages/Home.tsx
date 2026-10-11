import { useIp } from "@/hooks/use-ip";
import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, Terminal, Server, Copy, Check, Globe, Network, AtSign, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { t, currentLang } from "@/lib/i18n";
import { api } from "@shared/routes";

function useAppConfig() {
  return useQuery({
    queryKey: [api.config.get.path],
    queryFn: async () => {
      const res = await fetch(api.config.get.path);
      if (!res.ok) return { favicon: null, logo: null };
      return api.config.get.responses[200].parse(await res.json());
    },
  });
}

export default function Home() {
  const { data: ipData, isLoading, error } = useIp();
  const { data: config } = useAppConfig();
  const { data: serverData } = useQuery({
    queryKey: [api.server.get.path],
    queryFn: async () => {
      const res = await fetch(api.server.get.path);
      if (!res.ok) throw new Error("Failed to fetch server IP");
      return api.server.get.responses[200].parse(await res.json());
    },
  });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedServerIndex, setCopiedServerIndex] = useState<number | null>(null);
  const [copiedOutbound, setCopiedOutbound] = useState(false);

  const ipDetails = ipData?.ips || [];
  const serverIps = serverData?.ips || [];
  const outboundIp = serverData?.outboundIp || null;

  const copyIp = (ip: string, index: number) => {
    navigator.clipboard.writeText(ip);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyServerIp = (ip: string, index: number) => {
    navigator.clipboard.writeText(ip);
    setCopiedServerIndex(index);
    setTimeout(() => setCopiedServerIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !ipData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-white">{t("error.title")}</h1>
          <p className="text-zinc-400">{t("error.description")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">

        {config?.logo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-8"
          >
            <img src={config.logo} alt="Logo" className="h-10 w-auto" data-testid="img-app-logo" />
          </motion.div>
        )}

        <motion.div
          key="ip-section"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-10 mb-10"
        >
              <div className="text-center space-y-5">
                {!config?.logo && (
                  <div className="inline-flex items-center justify-center gap-3 p-3 rounded-full bg-zinc-900/50 border border-zinc-800">
                    <Terminal className="w-5 h-5 text-primary" />
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight glow-text">{t("header.title")}</h1>
                  </div>
                )}

                <div className="space-y-3">
                  <span className="text-zinc-500 text-xs font-medium uppercase tracking-widest block">
                    {t("header.subtitle")}
                  </span>
                  <div className="flex flex-col items-center gap-2">
                    {ipDetails.map((ipInfo, index) => (
                      <div key={index} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-md bg-zinc-900/80 border border-zinc-800">
                        <span className="font-mono text-base text-zinc-200" data-testid={`text-ip-address-${index}`}>
                          {ipInfo.address}
                        </span>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded" data-testid={`text-ip-type-${index}`}>
                          {ipInfo.type}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyIp(ipInfo.address, index)}
                          data-testid={`button-copy-ip-${index}`}
                        >
                          {copiedIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {ipData.isAllowed && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      {t("header.authorized")}
                    </span>
                  )}
                </div>
              </div>

              <DetailsGrid data={ipData} />
              <Ipv6Check />
              <BrowserCard />
              <TerminalBox />

              {(outboundIp || serverIps.length > 0) && (
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center gap-2">
                    <Server className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                      {t("server.title")}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    {outboundIp && (
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-md bg-zinc-900/80 border border-zinc-800">
                        <span className="text-xs text-zinc-500 uppercase">{t("server.outbound")}</span>
                        <span className="font-mono text-base text-zinc-200" data-testid="text-server-outbound-ip">
                          {outboundIp}
                        </span>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">public</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(outboundIp);
                            setCopiedOutbound(true);
                            setTimeout(() => setCopiedOutbound(false), 2000);
                          }}
                          data-testid="button-copy-outbound-ip"
                        >
                          {copiedOutbound ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}

                    {serverIps.map((sip, index) => (
                      <div key={index} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-md bg-zinc-900/80 border border-zinc-800">
                        <span className="text-xs text-zinc-600">{sip.interface}</span>
                        <span className="font-mono text-base text-zinc-200" data-testid={`text-server-ip-${index}`}>
                          {sip.address}
                        </span>
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded" data-testid={`text-server-ip-type-${index}`}>
                          {sip.type}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyServerIp(sip.address, index)}
                          data-testid={`button-copy-server-ip-${index}`}
                        >
                          {copiedServerIndex === index ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
        </motion.div>

        <footer className="text-center text-xs text-zinc-500 space-y-1 pt-6 border-t border-zinc-900">
          <p>{t("footer.by")} <a href="https://webspesialisten.no" className="text-zinc-300 hover:text-white underline-offset-2 hover:underline">Webspesialisten</a></p>
          <p><a href="https://db-ip.com" className="hover:text-zinc-300">{t("footer.dbip")}</a></p>
        </footer>
      </div>
    </div>
  );
}

const card = "rounded-lg bg-zinc-900/60 border border-zinc-800 p-4";

/** Regional-indicator emoji flag from an ISO country code. */
function flag(code?: string | null) {
  return code && /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...code.split("").map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";
}

function DetailsGrid({ data }: { data: { version?: number | null; hostname?: string | null; country?: string | null; countryCode?: string | null; asn?: number | null; org?: string | null } }) {
  const countryName = (() => {
    if (!data.countryCode) return data.country;
    try { return new Intl.DisplayNames([currentLang === "no" ? "nb" : "en"], { type: "region" }).of(data.countryCode) || data.country; } catch { return data.country; }
  })();
  const rows: [typeof Globe, string, string][] = [
    [Globe, t("details.country"), countryName ? `${flag(data.countryCode)} ${countryName}` : t("details.unknown")],
    [Network, t("details.network"), data.org ? `${data.org}${data.asn ? ` (AS${data.asn})` : ""}` : t("details.unknown")],
    [AtSign, t("details.hostname"), data.hostname || t("details.none")],
    [Terminal, t("details.version"), data.version ? `IPv${data.version}` : t("details.unknown")],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 text-left">
      {rows.map(([Icon, label, value]) => (
        <div key={label} className={card}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
          <div className="font-mono text-sm text-zinc-200 break-all" data-testid={`text-${label}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}

/** Opt-in: the server has no IPv6, so ask an IPv6-only endpoint from the browser. */
function Ipv6Check() {
  const [state, setState] = useState<"idle" | "busy" | "none" | string>("idle");
  const run = async () => {
    setState("busy");
    try {
      const res = await fetch("https://api6.ipify.org?format=json", { signal: AbortSignal.timeout(6000) });
      const d = await res.json();
      setState(d.ip || "none");
    } catch {
      setState("none");
    }
  };
  return (
    <div className={`${card} text-left flex flex-wrap items-center gap-3`}>
      <div className="flex-1 min-w-[200px]">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">{t("ipv6.title")}</div>
        {state === "idle" || state === "busy" ? <p className="text-xs text-zinc-500">{t("ipv6.note")}</p>
          : state === "none" ? <p className="text-sm text-zinc-300">{t("ipv6.none")}</p>
          : <p className="font-mono text-sm text-zinc-200 break-all">{state}</p>}
      </div>
      {(state === "idle" || state === "busy") && (
        <Button variant="outline" size="sm" onClick={run} disabled={state === "busy"}>{state === "busy" ? t("ipv6.checking") : t("ipv6.check")}</Button>
      )}
    </div>
  );
}

function parseUa(ua: string) {
  const m = (re: RegExp) => re.exec(ua)?.[1];
  const major = (v?: string) => v?.split(".")[0];
  const browser = m(/Edg\/([\d.]+)/) ? `Edge ${major(m(/Edg\/([\d.]+)/))}`
    : m(/OPR\/([\d.]+)/) ? `Opera ${major(m(/OPR\/([\d.]+)/))}`
    : m(/Firefox\/([\d.]+)/) ? `Firefox ${major(m(/Firefox\/([\d.]+)/))}`
    : m(/Chrome\/([\d.]+)/) ? `Chrome ${major(m(/Chrome\/([\d.]+)/))}`
    : m(/Version\/([\d.]+).*Safari/) ? `Safari ${m(/Version\/([\d.]+).*Safari/)!.split(".").slice(0, 2).join(".")}`
    : "–";
  const os = /iPhone|iPad/.test(ua) ? `iOS ${m(/OS (\d+)_/) ?? ""}`.trim()
    : m(/Android ([\d.]+)/) ? `Android ${m(/Android ([\d.]+)/)}`
    : /Windows NT 10/.test(ua) ? "Windows 10/11"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Linux/.test(ua) ? "Linux" : "–";
  return { browser, os };
}

function BrowserCard() {
  const { browser, os } = parseUa(navigator.userAgent);
  const rows: [string, string][] = [
    [t("browser.browser"), browser],
    [t("browser.os"), os],
    [t("browser.language"), navigator.languages?.slice(0, 3).join(", ") || navigator.language],
    [t("browser.screen"), `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio}x`],
    [t("browser.timezone"), Intl.DateTimeFormat().resolvedOptions().timeZone],
  ];
  return (
    <div className={`${card} text-left`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-2"><Monitor className="w-3.5 h-3.5" /> {t("browser.title")}</div>
      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
        {rows.map(([k, v]) => <Fragment key={k}><dt className="text-zinc-500">{k}</dt><dd className="text-zinc-200">{v}</dd></Fragment>)}
      </dl>
      <p className="mt-2 font-mono text-[11px] text-zinc-500 break-all">{navigator.userAgent}</p>
    </div>
  );
}

function TerminalBox() {
  const host = window.location.host;
  const lines: [string, string][] = [
    [t("terminal.ip"), `curl ${host}`],
    [t("terminal.json"), `curl ${host}/json`],
    [t("terminal.v4"), `curl ${host}/ipv4`],
  ];
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <div className={`${card} text-left`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-zinc-500 mb-2"><Terminal className="w-3.5 h-3.5" /> {t("terminal.title")}</div>
      <div className="space-y-2">
        {lines.map(([label, cmd]) => (
          <div key={cmd} className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 w-32 shrink-0">{label}</span>
            <code className="flex-1 font-mono text-sm text-emerald-300 bg-black/40 rounded px-2 py-1 overflow-x-auto whitespace-nowrap">$ {cmd}</code>
            <Button size="icon" variant="ghost" aria-label={`Copy ${cmd}`} onClick={() => { navigator.clipboard.writeText(cmd); setCopied(cmd); setTimeout(() => setCopied(null), 1500); }}>
              {copied === cmd ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
