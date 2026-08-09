"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  designation: string | null;
  role: string;
  skills: string[];
  department: { id: string; name: string } | null;
  totalGoals: number;
  completedGoals: number;
  completionPct: number;
  avgRating: number | null;
}

export interface TeamAnalytics {
  headcount: number;
  goalsByStatus: { status: string; count: number }[];
  goalsDueThisWeek: number;
  skillDistribution: { skill: string; count: number }[];
  topPerformers: { id: string; name: string; completedThisMonth: number; avgRating: number | null }[];
  monthlyPerformance: { month: string; avgRating: number | null }[];
  departmentComparison: { department: string; completionPct: number }[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useEmployees(search?: string, page = 1) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("page", String(page));
  params.set("pageSize", "10");
  return useQuery({
    queryKey: ["manager", "employees", search ?? "", page],
    queryFn: () =>
      request<{ employees: EmployeeRow[]; pagination: { total: number; totalPages: number; page: number } }>(
        `/api/manager/employees?${params}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useTeamAnalytics() {
  return useQuery({
    queryKey: ["manager", "team-analytics"],
    queryFn: () => request<TeamAnalytics>("/api/manager/team-analytics"),
  });
}

export function useSetGoalApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, approved }: { goalId: string; approved: boolean }) =>
      request(`/api/manager/goals/${goalId}/approval`, {
        method: "POST",
        body: JSON.stringify({ approved }),
      }),
    onSuccess: (_d, v) => {
      toast.success(v.approved ? "Goal approved" : "Goal rejected");
      qc.invalidateQueries({ queryKey: ["goals"] });
      qc.invalidateQueries({ queryKey: ["manager"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
