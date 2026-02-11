import { useMutation } from "@tanstack/react-query";
import { api, type GenerateNamesRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useGenerateNames() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: GenerateNamesRequest) => {
      // Ensure count is a number (form might send string)
      const payload = {
        ...data,
        count: Number(data.count),
      };

      const res = await fetch(api.names.generate.path, {
        method: api.names.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access forbidden: IP mismatch");
        }
        if (res.status === 400) {
          const errorData = await res.json();
          const parsedError = api.names.generate.responses[400].safeParse(errorData);
          if (parsedError.success) {
            throw new Error(parsedError.data.message);
          }
        }
        throw new Error("Failed to generate names");
      }

      return api.names.generate.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });
}
