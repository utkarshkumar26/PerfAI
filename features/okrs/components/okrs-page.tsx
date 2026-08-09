"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSession } from "@/features/auth/actions/use-auth";
import {
  useCreateObjective,
  useDeleteObjective,
  useObjectives,
  useOkrAdvice,
  useUpdateKeyResult,
} from "../actions/use-okrs";

const LEVELS = ["COMPANY", "TEAM", "INDIVIDUAL"] as const;
type Level = (typeof LEVELS)[number];

const formSchema = z.object({
  title: z.string().min(3, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  level: z.enum(LEVELS),
  cycle: z.string().min(1),
  keyResults: z
    .array(
      z.object({
        title: z.string().min(3, "KR title required"),
        target: z.coerce.number().positive("Target must be > 0"),
        unit: z.string().optional(),
      })
    )
    .min(1, "Add at least one key result"),
});
type FormValues = z.infer<typeof formSchema>;

function currentCycle() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${q}`;
}

export function OkrsPage() {
  const [cycle, setCycle] = useState(currentCycle());
  const { data: objectives, isLoading } = useObjectives(cycle);
  const { data: user } = useSession();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">OKRs</h1>
          <p className="text-sm text-muted-foreground">
            Objectives and key results for {cycle}
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="2026-Q3"
            className="w-32"
          />
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> New objective
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : objectives?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No objectives for {cycle} yet.
          </p>
          <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
            <Plus /> Create objective
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives?.map((o) => (
            <ObjectiveCard
              key={o.id}
              objective={o}
              isOwner={o.ownerId === user?.id || user?.role !== "EMPLOYEE"}
            />
          ))}
        </div>
      )}

      <CreateObjectiveDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultCycle={cycle}
        isManager={user?.role !== "EMPLOYEE"}
      />
    </div>
  );
}

function ObjectiveCard({
  objective: o,
  isOwner,
}: {
  objective: ReturnType<typeof useObjectives>["data"] extends (infer T)[] | undefined ? T : never;
  isOwner: boolean;
}) {
  const updateKr = useUpdateKeyResult();
  const del = useDeleteObjective();
  const advice = useOkrAdvice();

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{o.title}</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{o.level}</Badge>
            {o.parent && (
              <span className="text-xs text-muted-foreground">↳ {o.parent.title}</span>
            )}
          </div>
          {o.description && (
            <p className="text-sm text-muted-foreground">{o.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            aria-label="AI advice"
            disabled={advice.isPending}
            onClick={() => advice.mutate(o.id)}
          >
            <Sparkles className={advice.isPending ? "animate-pulse" : ""} />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              aria-label="Delete objective"
              onClick={() => confirm("Delete this objective?") && del.mutate(o.id)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Achievement</span>
          <span className="font-medium">{o.achievement}%</span>
        </div>
        <Progress value={o.achievement} className="h-2" />
        <div className="space-y-2 pt-2">
          {o.keyResults.map((kr) => {
            const pct = kr.target === 0 ? 0 : Math.min(100, Math.round((kr.current / kr.target) * 100));
            return (
              <div key={kr.id} className="space-y-1 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{kr.title}</span>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {kr.current} / {kr.target} {kr.unit ?? ""}
                  </span>
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="h-7 w-20 text-xs"
                        defaultValue={kr.current}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v) && v !== kr.current) {
                            updateKr.mutate({ id: kr.id, current: v });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {advice.data && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="h-3 w-3" /> AI recommendation · {advice.data.health.replaceAll("_", " ")}
            </div>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {advice.data.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreateObjectiveDialog({
  open,
  onOpenChange,
  defaultCycle,
  isManager,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCycle: string;
  isManager: boolean;
}) {
  const create = useCreateObjective();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      title: "",
      description: "",
      level: "INDIVIDUAL",
      cycle: defaultCycle,
      keyResults: [{ title: "", target: 1, unit: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "keyResults" });

  const onSubmit = (values: FormValues) => {
    create.mutate(
      {
        title: values.title,
        description: values.description || undefined,
        level: values.level,
        cycle: values.cycle,
        keyResults: values.keyResults.map((kr) => ({
          title: kr.title,
          target: Number(kr.target),
          unit: kr.unit || undefined,
        })),
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New objective</DialogTitle>
          <DialogDescription>Define the objective and measurable key results.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Improve platform reliability" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVELS.filter((l) => isManager || l === "INDIVIDUAL").map((l) => (
                          <SelectItem key={l} value={l}>
                            {l.charAt(0) + l.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle</FormLabel>
                    <FormControl>
                      <Input placeholder="2026-Q3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>Key results</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ title: "", target: 1, unit: "" })}
                >
                  <Plus /> Add KR
                </Button>
              </div>
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-[1fr_90px_90px_36px] items-end gap-2 rounded-lg border p-2">
                  <FormField
                    control={form.control}
                    name={`keyResults.${idx}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="e.g. Reduce p95 latency" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`keyResults.${idx}.target`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" placeholder="Target" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`keyResults.${idx}.unit`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="ms / %" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove key result"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={create.isPending}>
              {create.isPending && <Loader2 className="animate-spin" />}
              Create objective
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
