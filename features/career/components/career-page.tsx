"use client";

import { useState } from "react";
import { format } from "date-fns";
import { BookOpen, Compass, DollarSign, LineChart as LineChartIcon, Plus, Route, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCareerSuggestion, useCareerSuggestions } from "../actions/use-career";
import { CareerFormDialog } from "./career-form-dialog";
import { SuggestionContent } from "./suggestion-content";

const TYPE_META: Record<string, { label: string; icon: typeof Route }> = {
  ROADMAP: { label: "Roadmap", icon: Route },
  SKILL_GAP: { label: "Skill Gap", icon: Target },
  PROMOTION: { label: "Promotion", icon: LineChartIcon },
  LEARNING: { label: "Learning Plan", icon: BookOpen },
  SALARY: { label: "Salary", icon: DollarSign },
};

export function CareerPage() {
  const { data: suggestions, isLoading } = useCareerSuggestions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: selected, isLoading: loadingDetail } = useCareerSuggestion(selectedId ?? "");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Career Advisor</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered roadmaps, skill gaps, promotion readiness and learning plans
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus /> New guidance
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* History list */}
        <Card className="rounded-xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Your guidance history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
            ) : suggestions?.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No guidance yet. Generate your first one.
              </div>
            ) : (
              suggestions?.map((s) => {
                const meta = TYPE_META[s.type];
                const Icon = meta?.icon ?? Compass;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                      selectedId === s.id && "border-primary bg-primary/5"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {s.summary ?? meta?.label ?? s.type}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(s.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {meta?.label ?? s.type}
                    </Badge>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Viewer */}
        <Card className="rounded-xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {selected
                ? (TYPE_META[selected.type]?.label ?? selected.type)
                : "Career Guidance"}
            </CardTitle>
            {selected && (
              <CardDescription>
                {format(new Date(selected.createdAt), "PPP")}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {loadingDetail ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : selected ? (
              <SuggestionContent
                content={JSON.parse(JSON.stringify(selected.content))}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Compass className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Select a past suggestion or generate new guidance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CareerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerated={(id) => setSelectedId(id)}
      />
    </div>
  );
}
