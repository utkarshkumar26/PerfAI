"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { reviewInputSchema } from "../validations/review.schema";
import { useGenerateReview } from "../actions/use-reviews";

type FormValues = import("zod").infer<typeof reviewInputSchema>;
type ApiValues = import("zod").output<typeof reviewInputSchema>;

export function ReviewFormDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const generate = useGenerateReview();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(reviewInputSchema) as never,
    defaultValues: {
      period: new Date().toISOString().slice(0, 7),
      type: "MANUAL",
      achievements: "",
      challenges: "",
      projects: "",
      clientFeedback: "",
      skillsUsed: [],
      learning: "",
      leadership: "",
      collaboration: "",
    },
  });

  const onSubmit = (values: ApiValues) => {
    generate.mutate(values, {
      onSuccess: (review) => {
        onOpenChange(false);
        form.reset();
        router.push(`/reviews/${review.id}`);
      },
    });
  };

  const textField = (
    name: keyof FormValues,
    label: string,
    placeholder: string,
    rows = 2
  ) => (
    <FormField
      key={name}
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea rows={rows} placeholder={placeholder} value={(field.value as string) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generate AI Review
          </SheetTitle>
          <SheetDescription>
            Fill in your self-reported achievements and challenges — AI will write a
            professional review with strengths, growth areas and an action plan.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <FormControl>
                      <Input placeholder="2026-08 or 2026-W32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "MANUAL"] as const).map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0) + t.slice(1).toLowerCase()}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {textField("achievements", "Achievements *", "Delivered the payments migration ahead of schedule...", 3)}
            {textField("challenges", "Challenges & blockers", "Blockers, risks, unexpected complexity...")}
            {textField("projects", "Projects & tasks", "Key projects worked on this period...")}
            {textField("clientFeedback", "Client / stakeholder feedback", "Positive note from the design team about...")}

            <FormField
              control={form.control}
              name="skillsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills used (comma separated)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="React, SQL, a11y"
                      value={field.value.join(", ")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {textField("learning", "Learning & improvement", "Completed the TypeScript course, read...")}
            {textField("leadership", "Leadership & mentorship", "Mentored two junior engineers on...")}
            {textField("collaboration", "Collaboration", "Paired with QA to improve test coverage...")}

            <Button type="submit" className="w-full" disabled={generate.isPending}>
              {generate.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {generate.isPending ? "Generating..." : "Generate review"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

