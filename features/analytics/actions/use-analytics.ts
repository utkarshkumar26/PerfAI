"use client";

import { useQuery } from "@tanstack/react-query";

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export interface WeeklyAnalytics {
  period: string;
  assigned: number;
  completed: number;
  pending: number;
  blocked: number;
  completionRate: number;
  reviews: number;
  perDaySeries: { day: string; completed: number }[];
}

export interface MonthlyAnalytics {
  period: string;
  goalsAssigned: number;
  goalsCompleted: number;
  reviewsGenerated: number;
  avgReviewScore: number | null;
  learningProgress: number;
  goalsByStatus: { status: string; count: number }[];
  weeklySeries: { week: string; completed: number }[];
}

export interface TargetAnalytics {
  totalGoals: number;
  completedGoals: number;
  remaining: number;
  completionPct: number;
  weeklyTarget: { target: number; completed: number };
  monthlyTarget: { target: number; completed: number };
  performanceTrend: { month: string; rating: number | null }[];
  achievementRate: number;
}

export function useWeeklyAnalytics() {
  return useQuery({
    queryKey: ["analytics", "weekly"],
    queryFn: () => request<WeeklyAnalytics>("/api/analytics/weekly"),
  });
}

export function useMonthlyAnalytics() {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: () => request<MonthlyAnalytics>("/api/analytics/monthly"),
  });
}

export function useTargetAnalytics() {
  return useQuery({
    queryKey: ["analytics", "targets"],
    queryFn: () => request<TargetAnalytics>("/api/analytics/targets"),
  });
}
