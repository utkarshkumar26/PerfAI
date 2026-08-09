"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Objective, KeyResult } from "@prisma/client";

export type ObjectiveVM = Objective & {
  keyResults: KeyResult[];
  owner: { id: string; name: string };
  parent: { id: string; title: string } | null;
  children: { id: string; title: string }[];
  achievement: number;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useObjectives(cycle?: string) {
  return useQuery({
    queryKey: ["okrs", cycle ?? "all"],
    queryFn: () => request<ObjectiveVM[]>(`/api/okrs/objectives${cycle ? `?cycle=${cycle}` : ""}`),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["okrs"] });
}

export function useCreateObjective() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description?: string;
      level: "COMPANY" | "TEAM" | "INDIVIDUAL";
      cycle: string;
      parentId?: string;
      keyResults: { title: string; target: number; unit?: string }[];
    }) =>
      request<Objective>("/api/okrs/objectives", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Objective created");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteObjective() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ deleted: boolean }>(`/api/okrs/objectives/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Objective deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateKeyResult() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, current }: { id: string; current: number }) =>
      request<KeyResult>(`/api/okrs/key-results/${id}`, {
        method: "PUT",
        body: JSON.stringify({ current }),
      }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useOkrAdvice() {
  return useMutation({
    mutationFn: (objectiveId: string) =>
      request<{ recommendations: string[]; health: string }>("/api/ai/okr-advice", {
        method: "POST",
        body: JSON.stringify({ objectiveId }),
      }),
    onError: (e: Error) => toast.error(e.message),
  });
}
