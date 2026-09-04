"use client";

import { useState } from "react";
import { Search, Users as UsersIcon, AlarmClock, TrendingUp, Trophy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { useEmployees, useTeamAnalytics } from "../actions/use-manager";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#f97316",
  "#84cc16",
  "#14b8a6",
];

export function ManagerDashboard() {
  const [search, setSearch] = useState("");
  const { data: analytics, isLoading: loadingAnalytics } = useTeamAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground">
          Manage employees, review performance and track team analytics
        </p>
      </div>

      {/* Stats */}
      {loadingAnalytics || !analytics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Team size" value={analytics.headcount} icon={UsersIcon} />
          <StatCard
            title="Goals in progress"
            value={
              analytics.goalsByStatus.find((s) => s.status === "IN_PROGRESS")?.count ?? 0
            }
            icon={TrendingUp}
          />
          <StatCard
            title="Due this week"
            value={analytics.goalsDueThisWeek}
            icon={AlarmClock}
          />
          <StatCard
            title="Blocked"
            value={analytics.goalsByStatus.find((s) => s.status === "BLOCKED")?.count ?? 0}
            icon={Trophy}
          />
        </div>
      )}

      {/* Missed Deadlines */}
      {analytics && analytics.missedDeadlines.length > 0 && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlarmClock className="h-4 w-4 text-red-500" /> Missed Deadlines
            </CardTitle>
            <CardDescription>Tasks that have overdue dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {analytics.missedDeadlines.map((deadline) => (
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
          </CardContent>
        </Card>
      )}

      {/* Team table */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Employees</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="w-64 pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <EmployeeTable search={search} />
        </CardContent>
      </Card>

      {/* Charts */}
      {analytics && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Goal completion by member</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topPerformers}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="completedThisMonth" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Monthly team performance</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis domain={[0, 5]} fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Skill distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.skillDistribution}
                    dataKey="count"
                    nameKey="skill"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {analytics.skillDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Department comparison</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departmentComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis dataKey="department" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="completionPct" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmployeeTable({ search }: { search: string }) {
  const { data, isLoading } = useEmployees(search);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.employees.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No employees found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Department</TableHead>
          <TableHead className="w-48">Goal completion</TableHead>
          <TableHead>Avg rating</TableHead>
          <TableHead>Top skills</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.employees.map((e) => (
          <TableRow key={e.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={e.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {e.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-sm">{e.designation ?? "—"}</TableCell>
            <TableCell className="text-sm">{e.department?.name ?? "—"}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <Progress value={e.completionPct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  {e.completedGoals}/{e.totalGoals} · {e.completionPct}%
                </p>
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {e.avgRating ? e.avgRating.toFixed(1) : "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {e.skills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
