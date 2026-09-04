"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { careerRequestSchema } from "../validations/career.schema";
import { useGenerateCareerAdvice } from "../actions/use-career";

type FormValues = import("zod").infer<typeof careerRequestSchema>;

const TYPES = [
  { value: "ROADMAP", label: "Career Roadmap" },
  { value: "SKILL_GAP", label: "Skill Gap Analysis" },
  { value: "PROMOTION", label: "Promotion Readiness" },
  { value: "LEARNING", label: "Learning Plan" },
  { value: "SALARY", label: "Salary Growth" },
] as const;

export function CareerFormDialog({
  open,
  onOpenChange,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (id: string) => void;
}) {
  const generate = useGenerateCareerAdvice();

  const form = useForm<FormValues>({
    resolver: zodResolver(careerRequestSchema) as never,
    mode: "onBlur",
    defaultValues: {
      type: "ROADMAP",
      currentRole: "",
      experience: 1,
      skills: [],
      targetRole: "",
      notes: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    generate.mutate(
      { ...values, targetRole: values.targetRole || undefined, notes: values.notes || undefined },
      {
        onSuccess: (suggestion) => {
          onOpenChange(false);
          onGenerated(suggestion.id);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Career Advisor
          </DialogTitle>
          <DialogDescription>
            Choose the guidance you need and tell the advisor about yourself.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guidance type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current role</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
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
            </div>
            <FormField
              control={form.control}
              name="targetRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target role (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, Node.js, SQL"
                      value={field.value.join(", ")}
                      onChange={(e) => {
                        const input = e.target.value;
                        const skills = input
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        field.onChange(skills);
                      }}
                      onBlur={(e) => {
                        const input = e.target.value;
                        const skills = input
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        field.onChange(skills);
                        field.onBlur();
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional context (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Anything else the advisor should know..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={generate.isPending}>
              {generate.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {generate.isPending ? "Generating..." : "Generate guidance"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
