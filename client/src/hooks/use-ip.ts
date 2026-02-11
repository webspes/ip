import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useIp() {
  return useQuery({
    queryKey: [api.ip.get.path],
    queryFn: async () => {
      const res = await fetch(api.ip.get.path);
      if (!res.ok) throw new Error("Failed to fetch IP status");
      return api.ip.get.responses[200].parse(await res.json());
    },
    retry: false,
  });
}
