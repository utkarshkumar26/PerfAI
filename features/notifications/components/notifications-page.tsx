"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  AlarmClock,
  Bell,
  CheckCheck,
  ClipboardList,
  Goal,
  MessageSquare,
  Star,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Notification } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Bell> = {
  GOAL_COMPLETED: Goal,
  WEEKLY_REMINDER: AlarmClock,
  MONTHLY_REMINDER: AlarmClock,
  DEADLINE_REMINDER: AlarmClock,
  MANAGER_FEEDBACK: MessageSquare,
  REVIEW_READY: ClipboardList,
  GENERAL: Bell,
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => request<Notification[]>("/api/notifications"),
  });
}

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notifications", "count"] });
  };
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) =>
      request<Notification>(`/api/notifications/${id}`, { method: "POST" }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => request("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      toast.success("All notifications marked as read");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread} unread of {notifications?.length ?? 0}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllRead.mutate()}
          disabled={unread === 0 || markAllRead.isPending}
        >
          <CheckCheck /> Mark all read
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardContent className="divide-y p-0">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : notifications?.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            notifications?.map((n) => {
              const Icon = ICONS[n.type] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead.mutate(n.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm", !n.read && "font-semibold")}>
                        {n.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(n.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
