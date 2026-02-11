import { useIp } from "@/hooks/use-ip";
import { GeneratorForm } from "@/components/GeneratorForm";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldAlert, ShieldCheck, Terminal, Server, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 space-y-6"
        >
          {config?.logo ? (
            <div className="inline-flex items-center justify-center gap-3 p-3 rounded-full bg-zinc-900/50 border border-zinc-800 mb-6">
              <img src={config.logo} alt="Logo" className="h-8 w-auto" data-testid="img-app-logo" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight glow-text">{t("header.title")}</h1>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center gap-3 p-3 rounded-full bg-zinc-900/50 border border-zinc-800 mb-6">
              <Terminal className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight glow-text">{t("header.title")}</h1>
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              {t("header.subtitle")}
            </span>
            <div className="flex flex-col items-center gap-2">
              {ipDetails.map((ipInfo, index) => (
                <div key={index} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg">
                  <span className="font-mono text-lg sm:text-xl text-zinc-200" data-testid={`text-ip-address-${index}`}>
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
        </motion.div>

        {/* Server Identity Section */}
        {(outboundIp || serverIps.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="inline-flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
                {t("server.title")}
              </span>
            </div>

            {outboundIp && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider">{t("server.outbound")}</span>
                <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg">
                  <span className="font-mono text-lg sm:text-xl text-zinc-200" data-testid="text-server-outbound-ip">
                    {outboundIp}
                  </span>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                    public
                  </span>
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
              </div>
            )}

            {serverIps.length > 0 && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-zinc-500 text-xs uppercase tracking-wider">{t("server.interfaces")}</span>
                <div className="flex flex-col items-center gap-2">
                  {serverIps.map((sip, index) => (
                    <div key={index} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg">
                      <span className="font-mono text-lg sm:text-xl text-zinc-200" data-testid={`text-server-ip-${index}`}>
                        {sip.address}
                      </span>
                      <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded" data-testid={`text-server-ip-type-${index}`}>
                        {sip.type}
                      </span>
                      <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded" data-testid={`text-server-ip-iface-${index}`}>
                        {sip.interface}
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

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {ipData.isAllowed && <GeneratorForm />}
        </motion.div>
        
      </div>
    </div>
  );
}
