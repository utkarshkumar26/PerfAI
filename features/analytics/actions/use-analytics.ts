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

export function useWeeklyAnalytics(userId?: string) {
  const url = userId
    ? `/api/analytics/weekly?userId=${encodeURIComponent(userId)}`
    : "/api/analytics/weekly";
  return useQuery({
    queryKey: ["analytics", "weekly", userId ?? "me"],
    queryFn: () => request<WeeklyAnalytics>(url),
  });
}

export function useMonthlyAnalytics(userId?: string) {
  const url = userId
    ? `/api/analytics/monthly?userId=${encodeURIComponent(userId)}`
    : "/api/analytics/monthly";
  return useQuery({
    queryKey: ["analytics", "monthly", userId ?? "me"],
    queryFn: () => request<MonthlyAnalytics>(url),
  });
}
