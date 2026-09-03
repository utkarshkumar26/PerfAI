"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LoginInput, RegisterInput } from "../validations/auth.schema";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  avatarUrl: string | null;
  designation: string | null;
  departmentId: string | null;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data as T;
}

export function useSession() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async (): Promise<SessionUser | null> => {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      return json.data.user as SessionUser | null;
    },
    staleTime: 60_000,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => post<SessionUser>("/api/auth/login", input),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      toast.success(`Welcome back, ${user.name}`);
      router.push(user.role === "MANAGER" || user.role === "ADMIN" ? "/manager" : "/dashboard");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => post<SessionUser>("/api/auth/register", input),
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      toast.success("Account created successfully");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => post<{ message: string }>("/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
