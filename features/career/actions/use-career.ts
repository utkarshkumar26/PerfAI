"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CareerSuggestion } from "@prisma/client";
import type { CareerRequestInput } from "../validations/career.schema";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useCareerSuggestions(type?: string) {
  const params = type ? `?type=${type}` : "";
  return useQuery({
    queryKey: ["career", type ?? "all"],
    queryFn: () => request<CareerSuggestion[]>(`/api/career${params}`),
  });
}

export function useCareerSuggestion(id: string) {
  return useQuery({
    queryKey: ["career", "detail", id],
    queryFn: () => request<CareerSuggestion>(`/api/career/${id}`),
    enabled: Boolean(id),
  });
}

export function useGenerateCareerAdvice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CareerRequestInput) =>
      request<CareerSuggestion>("/api/ai/career", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Career guidance generated");
      qc.invalidateQueries({ queryKey: ["career"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
