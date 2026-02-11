import { useState } from "react";
import { useGenerateNames } from "@/hooks/use-names";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";

export function GeneratorForm() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const { mutate, isPending, data, error } = useGenerateNames();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    mutate({ topic, count });
  };

  return (
    <div className="space-y-8 w-full max-w-2xl mx-auto">
      <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("form.title")}
          </CardTitle>
          <CardDescription>
            {t("form.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-zinc-300">
                {t("form.topic.label")}
              </label>
              <Textarea
                id="topic"
                placeholder={t("form.topic.placeholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[120px] text-base"
                disabled={isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="count" className="text-sm font-medium text-zinc-300">
                {t("form.count.label")}
              </label>
              <Input
                id="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full sm:w-32"
                disabled={isPending}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isPending || !topic.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("form.loading")}
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm" data-testid="text-generation-error">
          {error instanceof Error ? error.message : t("error.description")}
        </div>
      )}

      <AnimatePresence mode="wait">
        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-3"
          >
            <h3 className="text-lg font-semibold text-white mb-2 pl-1">{t("results.title")}</h3>
            {data.results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-lg font-medium text-zinc-200 font-mono tracking-tight">
                    {result.name}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {result.name.toLowerCase().replace(/\s+/g, '')}.com
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  result.available 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {result.available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t("results.available")}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      {t("results.taken")}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
