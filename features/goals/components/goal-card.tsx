"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { GoalStatus, Priority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { GoalWithUsers } from "../actions/use-goals";
import { useDeleteGoal, useUpdateGoal } from "../actions/use-goals";

const STATUS_LABEL: Record<GoalStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  COMPLETED: "Completed",
};

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  MEDIUM: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  HIGH: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  CRITICAL: "bg-red-500/10 text-red-600 dark:text-red-300",
};

export function priorityBadgeClass(priority: Priority) {
  return PRIORITY_STYLES[priority];
}

export function GoalActions({ goal, onEdit }: { goal: GoalWithUsers; onEdit: () => void }) {
  const deleteGoal = useDeleteGoal();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Goal actions" />}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            if (confirm("Delete this goal? This cannot be undone.")) {
              deleteGoal.mutate(goal.id);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GoalCard({
  goal,
  onEdit,
}: {
  goal: GoalWithUsers;
  onEdit: () => void;
}) {
  const updateGoal = useUpdateGoal();

  const move = (status: GoalStatus) => updateGoal.mutate({ id: goal.id, status });

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{goal.title}</span>
        <GoalActions goal={goal} onEdit={onEdit} />
      </div>
      {goal.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{goal.description}</p>
      )}
      <Progress value={goal.progress} className="h-1" />
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className={cn("text-[10px]", priorityBadgeClass(goal.priority))}>
          {goal.priority}
        </Badge>
        {goal.category && (
          <Badge variant="outline" className="text-[10px]">
            {goal.category}
          </Badge>
        )}
        {goal.dueDate && (
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(goal.dueDate), "MMM d")}
          </span>
        )}
      </div>
      <select
        value={goal.status}
        onChange={(e) => move(e.target.value as GoalStatus)}
        className="w-full rounded-md border bg-transparent px-2 py-1 text-xs text-muted-foreground"
        aria-label="Change status"
        disabled={updateGoal.isPending}
      >
        {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </div>
  );
}

export { STATUS_LABEL };
