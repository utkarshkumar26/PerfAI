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
  Sparkles,
  Download,
  SlidersHorizontal,
  Settings2,
  FolderGit2,
  Bot,
  CircleDot,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Kanban,
  Maximize2,
  Trash2,
  Edit,
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
import { useSession } from "@/features/auth/actions/use-auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EmployeeTasksViewProps {
  tasks: GoalWithUsers[];
  onSelectTask: (task: GoalWithUsers) => void;
  onOpenCreateDialog: (defaultSection?: string) => void;
}

const SECTIONS = [
  { id: "ASSIGNED", label: "Assigned to me" },
  { id: "DOING", label: "Doing" },
  { id: "LATER", label: "Later" },
];

export function EmployeeTasksView({
  tasks,
  onSelectTask,
  onOpenCreateDialog,
}: EmployeeTasksViewProps) {
  const { data: currentUser } = useSession();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const [activeTab, setActiveTab] = useState("List");
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [customSections, setCustomSections] = useState<string[]>([]);
  const [newSectionName, setNewSectionName] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNumber = t.taskNumber?.toLowerCase().includes(q);
        const matchesProject = t.project?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNumber && !matchesProject) return false;
      }
      return true;
    });
  }, [tasks, search]);

  // Group by section
  const tasksBySection = useMemo(() => {
    const map: Record<string, GoalWithUsers[]> = {
      ASSIGNED: [],
      DOING: [],
      LATER: [],
    };
    customSections.forEach((s) => {
      map[s] = [];
    });

    filteredTasks.forEach((t) => {
      const sec = t.section || "ASSIGNED";
      if (!map[sec]) {
        map[sec] = [];
      }
      map[sec].push(t);
    });
    return map;
  }, [filteredTasks, customSections]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      setCustomSections((prev) => [...prev, newSectionName.trim()]);
      setNewSectionName("");
      setIsAddingSection(false);
    }
  };

  const handleQuickStatus = (
    task: GoalWithUsers,
    newStatus: "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    updateGoalMutation.mutate({
      id: task.id,
      status: newStatus,
      progress: newStatus === "COMPLETED" ? 100 : task.progress,
    });
  };

  const allSections = [
    ...SECTIONS,
    ...customSections.map((s) => ({ id: s, label: s })),
  ];

  return (
    <div className="space-y-4">
      {/* Top Header Card matching Image 2 */}
      <div className="border-b pb-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* My Tasks Title & View Tabs */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-foreground">My Tasks</h1>
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
              <button
                onClick={() => setActiveTab("List")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  activeTab === "List"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                List
              </button>
              <button
                onClick={() => setActiveTab("Timeline")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  activeTab === "Timeline"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("Kanban")}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                  activeTab === "Kanban"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Kanban
              </button>
            </div>
          </div>

          {/* Right Action Tools matching Image 2 */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-background shadow-none">
              <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
              My To-dos
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-background shadow-none">
              <Bot className="h-3.5 w-3.5 text-primary" />
              Agent Tasks
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs bg-background shadow-none">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              My Tasks Assistant
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs bg-background shadow-none">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs bg-background shadow-none">
              <Columns className="h-3.5 w-3.5 text-muted-foreground" />
              Columns
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs bg-background shadow-none">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              Rules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/export?entity=goals", "_blank")}
              className="h-8 gap-1 text-xs bg-background shadow-none"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-bar: Task Count & Find Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? "Task" : "Tasks"}
          </span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find..."
              className="h-8 w-56 pl-8 text-xs bg-background"
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onOpenCreateDialog()}
          className="h-8 gap-1.5 text-xs font-semibold shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Task
        </Button>
      </div>

      {/* Main Task List with Collapsible Sections matching Image 2 */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-5 flex items-center gap-1.5 pl-6">
            <span>Title</span>
          </div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1">Start Date</div>
          <div className="col-span-1">Target Date</div>
          <div className="col-span-1">Project</div>
          <div className="col-span-1 text-right">Creator</div>
        </div>

        {/* Sections Stream */}
        <div className="divide-y divide-border">
          {allSections.map((sec) => {
            const isCollapsed = !!collapsedSections[sec.id];
            const secTasks = tasksBySection[sec.id] || [];

            return (
              <div key={sec.id} className="bg-background">
                {/* Section Accordion Header matching Image 2 */}
                <div
                  onClick={() => toggleSection(sec.id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 hover:bg-muted/40 cursor-pointer select-none transition-colors"
                >
                  <button className="text-muted-foreground hover:text-foreground">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  <span className="font-bold text-xs text-foreground">
                    {sec.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {secTasks.length} {secTasks.length === 1 ? "task" : "tasks"}
                  </span>
                </div>

                {/* Section Task Rows */}
                {!isCollapsed && (
                  <div>
                    {secTasks.map((t) => {
                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="grid grid-cols-12 gap-2 items-center px-4 py-2 border-t hover:bg-muted/40 cursor-pointer transition-colors text-xs group"
                        >
                          {/* Title & Checkbox */}
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
                                "font-medium text-foreground truncate group-hover:underline",
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

                          {/* Progress Pill matching Image 2 */}
                          <div className="col-span-2 flex items-center gap-1.5">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1",
                                t.status === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : t.status === "IN_PROGRESS"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : t.status === "BLOCKED"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                              )}
                            >
                              {t.status === "IN_PROGRESS" && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              )}
                              {t.status === "COMPLETED"
                                ? "Closed"
                                : t.status === "IN_PROGRESS"
                                ? "In Progress"
                                : t.status === "BLOCKED"
                                ? "Blocked"
                                : "Planned"}
                            </span>
                          </div>

                          {/* Priority Pill matching Image 2 */}
                          <div className="col-span-1">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-semibold",
                                t.priority === "CRITICAL"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : t.priority === "HIGH"
                                  ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                  : t.priority === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              )}
                            >
                              {t.priority}
                            </span>
                          </div>

                          {/* Start Date */}
                          <div className="col-span-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 opacity-60" />
                            <span>{t.startDate ? format(new Date(t.startDate), "M/d/yyyy") : "8/25/2026"}</span>
                          </div>

                          {/* Target Date */}
                          <div className="col-span-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 opacity-60" />
                            <span>{t.dueDate ? format(new Date(t.dueDate), "M/d/yyyy") : "9/8/2026"}</span>
                          </div>

                          {/* Project matching Image 2 */}
                          <div className="col-span-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            <FolderGit2 className="h-3 w-3 text-blue-500 shrink-0" />
                            <span className="truncate">{t.project || "Build People"}</span>
                          </div>

                          {/* Creator matching Image 2 */}
                          <div className="col-span-1 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
                            <Avatar className="h-4 w-4 shrink-0">
                              <AvatarImage src={t.assignedBy?.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[8px] bg-secondary">
                                {(t.assignedBy?.name || "M").slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[80px]">
                              {t.assignedBy?.name || "Manager"}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* + Create Task Button under section matching Image 2 */}
                    <div className="px-4 py-2 pl-10 border-t">
                      <button
                        onClick={() => onOpenCreateDialog(sec.id)}
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

        {/* + Create Section at the bottom of the table matching Image 2 */}
        <div className="border-t px-4 py-3 bg-muted/10">
          {isAddingSection ? (
            <div className="flex items-center gap-2 max-w-sm">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name (e.g. Next Sprint, Backlog)..."
                className="h-8 text-xs bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                  if (e.key === "Escape") setIsAddingSection(false);
                }}
              />
              <Button size="sm" onClick={handleAddSection} className="h-8 text-xs">
                Add
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingSection(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingSection(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Section</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
