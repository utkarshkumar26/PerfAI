"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "../actions/dashboard.service";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Failed to load dashboard");
      return json.data as DashboardData;
    },
  });
}
