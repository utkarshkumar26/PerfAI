"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Kanban, LayoutList, Plus, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoals, type GoalFilters, type GoalWithUsers } from "../actions/use-goals";
import { KanbanBoard } from "./kanban-board";
import { GoalList } from "./goal-list";
import { GoalFormDialog } from "./goal-form-dialog";
import { AIGoalSuggestionDialog } from "./ai-suggestion-dialog";

export function GoalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: GoalFilters = {
    status: searchParams.get("status") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: Number(searchParams.get("page")) || 1,
    pageSize: 50,
  };
  const view = searchParams.get("view") ?? "board";

  const { data, isLoading } = useGoals(filters);
  const [editing, setEditing] = useState<GoalWithUsers | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get("new") === "1");
  const [aiOpen, setAiOpen] = useState(false);

  const setParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
    if (key !== "page") params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const goals = data?.goals ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.pagination.total} goals` : "Track and manage your goals"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?entity=goals", "_blank")}
          >
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles /> AI Suggestions
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> New goal
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            className="w-56 pl-8"
            defaultValue={filters.search}
            onChange={(e) => setParam("search", e.target.value || undefined)}
          />
        </div>
        <Select
          value={filters.status ?? ""}
          onValueChange={(v) => setParam("status", v || undefined)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="TODO">To do</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.priority ?? ""}
          onValueChange={(v) => setParam("priority", v || undefined)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Tabs value={view} onValueChange={(v) => setParam("view", v)}>
            <TabsList>
              <TabsTrigger value="board" aria-label="Kanban board">
                <Kanban /> Board
              </TabsTrigger>
              <TabsTrigger value="list" aria-label="List view">
                <LayoutList /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : view === "board" ? (
        <KanbanBoard
          goals={goals}
          onEdit={(g) => {
            setEditing(g);
            setFormOpen(true);
          }}
        />
      ) : (
        <GoalList
          goals={goals}
          onEdit={(g) => {
            setEditing(g);
            setFormOpen(true);
          }}
        />
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={filters.page! <= 1}
            onClick={() => setParam("page", String(filters.page! - 1))}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={filters.page! >= data.pagination.totalPages}
            onClick={() => setParam("page", String(filters.page! + 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        goal={editing}
      />
      <AIGoalSuggestionDialog open={aiOpen} onOpenChange={setAiOpen} />
    </div>
  );
}
