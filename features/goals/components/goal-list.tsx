"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { GoalWithUsers } from "../actions/use-goals";
import { GoalActions, priorityBadgeClass, STATUS_LABEL } from "./goal-card";

export function GoalList({
  goals,
  onEdit,
}: {
  goals: GoalWithUsers[];
  onEdit: (goal: GoalWithUsers) => void;
}) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <p className="text-sm text-muted-foreground">No goals match your filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Goal</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="w-40">Progress</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal) => (
            <TableRow key={goal.id}>
              <TableCell className="max-w-64">
                <div className="truncate font-medium">{goal.title}</div>
                {goal.description && (
                  <div className="truncate text-xs text-muted-foreground">
                    {goal.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {STATUS_LABEL[goal.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn("text-xs", priorityBadgeClass(goal.priority))}>
                  {goal.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {goal.category ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {goal.dueDate ? format(new Date(goal.dueDate), "MMM d, yyyy") : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={goal.progress} className="h-1.5 flex-1" />
                  <span className="w-8 text-right text-xs text-muted-foreground">
                    {goal.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={goal.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {goal.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{goal.user.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <GoalActions goal={goal} onEdit={() => onEdit(goal)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
