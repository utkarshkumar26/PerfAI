"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoals, type GoalFilters, type GoalWithUsers } from "../actions/use-goals";
import { useSession } from "@/features/auth/actions/use-auth";
import { ManagerTasksView } from "./manager-tasks-view";
import { EmployeeTasksView } from "./employee-tasks-view";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { TaskCreateDialog } from "./task-create-dialog";
import { AIGoalSuggestionDialog } from "./ai-suggestion-dialog";
import { Users, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoalsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: user, isLoading: loadingSession } = useSession();

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";

  // Manager can toggle between "Team Overview" and "My Personal Tasks"
  const [managerActiveView, setManagerActiveView] = useState<"team" | "my_tasks">("team");

  const filters: GoalFilters = {
    search: searchParams.get("search") ?? undefined,
    pageSize: 100,
  };

  const { data, isLoading } = useGoals(filters);
  const [selectedTask, setSelectedTask] = useState<GoalWithUsers | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(searchParams.get("new") === "1");
  const [createForUserId, setCreateForUserId] = useState<string | undefined>(undefined);
  const [createDefaultSection, setCreateDefaultSection] = useState<string>("ASSIGNED");
  const [aiOpen, setAiOpen] = useState(false);

  const allTasks = data?.goals ?? [];
  const linkedTaskId = searchParams.get("task");
  const linkedTask = linkedTaskId
    ? allTasks.find((goal) => goal.id === linkedTaskId) ?? null
    : null;

  // Filter tasks if manager switches to "My Tasks"
  const displayTasks =
    isManager && managerActiveView === "my_tasks"
      ? allTasks.filter((t) => t.userId === user?.id)
      : allTasks;

  const handleOpenTask = (task: GoalWithUsers) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleCreateForUser = (userId: string) => {
    setCreateForUserId(userId);
    setCreateDialogOpen(true);
  };

  const handleOpenCreate = (section?: string) => {
    setCreateForUserId(undefined);
    setCreateDefaultSection(section || "ASSIGNED");
    setCreateDialogOpen(true);
  };

  if (isLoading || loadingSession) {
    return (
      <div className="tasks-page space-y-5">
        <Skeleton className="h-14 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page space-y-5">
      {/* Manager View Switcher Tab (Only shown to managers) */}
      {isManager && (
        <div className="tasks-view-switcher flex items-center justify-end">
          <div className="tasks-view-switcher-control flex items-center gap-1 bg-muted p-1 rounded-lg border text-xs">
            <button
              onClick={() => setManagerActiveView("team")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors",
                managerActiveView === "team"
                  ? "tasks-view-switcher-active bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Team Overview (Manager View)
            </button>
            <button
              onClick={() => setManagerActiveView("my_tasks")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-colors",
                managerActiveView === "my_tasks"
                  ? "tasks-view-switcher-active bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserIcon className="h-3.5 w-3.5" />
              My Tasks
            </button>
          </div>
        </div>
      )}

      {/* Render View: If manager viewing team -> ManagerTasksView (Image 1); Else -> EmployeeTasksView (Image 2) */}
      {isManager && managerActiveView === "team" ? (
        <ManagerTasksView
          tasks={allTasks}
          onSelectTask={handleOpenTask}
          onCreateTaskForUser={handleCreateForUser}
          onOpenCreateDialog={() => handleOpenCreate()}
        />
      ) : (
        <EmployeeTasksView
          tasks={displayTasks}
          onSelectTask={handleOpenTask}
          onOpenCreateDialog={(section) => handleOpenCreate(section)}
        />
      )}

      {/* Rich Task Detail Drawer (Image 3) */}
      <TaskDetailDrawer
        task={selectedTask ?? linkedTask}
        open={drawerOpen || Boolean(linkedTask)}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setSelectedTask(null);
            if (searchParams.has("task")) {
              router.replace("/tasks");
            }
          }
        }}
      />

      {/* Task Creation Dialog */}
      <TaskCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultUserId={createForUserId}
        defaultSection={createDefaultSection}
      />

      {/* AI Suggestion Dialog */}
      <AIGoalSuggestionDialog open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
