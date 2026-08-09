"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ChatHistory } from "@prisma/client";

export interface ConversationSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useConversations() {
  return useQuery({
    queryKey: ["chat"],
    queryFn: () => request<ConversationSummary[]>("/api/chat"),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ["chat", id],
    queryFn: () => request<ChatHistory>(`/api/chat/${id}`),
    enabled: Boolean(id),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { conversationId?: string; message: string }) =>
      request<{ conversationId: string; reply: string }>("/api/chat", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ deleted: boolean }>(`/api/chat/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Conversation deleted");
      qc.invalidateQueries({ queryKey: ["chat"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
