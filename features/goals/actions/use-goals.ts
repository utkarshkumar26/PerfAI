"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Goal, User } from "@prisma/client";
import type {
  CreateGoalInput,
  UpdateGoalInput,
  AIGoalSuggestionInput,
} from "../validations/goal.schema";

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  text: string;
  createdAt: string;
}

export interface TaskDebugInfo {
  browser?: string;
  userAgent?: string;
  userId?: string;
  ip?: string;
  env?: string;
  revision?: string;
  [key: string]: unknown;
}

export type GoalWithUsers = Goal & {
  user: Pick<User, "id" | "name" | "avatarUrl" | "designation" | "email">;
  assignedBy: Pick<User, "id" | "name" | "avatarUrl"> | null;
};

export interface GoalListResponse {
  goals: GoalWithUsers[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface GoalFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  userId?: string;
  section?: string;
  project?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export interface TaskAISolution {
  summary: string;
  rootCause: string;
  solutionSteps: string[];
  codeSnippet?: string;
  suggestedPRTitle: string;
  testPlan: string[];
}

interface AIGoalSuggestions {
  goals: Array<{
    title: string;
    description: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    category: string;
    timelineDays: number;
  }>;
  weeklyTasks: string[];
  monthlyTasks: string[];
  learningPlan: string[];
  certifications: string[];
  summary: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useGoals(filters: GoalFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  return useQuery({
    queryKey: ["goals", filters],
    queryFn: () =>
      request<GoalListResponse>(`/api/goals?${params.toString()}`),
    placeholderData: (prev) => prev,
  });
}

export function useInvalidateGoals() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["goals"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["manager-analytics"] });
  };
}

export function useCreateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (input: CreateGoalInput) =>
      request<GoalWithUsers>("/api/goals", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Task created successfully");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateGoalInput & { id: string }) =>
      request<GoalWithUsers>(`/api/goals/${id}`, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      toast.success("Task updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteGoal() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (id: string) =>
      request<{ deleted: boolean }>(`/api/goals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Task deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddTaskComment() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ taskId, text }: { taskId: string; text: string }) =>
      request<GoalWithUsers>(`/api/goals/${taskId}`, {
        method: "PUT",
        body: JSON.stringify({ comment: { text } }),
      }),
    onSuccess: () => {
      toast.success("Comment added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSolveTaskWithAI() {
  return useMutation({
    mutationFn: (taskData: Partial<GoalWithUsers>) =>
      request<TaskAISolution>("/api/ai/tasks/solve", {
        method: "POST",
        body: JSON.stringify(taskData),
      }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAIGoalSuggestions() {
  return useMutation({
    mutationFn: (input: AIGoalSuggestionInput) =>
      request<AIGoalSuggestions>("/api/ai/goals", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface GeneratedDescriptionData {
  description: string;
  summary?: string;
}

export function useGenerateTaskDescription() {
  return useMutation({
    mutationFn: (input: { title?: string; prompt?: string; project?: string }) =>
      request<GeneratedDescriptionData>("/api/ai/tasks/generate-description", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onError: (e: Error) => toast.error(e.message),
  });
}


