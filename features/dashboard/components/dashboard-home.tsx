"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlarmClock,
  Award,
  CheckCircle2,
  Compass,
  Pause,
  Target,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useDashboard } from "../actions/use-dashboard";
import type { DashboardData } from "../actions/dashboard.service";
import { StatCard } from "./stat-card";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DashboardHome() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md rounded-xl">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We couldn&apos;t load your dashboard. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="workspace-page dashboard-page space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={item}>
        <Card className="dashboard-welcome-card relative overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-card to-violet-500/5">
          <div className="dashboard-welcome-glow pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block" />
          <CardHeader className="dashboard-welcome-content relative z-10">
            <div className="dashboard-welcome-line">
              <p className="dashboard-welcome-eyebrow text-xs font-semibold uppercase tracking-[0.18em] text-primary">Performance overview</p>
              <CardTitle className="text-2xl tracking-tight">
                {isLoading ? (
                  <Skeleton className="h-7 w-64" />
                ) : (
                  `Welcome back, ${data?.user.name.split(" ")[0]}`
                )}
              </CardTitle>
              <CardDescription className="dashboard-welcome-description">
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  <span>
                    {data?.user.designation ?? "Team member"} ·{" "}
                    {format(new Date(), "EEEE, MMMM d")}
                  </span>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Team Stats (for managers) */}
      {/* Removed per user request */}

      {/* Team Stats (for managers) */}
      {!isLoading && data?.user.role === "MANAGER" && data?.teamData && (
        <motion.div
          variants={item}
          className="dashboard-stats grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="dashboard-stat-card dashboard-stat-blocked">
            <StatCard title="Blocked" value={data.teamData.blockedGoalsCount ?? 0} icon={Pause} href="/analytics" />
          </div>
          <div className="dashboard-stat-card dashboard-stat-progress">
          <StatCard
            title="Goals in progress"
            value={data.teamData.activeGoalsCount}
            icon={TrendingUp}
            href="/analytics"
          />
          </div>
          <div className="dashboard-stat-card dashboard-stat-weekly">
          <StatCard
            title="Completed this week"
            value={data.teamData.completedThisWeekCount}
            icon={CheckCircle2}
            href="/analytics"
          />
          </div>
          <div className="dashboard-stat-card dashboard-stat-completed">
          <StatCard
            title="Total completed"
            value={data.teamData.completedGoalsCount}
            icon={Target}
            href="/analytics"
          />
          </div>
        </motion.div>
      )}

      {/* Stat cards - Removed per user request */}

      <div className="dashboard-feature-grid grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Latest review */}
        <motion.div variants={item} className="dashboard-feature-card dashboard-review-card h-full">
          <Card className="h-full rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="dashboard-card-icon"><Award className="h-4 w-4" /></span> Latest Review
              </CardTitle>
              <CardDescription>Your performance review at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : data?.latestReview ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{data.latestReview.period}</span>
                    {data.latestReview.rating && (
                      <Badge>{data.latestReview.rating.toFixed(1)} / 5</Badge>
                    )}
                  </div>
                  <p className="line-clamp-4 text-sm text-muted-foreground">
                    {data.latestReview.content}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="px-0">
                    <Link href="/reviews">View all reviews</Link>
                  </Button>
                </div>
              ) : (
                <div className="py-1 text-center">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    No reviews yet. Generate your first AI performance review.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/reviews?new=1">Generate review</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI career suggestion */}
        <motion.div variants={item} className="dashboard-feature-card dashboard-career-card h-full">
          <Card className="h-full rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="dashboard-card-icon"><Compass className="h-4 w-4" /></span> AI Career Suggestion
              </CardTitle>
              <CardDescription>Guidance for your next career step</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : data?.latestSuggestion ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-xs">
                    {data.latestSuggestion.type}
                  </Badge>
                  <p className="line-clamp-4 text-sm text-muted-foreground">
                    {data.latestSuggestion.summary ?? "New suggestion available"}
                  </p>
                  <Button asChild variant="ghost" size="sm" className="px-0">
                    <Link href="/career">Explore career</Link>
                  </Button>
                </div>
              ) : (
                <div className="py-1 text-center">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    Get AI-powered career guidance tailored to your goals.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2">
                    <Link href="/career">Get guidance</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={item} className="dashboard-feature-card dashboard-activity-card h-full">
          <Card className="h-full rounded-2xl border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="dashboard-card-icon"><Activity className="h-4 w-4" /></span> Recent Activity
              </CardTitle>
              <CardDescription>Your latest updates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : data?.recentActivities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="dashboard-activity-list max-h-24 space-y-1.5 overflow-y-auto pr-1">
                  {data?.recentActivities.map((a: DashboardData["recentActivities"][number]) => (
                    <li key={a.id} className="dashboard-activity-item flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {a.action.replaceAll("_", " ").toLowerCase()}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground/70">
                        {format(new Date(a.createdAt), "MMM d")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Create a task */}
        <motion.div variants={item} className="dashboard-feature-card dashboard-create-card h-full">
          <Card className="h-full rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.1] via-card to-violet-500/[0.09] shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="dashboard-card-icon flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Target className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>Create a Task</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    Plan your next goal or assign work to a teammate.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto grid grid-cols-2 gap-2">
              <Button asChild size="sm" className="w-full text-xs">
                <Link href="/tasks?new=1">Create a task</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full bg-background/70 text-xs">
                <Link href="/tasks">Open task board</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Missed Deadlines (for managers) */}
      {!isLoading && data?.user.role === "MANAGER" && data?.teamData && (
        <motion.div variants={item}>
          <Card className="dashboard-deadlines-card rounded-2xl border-red-200/70 shadow-sm dark:border-red-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-red-500" /> Team Missed Deadlines
              </CardTitle>
              <CardDescription className="text-xs">Overdue work that may need attention</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {data.teamData.missedDeadlines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No missed deadlines. Great job!
                </p>
              ) : (
                <div className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                  {data.teamData.missedDeadlines.map((deadline) => (
                    <Link
                      key={deadline.id}
                      href={`/tasks?task=${encodeURIComponent(deadline.id)}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-red-200/80 bg-red-50/80 p-2.5 transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-800/80 dark:bg-red-950/40 dark:hover:bg-red-950"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-red-900 dark:text-red-100">
                          {deadline.title}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-red-800/80 dark:text-red-200/80">
                          {deadline.user.name}
                          {deadline.user.designation ? ` · ${deadline.user.designation}` : ""}
                        </p>
                      </div>
                      <Badge variant="destructive" className="shrink-0 text-xs">
                        {deadline.dueDate ? new Date(deadline.dueDate).toLocaleDateString() : "—"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
