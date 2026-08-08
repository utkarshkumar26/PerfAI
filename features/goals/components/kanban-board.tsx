"use client";

import type { GoalStatus } from "@prisma/client";
import type { GoalWithUsers } from "../actions/use-goals";
import { GoalCard, STATUS_LABEL } from "./goal-card";

const COLUMNS: GoalStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"];

export function KanbanBoard({
  goals,
  onEdit,
}: {
  goals: GoalWithUsers[];
  onEdit: (goal: GoalWithUsers) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="grid min-w-[900px] grid-cols-4 gap-4 pb-2">
        {COLUMNS.map((status) => {
          const columnGoals = goals.filter((g) => g.status === status);
          return (
            <div
              key={status}
              className="flex flex-col gap-2 rounded-xl bg-muted/40 p-2"
            >
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-sm font-medium">{STATUS_LABEL[status]}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {columnGoals.length}
                </span>
              </div>
              <div className="flex min-h-24 flex-col gap-2">
                {columnGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onEdit={() => onEdit(goal)} />
                ))}
                {columnGoals.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No goals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
