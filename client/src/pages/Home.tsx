import { useIp } from "@/hooks/use-ip";
import { GeneratorForm } from "@/components/GeneratorForm";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, Terminal, Server, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
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
  const [showingResults, setShowingResults] = useState(false);

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

        <AnimatePresence mode="wait">
          {!showingResults && (
            <motion.div
              key="ip-section"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
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
          )}
        </AnimatePresence>

        {ipData.isAllowed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <GeneratorForm onHasResults={setShowingResults} />
          </motion.div>
        )}

      </div>
    </div>
  );
}
