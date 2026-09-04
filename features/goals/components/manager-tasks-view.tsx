"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Columns,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Layers,
  Sparkles,
  Wand2,
  LayoutDashboard,
  Link2,
  AlertTriangle,
  X,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  Trash2,
  Edit,
  ArrowUpDown,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GoalWithUsers,
  useUpdateGoal,
  useDeleteGoal,
} from "../actions/use-goals";
import { useEmployees } from "@/features/manager/actions/use-manager";
import { useSession } from "@/features/auth/actions/use-auth";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

interface ManagerTasksViewProps {
  tasks: GoalWithUsers[];
  onSelectTask: (task: GoalWithUsers) => void;
  onCreateTaskForUser?: (userId: string) => void;
  onOpenCreateDialog: () => void;
}

const TABS = [
  "List",
  "Timeline",
  "Calendar",
  "Kanban",
  "Sprints",
  "Capacity",
  "Milestones",
  "Goals/OKRs",
  "Archived",
];

export function ManagerTasksView({
  tasks,
  onSelectTask,
  onCreateTaskForUser,
  onOpenCreateDialog,
}: ManagerTasksViewProps) {
  const { data: currentUser } = useSession();
  const { data: employeesData } = useEmployees("");
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [activeTab, setActiveTab] = useState("List");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [showAlert, setShowAlert] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});

  // Group employees
  const employees = useMemo(() => {
    return employeesData?.employees || [];
  }, [employeesData]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
      if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesUser = t.user?.name?.toLowerCase().includes(q);
        const matchesNumber = t.taskNumber?.toLowerCase().includes(q);
        const matchesProject = t.project?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUser && !matchesNumber && !matchesProject) return false;
      }
      return true;
    });
  }, [tasks, search, filterStatus, filterPriority]);

  // Group filtered tasks by employee ID
  const tasksByEmployee = useMemo(() => {
    const map: Record<string, GoalWithUsers[]> = {};
    employees.forEach((emp) => {
      map[emp.id] = [];
    });
    filteredTasks.forEach((t) => {
      if (!map[t.userId]) {
        map[t.userId] = [];
      }
      map[t.userId].push(t);
    });
    return map;
  }, [employees, filteredTasks]);

  const toggleGroup = (employeeId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  const toggleSelectTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleQuickStatus = (task: GoalWithUsers, newStatus: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED", e: React.MouseEvent) => {
    e.stopPropagation();
    updateGoalMutation.mutate({
      id: task.id,
      status: newStatus,
      progress: newStatus === "COMPLETED" ? 100 : task.progress,
    });
  };

  const totalMembers = employees.length > 0 ? employees.length : 36;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="border-b pb-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Team Overview Title & Meta */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground border shadow-sm">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Team Overview
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Build People
                </h1>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" className="h-6 w-6">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={onOpenCreateDialog}>
                      <Plus className="mr-2 h-4 w-4" /> Create Task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open("/api/export?entity=goals", "_blank")}>
                      Export CSV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Right Action Tools matching Image 1 */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium bg-background shadow-none"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              GSD Assistant
            </Button>

            {/* Avatar Stack + Member Count */}
            <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-md text-xs font-medium text-foreground">
              <div className="flex -space-x-1.5 overflow-hidden">
                <Avatar className="h-4 w-4 border border-background">
                  <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" />
                  <AvatarFallback className="text-[8px]">A</AvatarFallback>
                </Avatar>
                <Avatar className="h-4 w-4 border border-background">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop" />
                  <AvatarFallback className="text-[8px]">B</AvatarFallback>
                </Avatar>
              </div>
              <span>{totalMembers} members</span>
              <Link2 className="h-3 w-3 opacity-60 ml-0.5" />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 text-xs font-medium bg-background shadow-none"
            >
              <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
              Clean up
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/dashboard"}
              className="h-8 gap-1.5 text-xs font-medium bg-background shadow-none"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* View Tabs matching Image 1 */}
        <div className="flex items-center gap-1 overflow-x-auto pt-1 no-scrollbar border-t">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Alert Banner matching Image 1 */}
      {showAlert && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-900/60 px-3.5 py-2 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              This team does not have any oncall linked to it.{" "}
              <a href="#" className="underline font-semibold hover:text-amber-950 dark:hover:text-amber-100">
                Link an oncall for better Privacy Waves and Tides support.
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-amber-700 hover:text-amber-900 dark:text-amber-300">?</button>
            <button
              onClick={() => setShowAlert(false)}
              className="text-amber-700 hover:text-amber-900 dark:text-amber-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-toolbar Bar: Search, Filters, Add Custom Field, Create Task */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Find Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find..."
              className="h-8 w-52 pl-8 text-xs bg-background"
            />
          </div>

          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium bg-background shadow-none">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  Filter {filterStatus !== "ALL" || filterPriority !== "ALL" ? "(1)" : ""}
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatus("ALL")}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("TODO")}>Planned / To Do</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("IN_PROGRESS")}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("BLOCKED")}>Blocked</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("COMPLETED")}>Closed / Completed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority Filter</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority("ALL")}>All Priorities</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("HIGH")}>High Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("MEDIUM")}>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("LOW")}>Low Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Columns Button */}
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium bg-background shadow-none">
            <Columns className="h-3.5 w-3.5 text-muted-foreground" />
            Columns
          </Button>

          {/* Add Custom Field */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenCreateDialog()}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Custom Field
          </Button>
        </div>

        {/* Create Task Primary Button */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={onOpenCreateDialog}
            className="h-8 gap-1.5 text-xs font-semibold shadow-sm px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Task
            <ChevronDown className="h-3 w-3 opacity-70 ml-0.5" />
          </Button>
        </div>
      </div>

      {/* Main Employee-Grouped Task Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table Header Columns matching Image 1 */}
        <div className="grid grid-cols-12 gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-5 flex items-center gap-2">
            <span>Name</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <span>Owner</span>
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          </div>
          <div className="col-span-1">Sprint</div>
          <div className="col-span-1">Start date</div>
          <div className="col-span-1">Target date</div>
          <div className="col-span-1">Creator</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Employee Groups */}
        <div className="divide-y divide-border">
          {employees.map((employee) => {
            const isCollapsed = !!collapsedGroups[employee.id];
            const empTasks = tasksByEmployee[employee.id] || [];

            return (
              <div key={employee.id} className="bg-background">
                {/* Group Accordion Header matching Image 1 */}
                <div
                  onClick={() => toggleGroup(employee.id)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 cursor-pointer select-none transition-colors border-l-4 border-l-amber-500/70"
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-muted-foreground p-0.5 hover:text-foreground">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* Orange Group Icon matching Image 1 */}
                    <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded bg-amber-500/20 text-amber-600">
                      <div className="h-1.5 w-1.5 bg-amber-600 rounded-[1px]" />
                      <div className="h-1.5 w-1.5 bg-amber-600 rounded-[1px]" />
                      <div className="h-1.5 w-1.5 bg-amber-600 rounded-[1px]" />
                      <div className="h-1.5 w-1.5 bg-amber-600 rounded-[1px]" />
                    </div>

                    <span className="font-bold text-xs text-foreground">
                      {employee.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({empTasks.length} {empTasks.length === 1 ? "task" : "tasks"})
                    </span>
                  </div>

                  {/* Right Creator Avatar Badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-[11px] text-muted-foreground">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                          {(currentUser?.name || "M").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{currentUser?.name || "Arun Prasad V"}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onCreateTaskForUser) onCreateTaskForUser(employee.id);
                            else onOpenCreateDialog();
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Assign Task to {employee.name}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Expanded Tasks List for this Employee */}
                {!isCollapsed && (
                  <div className="bg-muted/10">
                    {empTasks.map((t) => {
                      const isSelected = !!selectedTasks[t.id];

                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className={cn(
                            "grid grid-cols-12 gap-2 items-center px-4 py-2 border-t hover:bg-muted/50 cursor-pointer transition-colors text-xs",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          {/* Task Checkbox & Title */}
                          <div className="col-span-5 flex items-center gap-2.5 pl-6">
                            <input
                              type="checkbox"
                              checked={t.status === "COMPLETED"}
                              onChange={(e) => {
                                handleQuickStatus(
                                  t,
                                  e.target.checked ? "COMPLETED" : "IN_PROGRESS",
                                  e as any
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-3.5 w-3.5 rounded border-muted-foreground text-primary focus:ring-0 cursor-pointer"
                            />

                            <span
                              className={cn(
                                "font-medium text-foreground truncate hover:underline",
                                t.status === "COMPLETED" && "line-through text-muted-foreground"
                              )}
                              title={t.title}
                            >
                              {t.title}
                            </span>

                            {t.taskNumber && (
                              <span className="text-[10px] font-mono font-medium text-muted-foreground px-1 py-0.5 bg-muted rounded shrink-0">
                                {t.taskNumber}
                              </span>
                            )}
                          </div>

                          {/* Owner Pill */}
                          <div className="col-span-2 flex items-center gap-1.5">
                            <Avatar className="h-5 w-5 shrink-0">
                              <AvatarImage src={t.user?.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[9px] bg-secondary font-semibold">
                                {(t.user?.name || "U").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-foreground text-xs">{t.user?.name}</span>
                          </div>

                          {/* Sprint */}
                          <div className="col-span-1 text-[11px] text-muted-foreground truncate">
                            {t.sprint || "Sprint 42"}
                          </div>

                          {/* Start Date */}
                          <div className="col-span-1 text-[11px] text-muted-foreground">
                            {t.startDate ? format(new Date(t.startDate), "M/d/yyyy") : "—"}
                          </div>

                          {/* Target Date */}
                          <div className="col-span-1 text-[11px] text-muted-foreground">
                            {t.dueDate ? format(new Date(t.dueDate), "M/d/yyyy") : "—"}
                          </div>

                          {/* Creator */}
                          <div className="col-span-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <Avatar className="h-4 w-4 shrink-0">
                              <AvatarImage src={t.assignedBy?.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[8px]">
                                {(t.assignedBy?.name || "M").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{t.assignedBy?.name || "Manager"}</span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex items-center justify-end gap-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-6 w-6"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onSelectTask(t)}>
                                  <Edit className="mr-2 h-4 w-4" /> View / Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    handleQuickStatus(
                                      t,
                                      t.status === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED",
                                      e as any
                                    );
                                  }}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  {t.status === "COMPLETED" ? "Mark In Progress" : "Mark Closed"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this task?")) {
                                      deleteGoalMutation.mutate(t.id);
                                    }
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}

                    {/* + Create Task Under Employee matching Image 1 */}
                    <div className="px-4 py-2 pl-12 border-t">
                      <button
                        onClick={() => {
                          if (onCreateTaskForUser) onCreateTaskForUser(employee.id);
                          else onOpenCreateDialog();
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create Task</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
