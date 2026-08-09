"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useMonthlyAnalytics, useWeeklyAnalytics } from "../actions/use-analytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlarmClock, CheckCircle2, ClipboardList, Gauge, Pause, TrendingUp } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Weekly and monthly summaries of your work
        </p>
      </div>
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <WeeklySection />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeeklySection() {
  const { data, isLoading } = useWeeklyAnalytics();

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">{data.period}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Goals Assigned" value={data.assigned} icon={ClipboardList} />
        <StatCard title="Completed" value={data.completed} icon={CheckCircle2} />
        <StatCard title="Pending / Blocked" value={`${data.pending} / ${data.blocked}`} icon={Pause} />
        <StatCard
          title="Completion"
          value={`${data.completionRate}%`}
          icon={TrendingUp}
          subtitle={`${data.reviews} reviews this week`}
        />
      </div>
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Completions per day</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.perDaySeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlySection() {
  const { data, isLoading } = useMonthlyAnalytics();

  if (isLoading) return <AnalyticsSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">{data.period}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Goals Assigned" value={data.goalsAssigned} icon={ClipboardList} />
        <StatCard title="Completed" value={data.goalsCompleted} icon={CheckCircle2} />
        <StatCard title="Reviews Generated" value={data.reviewsGenerated} icon={AlarmClock} />
        <StatCard
          title="Avg Review Score"
          value={data.avgReviewScore ? data.avgReviewScore.toFixed(1) : "—"}
          icon={Gauge}
          subtitle={`${data.learningProgress} learning items`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Weekly completions</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Goals by status (all time)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.goalsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis dataKey="status" type="category" width={90} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
