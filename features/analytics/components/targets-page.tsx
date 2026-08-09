"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Target, Trophy, TrendingUp, ListChecks } from "lucide-react";
import { useTargetAnalytics } from "../actions/use-analytics";

function CircularProgress({
  value,
  label,
  sub,
}: {
  value: number;
  label: string;
  sub: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="stroke-primary transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{clamped}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

function TargetBar({
  label,
  completed,
  target,
}: {
  label: string;
  completed: number;
  target: number;
}) {
  const pct = target === 0 ? 0 : Math.min(100, Math.round((completed / target) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {completed} / {target}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground">{pct}% of target</p>
    </div>
  );
}

export function TargetsPage() {
  const { data, isLoading } = useTargetAnalytics();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const weeklyPct =
    data.weeklyTarget.target === 0
      ? 0
      : Math.round((data.weeklyTarget.completed / data.weeklyTarget.target) * 100);
  const monthlyPct =
    data.monthlyTarget.target === 0
      ? 0
      : Math.round((data.monthlyTarget.completed / data.monthlyTarget.target) * 100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Target Tracking</h1>
        <p className="text-sm text-muted-foreground">
          KPIs against your weekly and monthly targets
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Goal Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CircularProgress
              value={data.completionPct}
              label={`${data.completedGoals} of ${data.totalGoals} goals`}
              sub={`${data.remaining} remaining`}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Current Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <TargetBar
              label="Weekly target"
              completed={data.weeklyTarget.completed}
              target={data.weeklyTarget.target}
            />
            <TargetBar
              label="Monthly target"
              completed={data.monthlyTarget.completed}
              target={data.monthlyTarget.target}
            />
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-4 w-4" /> Achievement Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CircularProgress
              value={data.achievementRate}
              label="Overall achievement"
              sub={`Weekly ${weeklyPct}% · Monthly ${monthlyPct}%`}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4" /> Performance Trend (6 months)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis domain={[0, 5]} fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
