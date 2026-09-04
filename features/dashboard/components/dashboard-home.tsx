"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlarmClock,
  Award,
  CheckCircle2,
  Compass,
  Gauge,
  Target,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={item}>
        <Card className="relative overflow-hidden rounded-xl border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent md:block" />
          <CardHeader>
            <CardTitle className="text-2xl">
              {isLoading ? (
                <Skeleton className="h-7 w-64" />
              ) : (
                `Welcome back, ${data?.user.name.split(" ")[0]}`
              )}
            </CardTitle>
            <CardDescription>
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                <span>
                  {data?.user.designation ?? "Team member"} ·{" "}
                  {format(new Date(), "EEEE, MMMM d")}
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Team Stats (for managers) */}
      {/* Removed per user request */}

      {/* Team Stats (for managers) */}
      {!isLoading && data?.user.role === "MANAGER" && data?.teamData && (
        <motion.div
          variants={item}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <StatCard title="Team size" value={data.teamData.teamSize} icon={UsersIcon} />
          <StatCard
            title="Goals in progress"
            value={data.teamData.activeGoalsCount}
            icon={TrendingUp}
          />
          <StatCard
            title="Completed this week"
            value={data.teamData.completedThisWeekCount}
            icon={CheckCircle2}
          />
          <StatCard
            title="Total completed"
            value={data.teamData.completedGoalsCount}
            icon={Target}
          />
        </motion.div>
      )}

      {/* Stat cards - Removed per user request */}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active tasks */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Current Tasks</CardTitle>
                <CardDescription>Your work in progress</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/tasks">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))
              ) : data?.activeGoals.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Target className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No active tasks yet. Create your first task to get started.
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/tasks?new=1">Create task</Link>
                  </Button>
                </div>
              ) : (
                data?.activeGoals.map((goal: DashboardData["activeGoals"][number]) => (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{goal.title}</span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {goal.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{goal.category ?? "General"}</span>
                      <span>{goal.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Missed Deadlines (for managers) */}
      {!isLoading && data?.user.role === "MANAGER" && data?.teamData && (
        <motion.div variants={item}>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlarmClock className="h-4 w-4 text-red-500" /> Team Missed Deadlines
              </CardTitle>
              <CardDescription>Tasks from your team with overdue dates</CardDescription>
            </CardHeader>
            <CardContent>
              {data.teamData.missedDeadlines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No missed deadlines. Great job!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.teamData.missedDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                    >
                      <span className="text-sm font-medium text-red-900 dark:text-red-100 truncate">
                        {deadline.title}
                      </span>
                      <Badge variant="destructive" className="shrink-0 text-xs">
                        {deadline.dueDate ? new Date(deadline.dueDate).toLocaleDateString() : "—"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Latest review */}
        <motion.div variants={item}>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4" /> Latest Review
              </CardTitle>
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
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No reviews yet. Generate your first AI performance review.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/reviews?new=1">Generate review</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI career suggestion */}
        <motion.div variants={item}>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-4 w-4" /> AI Career Suggestion
              </CardTitle>
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
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered career guidance tailored to your goals.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href="/career">Get guidance</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={item}>
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : data?.recentActivities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {data?.recentActivities.map((a: DashboardData["recentActivities"][number]) => (
                    <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
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
      </div>
    </motion.div>
  );
}
