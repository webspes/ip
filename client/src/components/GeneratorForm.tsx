import { useState } from "react";
import { useGenerateNames } from "@/hooks/use-names";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/lib/i18n";

interface GeneratorFormProps {
  onHasResults?: (hasResults: boolean) => void;
}

export function GeneratorForm({ onHasResults }: GeneratorFormProps) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const { mutate, isPending, data, error, reset } = useGenerateNames();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    mutate({ topic, count }, {
      onSuccess: () => onHasResults?.(true),
    });
  };

  const handleBack = () => {
    reset();
    onHasResults?.(false);
  };

  if (data && data.results.length > 0) {
    return (
      <div className="space-y-6 w-full max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Button size="icon" variant="ghost" onClick={handleBack} data-testid="button-back-to-form">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-xl font-semibold text-white" data-testid="text-results-title">{t("results.title")}</h3>
        </div>
        <p className="text-sm text-zinc-400 -mt-4 ml-12" data-testid="text-results-topic">
          {topic}
        </p>

        <div className="grid gap-2">
          <AnimatePresence>
            {data.results.map((result, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center justify-between gap-4 px-5 py-4 rounded-md bg-zinc-900/70 border border-zinc-800"
                data-testid={`row-result-${idx}`}
              >
                <span className="font-mono text-base text-zinc-100 tracking-tight" data-testid={`text-domain-name-${idx}`}>
                  {result.name}
                </span>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  result.available
                    ? "bg-green-500/15 text-green-400"
                    : "bg-red-500/15 text-red-400"
                }`} data-testid={`text-domain-status-${idx}`}>
                  {result.available ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" />{t("results.available")}</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" />{t("results.taken")}</>
                  )}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={handleBack} data-testid="button-new-search">
            {t("form.submit")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <Card className="border-zinc-800 bg-zinc-900/50">
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-zinc-300">
                {t("form.topic.label")}
              </label>
              <Textarea
                id="topic"
                placeholder={t("form.topic.placeholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="min-h-[100px] text-base"
                disabled={isPending}
                required
                data-testid="input-topic"
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
                data-testid="input-count"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending || !topic.trim()}
              data-testid="button-generate"
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
        <div className="p-4 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm" data-testid="text-generation-error">
          {error instanceof Error ? error.message : t("error.description")}
        </div>
      )}
    </div>
  );
}
