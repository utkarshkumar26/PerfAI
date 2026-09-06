"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useEmployees, useTeamAnalytics, type EmployeeRow } from "@/features/manager/actions/use-manager";
import { useSession } from "@/features/auth/actions/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlarmClock,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gauge,
  Layers,
  Pause,
  TrendingUp,
  User,
  Users,
} from "lucide-react";

export function AnalyticsPage() {
  const { data: user, isLoading: loadingSession } = useSession();
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  const { data: employeesData } = useEmployees("", 1);

  if (loadingSession) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // If regular employee, render standard personal analytics page
  if (!isManager) {
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

  // Manager / Admin View
  const employees = employeesData?.employees ?? [];
  const selectedEmployee = employees.find((e) => e.id === selectedUserId);

  return (
    <div className="space-y-6">
      {/* Top Header with Employee Dropdown */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {selectedUserId === "ALL"
              ? "Team Performance Analytics"
              : `${selectedEmployee?.name ?? "Employee"}'s Analytics`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {selectedUserId === "ALL"
              ? "Combined performance charts, team distributions, and individual breakdowns"
              : `Detailed performance metrics and completion history for ${selectedEmployee?.name ?? "selected employee"}`}
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedUserId}
            onValueChange={(val) => {
              if (val) setSelectedUserId(val);
            }}
          >
            <SelectTrigger className="w-full sm:w-[280px] bg-card shadow-sm border-border">
              <SelectValue placeholder="Select employee...">
                <div className="flex items-center gap-2">
                  {selectedUserId === "ALL" ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                  <span className="font-medium truncate">
                    {selectedUserId === "ALL"
                      ? `👥 All Employees (${employees.length})`
                      : (selectedEmployee?.name ?? "Select employee")}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end" className="max-h-[320px]">
              <SelectItem value="ALL" className="font-semibold text-primary">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>All Employees (Combined Overview)</span>
                </div>
              </SelectItem>
              {employees.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                      Individual Team Members
                    </SelectLabel>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center gap-2 py-0.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={emp.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {emp.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{emp.name}</span>
                          {emp.designation && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              · {emp.designation}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedUserId === "ALL" ? (
        <ManagerCombinedAnalytics
          employees={employees}
          onSelectEmployee={(id) => setSelectedUserId(id)}
        />
      ) : (
        <IndividualEmployeeAnalytics
          employee={selectedEmployee}
          userId={selectedUserId}
          onBackToAll={() => setSelectedUserId("ALL")}
        />
      )}
    </div>
  );
}

/* =======================================================================
   MANAGER: COMBINED TEAM ANALYTICS
   ======================================================================= */

function ManagerCombinedAnalytics({
  employees,
  onSelectEmployee,
}: {
  employees: EmployeeRow[];
  onSelectEmployee: (id: string) => void;
}) {
  const { data: teamData, isLoading: loadingTeam } = useTeamAnalytics();
  const { data: weeklyData, isLoading: loadingWeekly } = useWeeklyAnalytics("ALL");
  const { data: monthlyData, isLoading: loadingMonthly } = useMonthlyAnalytics("ALL");

  const isLoading = loadingTeam || loadingWeekly || loadingMonthly;

  if (isLoading) return <AnalyticsSkeleton count={6} />;

  return (
    <div className="space-y-6">
      {/* Top Combined Team Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Team Size"
          value={teamData?.headcount ?? employees.length}
          icon={Users}
          subtitle="Active team members"
        />
        <StatCard
          title="Goals Completed (Month)"
          value={monthlyData?.goalsCompleted ?? 0}
          icon={CheckCircle2}
          subtitle={`${monthlyData?.goalsAssigned ?? 0} assigned this month`}
        />
        <StatCard
          title="Completed This Week"
          value={weeklyData?.completed ?? 0}
          icon={TrendingUp}
          subtitle={`${weeklyData?.completionRate ?? 0}% weekly completion rate`}
        />
        <StatCard
          title="Team Avg Review Score"
          value={
            monthlyData?.avgReviewScore
              ? `${monthlyData.avgReviewScore.toFixed(1)} / 5`
              : "—"
          }
          icon={Gauge}
          subtitle={`${monthlyData?.reviewsGenerated ?? 0} reviews generated`}
        />
      </div>

      {/* Tabs for Combined Views */}
      <Tabs defaultValue="directory" className="space-y-4">
        <TabsList className="bg-muted/80 p-1">
          <TabsTrigger value="directory" className="gap-1.5">
            <Users className="h-3.5 w-3.5" /> Team Members Directory
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Weekly Aggregates
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Monthly Aggregates
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Team Overview &amp; Trends
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Team Members Directory */}
        <TabsContent value="directory" className="space-y-4">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Team Members Directory</CardTitle>
              <CardDescription>Click any employee below to view their detailed performance charts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp.id)}
                    className="flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={emp.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-xs font-semibold">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {emp.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {emp.designation || "Engineer"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>

                    <div className="mt-4 space-y-2 pt-3 border-t border-border/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Goals Completed</span>
                        <span className="font-medium">
                          {emp.completedGoals} / {emp.totalGoals} ({emp.completionPct}%)
                        </span>
                      </div>
                      <Progress value={emp.completionPct} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Avg Rating</span>
                        <span className="font-semibold text-primary">
                          {emp.avgRating ? `${emp.avgRating.toFixed(1)} / 5` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Weekly Combined */}
        <TabsContent value="weekly" className="space-y-4">
          {weeklyData && (
            <>
              <p className="text-sm text-muted-foreground font-medium">{weeklyData.period}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Team Goals Assigned" value={weeklyData.assigned} icon={ClipboardList} />
                <StatCard title="Team Completed" value={weeklyData.completed} icon={CheckCircle2} />
                <StatCard
                  title="Team Pending / Blocked"
                  value={`${weeklyData.pending} / ${weeklyData.blocked}`}
                  icon={Pause}
                />
                <StatCard
                  title="Overall Completion"
                  value={`${weeklyData.completionRate}%`}
                  icon={TrendingUp}
                  subtitle={`${weeklyData.reviews} team reviews this week`}
                />
              </div>
              <Card className="rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Combined Team Completions Per Day</CardTitle>
                  <CardDescription>Total tasks closed across all employees this week</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData.perDaySeries}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="day" fontSize={12} tickLine={false} />
                      <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed Tasks"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.15)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab 3: Monthly Combined */}
        <TabsContent value="monthly" className="space-y-4">
          {monthlyData && (
            <>
              <p className="text-sm text-muted-foreground font-medium">{monthlyData.period}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Team Goals Assigned" value={monthlyData.goalsAssigned} icon={ClipboardList} />
                <StatCard title="Team Completed" value={monthlyData.goalsCompleted} icon={CheckCircle2} />
                <StatCard
                  title="Reviews Generated"
                  value={monthlyData.reviewsGenerated}
                  icon={AlarmClock}
                />
                <StatCard
                  title="Team Avg Review Score"
                  value={monthlyData.avgReviewScore ? monthlyData.avgReviewScore.toFixed(1) : "—"}
                  icon={Gauge}
                  subtitle={`${monthlyData.learningProgress} team learning items`}
                />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Completions Progression</CardTitle>
                    <CardDescription>Team tasks completed week by week this month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData.weeklySeries}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="week" fontSize={12} tickLine={false} />
                        <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                        <Tooltip />
                        <Bar
                          dataKey="completed"
                          name="Completed Goals"
                          fill="hsl(var(--primary))"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Team Goals by Status (All Time)</CardTitle>
                    <CardDescription>Current status breakdown across all team tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData.goalsByStatus} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" allowDecimals={false} fontSize={12} />
                        <YAxis dataKey="status" type="category" width={95} fontSize={12} tickLine={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Count"
                          fill="hsl(var(--primary))"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 4: Combined Overview & Team Comparisons */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Goal completion by member */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Goal Completion by Member</CardTitle>
                  <CardDescription>Completions this month per employee (click bar to view details)</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-72">
                {teamData && teamData.topPerformers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamData.topPerformers}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} />
                      <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                      <Tooltip />
                      <Bar
                        dataKey="completedThisMonth"
                        name="Completed Goals"
                        fill="hsl(var(--primary))"
                        radius={[6, 6, 0, 0]}
                        onClick={(data: any) => {
                          if (data?.id) onSelectEmployee(data.id);
                        }}
                        className="cursor-pointer"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No completion data available yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 6-Month Team Rating Trend */}
            <Card className="rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Team Performance Trend (6 Months)</CardTitle>
                <CardDescription>Average review rating progression</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {teamData && teamData.monthlyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={teamData.monthlyPerformance}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" fontSize={12} tickLine={false} />
                      <YAxis domain={[0, 5]} fontSize={12} tickLine={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="avgRating"
                        name="Avg Rating"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No rating trend data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =======================================================================
   INDIVIDUAL EMPLOYEE ANALYTICS VIEW
   ======================================================================= */

function IndividualEmployeeAnalytics({
  employee,
  userId,
  onBackToAll,
}: {
  employee?: EmployeeRow;
  userId: string;
  onBackToAll: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Employee Profile Card */}
      {employee && (
        <Card className="rounded-xl border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={employee.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-sm font-semibold">
                    {employee.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">{employee.name}</h3>
                    {employee.department && (
                      <Badge variant="outline" className="text-xs font-normal">
                        {employee.department.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {employee.designation ?? "Employee"} · {employee.email}
                  </p>
                </div>
              </div>

              {/* Quick Summary Metrics */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Goal Completion</p>
                  <p className="text-sm font-semibold">
                    {employee.completedGoals} / {employee.totalGoals} ({employee.completionPct}%)
                  </p>
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Avg Rating</p>
                  <p className="text-sm font-semibold">
                    {employee.avgRating ? `${employee.avgRating.toFixed(1)} / 5` : "—"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={onBackToAll} className="gap-1 text-xs">
                  <Users className="h-3.5 w-3.5" /> All Employees
                </Button>
              </div>
            </div>

            {/* Skills Badges */}
            {employee.skills && employee.skills.length > 0 && (
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/50">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Skills:</span>
                {employee.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px] font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scoped Weekly and Monthly Tabs for this Employee */}
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <WeeklySection userId={userId} />
        </TabsContent>
        <TabsContent value="monthly">
          <MonthlySection userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* =======================================================================
   STANDARD WEEKLY / MONTHLY SECTIONS (Reusable for both Employee & Manager)
   ======================================================================= */

function WeeklySection({ userId }: { userId?: string }) {
  const { data, isLoading } = useWeeklyAnalytics(userId);

  if (isLoading) return <AnalyticsSkeleton count={4} />;
  if (!data) return null;

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground font-medium">{data.period}</p>
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
          <CardDescription>Daily completed tasks distribution</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.perDaySeries}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
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

function MonthlySection({ userId }: { userId?: string }) {
  const { data, isLoading } = useMonthlyAnalytics(userId);

  if (isLoading) return <AnalyticsSkeleton count={4} />;
  if (!data) return null;

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground font-medium">{data.period}</p>
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
            <CardDescription>Goal completions by week this month</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklySeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" fontSize={12} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Goals by status (all time)</CardTitle>
            <CardDescription>Cumulative distribution across all statuses</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.goalsByStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis dataKey="status" type="category" width={90} fontSize={12} tickLine={false} />
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

function AnalyticsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 pt-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
