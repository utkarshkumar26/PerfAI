"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateEmployeeReview, usePolishReviewText, useUpdateReview, type ReviewWithUser } from "../actions/use-reviews";

type ReviewValues = {
  type: "MID_YEAR" | "FINAL_YEAR";
  period: string;
  rewards: string;
  certifications: string;
  bugsResolved: number;
  featuresEnhanced: number;
  achievedPoint1: string;
  achievedPoint2: string;
  learnedPoint1: string;
  learnedPoint2: string;
};

const emptyValues = (type: ReviewValues["type"]): ReviewValues => ({
  type, period: new Date().getFullYear().toString(), rewards: "", certifications: "",
  bugsResolved: 0, featuresEnhanced: 0, achievedPoint1: "", achievedPoint2: "", learnedPoint1: "", learnedPoint2: "",
});

export function ReviewFormDrawer({ open, onOpenChange, review, defaultType = "MID_YEAR" }: { open: boolean; onOpenChange: (open: boolean) => void; review?: ReviewWithUser | null; defaultType?: ReviewValues["type"] }) {
  const [values, setValues] = useState<ReviewValues>(emptyValues(defaultType));
  const create = useCreateEmployeeReview();
  const update = useUpdateReview();
  const polish = usePolishReviewText();

  useEffect(() => {
    const data = review?.input as Partial<ReviewValues> | undefined;
    setValues({ ...emptyValues((data?.type as ReviewValues["type"]) || defaultType), ...data, bugsResolved: Number(data?.bugsResolved ?? 0), featuresEnhanced: Number(data?.featuresEnhanced ?? 0) });
  }, [review, defaultType, open]);

  const set = (key: keyof ReviewValues, value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  const polishField = (key: keyof ReviewValues) => {
    const text = values[key];
    if (typeof text !== "string" || !text.trim()) return;
    polish.mutate(text, { onSuccess: (result) => set(key, result.text) });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (review) update.mutate({ id: review.id, employeeData: values, action: "SUBMIT" }, { onSuccess: () => onOpenChange(false) });
    else create.mutate(values, { onSuccess: () => onOpenChange(false) });
  };
  const busy = create.isPending || update.isPending;
  const text = (key: keyof ReviewValues, label: string, placeholder: string, required = false) => (
    <div className="space-y-1.5"><label className="text-sm font-medium">{label}{required && " *"}</label><Textarea required={required} value={String(values[key])} placeholder={placeholder} onChange={(event) => set(key, event.target.value)} /><Button type="button" variant="outline" size="sm" onClick={() => polishField(key)} disabled={polish.isPending || !String(values[key]).trim()}><Sparkles /> Polish with AI</Button></div>
  );

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>{review ? "Resubmit Review" : "Employee Review"}</SheetTitle><SheetDescription>Complete exactly two points in each objectives section before submitting.</SheetDescription></SheetHeader><form onSubmit={submit} className="space-y-5 px-4 pb-6">
    <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">Review type</label><select className="mt-1 h-9 w-full rounded-md border bg-background px-2 text-sm" value={values.type} onChange={(e) => set("type", e.target.value as ReviewValues["type"])}><option value="MID_YEAR">Mid-Year Review</option><option value="FINAL_YEAR">Final-Year Review</option></select></div><div><label className="text-sm font-medium">Year</label><Input value={values.period} onChange={(e) => set("period", e.target.value)} /></div></div>
    {text("rewards", "Rewards or recognitions", "List rewards or recognitions received")}{text("certifications", "Certifications completed", "List certifications completed")}
    <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium">Total bugs resolved</label><Input type="number" min="0" value={values.bugsResolved} onChange={(e) => set("bugsResolved", Number(e.target.value))} /></div><div><label className="text-sm font-medium">Total features enhanced</label><Input type="number" min="0" value={values.featuresEnhanced} onChange={(e) => set("featuresEnhanced", Number(e.target.value))} /></div></div>
    <fieldset className="space-y-3 rounded-lg border p-3"><legend className="px-1 text-sm font-semibold">What I achieved (exactly 2 points)</legend>{text("achievedPoint1", "Achievement Point 1", "Describe one accomplishment", true)}{text("achievedPoint2", "Achievement Point 2", "Describe another accomplishment", true)}</fieldset>
    <fieldset className="space-y-3 rounded-lg border p-3"><legend className="px-1 text-sm font-semibold">What I learned (exactly 2 points)</legend>{text("learnedPoint1", "Learning Point 1", "Describe one thing you learned", true)}{text("learnedPoint2", "Learning Point 2", "Describe another thing you learned", true)}</fieldset>
    <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{review ? "Resubmit Review" : "Submit Review"}</Button>
  </form></SheetContent></Sheet>;
}
