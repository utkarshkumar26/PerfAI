"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ProfileInput } from "../validations/profile.schema";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  designation: string | null;
  experience: number | null;
  bio: string | null;
  skills: string[];
  education: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  department: { id: string; name: string } | null;
  manager: { id: string; name: string } | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => request<Profile>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) =>
      request("/api/profile", { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
