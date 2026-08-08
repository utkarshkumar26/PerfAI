"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  aiGoalSuggestionSchema,
  type AIGoalSuggestionInput,
} from "../validations/goal.schema";
import { useAIGoalSuggestions, useCreateGoal } from "../actions/use-goals";

export function AIGoalSuggestionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const suggest = useAIGoalSuggestions();
  const createGoal = useCreateGoal();

  const form = useForm<AIGoalSuggestionInput>({
    resolver: zodResolver(aiGoalSuggestionSchema),
    defaultValues: { role: "", experience: 1, skills: [], careerGoal: "" },
  });

  const data = suggest.data;

  const addGoal = (g: NonNullable<typeof data>["goals"][number]) => {
    createGoal.mutate({
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: "TODO",
      progress: 0,
      category: g.category,
      dueDate: addDays(new Date(), g.timelineDays),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Goal Suggestions
          </DialogTitle>
          <DialogDescription>
            Describe your role and ambitions — get tailored goals, tasks and a learning plan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => suggest.mutate(values))}
            className="grid gap-4 sm:grid-cols-2"
          >
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current role</FormLabel>
                  <FormControl>
                    <Input placeholder="Frontend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience (years)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Skills (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, TypeScript, Node.js"
                      value={field.value.join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="careerGoal"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Career goal</FormLabel>
                  <FormControl>
                    <Input placeholder="Become a senior engineer in 18 months" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={suggest.isPending}>
                {suggest.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Sparkles />
                )}
                Generate suggestions
              </Button>
            </div>
          </form>
        </Form>

        {data && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{data.summary}</p>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Recommended goals</h4>
              {data.goals.map((g, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{g.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {g.priority}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        ~{g.timelineDays} days
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{g.description}</p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label="Add goal"
                    onClick={() => addGoal(g)}
                    disabled={createGoal.isPending}
                  >
                    <Plus />
                  </Button>
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <SuggestionList title="Weekly tasks" items={data.weeklyTasks} />
              <SuggestionList title="Monthly tasks" items={data.monthlyTasks} />
              <SuggestionList title="Learning plan" items={data.learningPlan} />
              <SuggestionList title="Certifications" items={data.certifications} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuggestionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}
