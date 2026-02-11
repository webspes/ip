import { useIp } from "@/hooks/use-ip";
import { GeneratorForm } from "@/components/GeneratorForm";
import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, Terminal, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: ipData, isLoading, error } = useIp();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const ips = ipData?.ip ? ipData.ip.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

  const copyIp = (ip: string, index: number) => {
    navigator.clipboard.writeText(ip);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
          <h1 className="text-2xl font-bold text-white">Connection Error</h1>
          <p className="text-zinc-400">Unable to verify your IP address.</p>
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
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-zinc-900/50 border border-zinc-800 mb-6">
            <Terminal className="w-6 h-6 text-primary mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight glow-text">IP Address</h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <span className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              Visitor Identity
            </span>
            <div className="flex flex-col items-center gap-2">
              {ips.map((ip: string, index: number) => (
                <div key={index} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg">
                  <span className="font-mono text-lg sm:text-xl text-zinc-200" data-testid={`text-ip-address-${index}`}>
                    {ip}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyIp(ip, index)}
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
                Authorized Access
              </span>
            )}
          </div>
        </motion.div>

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
