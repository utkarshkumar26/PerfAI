"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/actions/use-auth";
import { usePolishReviewText, useReview, useUpdateReview } from "../actions/use-reviews";

const statusLabels: Record<string, string> = {
  DRAFT: "Draft", PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected",
  MODIFICATION_REQUIRED: "Modification Required",
};

type ReviewData = Record<string, string | number>;
type Comment = { authorName: string; text: string };
type Evaluation = {
  annualPerformance: string;
  overallPerformanceFeedback: string;
  finalAppraisal: string;
  incrementEligibility: string;
  performanceEligibility: string;
};

export function ReviewDetailPage({ id }: { id: string }) {
  const { data: user } = useSession();
  const { data: review, isLoading } = useReview(id);
  const update = useUpdateReview();
  const polish = usePolishReviewText();
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation>({ annualPerformance: "", overallPerformanceFeedback: "", finalAppraisal: "", incrementEligibility: "", performanceEligibility: "" });
  const [evaluationLoaded, setEvaluationLoaded] = useState(false);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!review) return <div className="py-20 text-center text-sm text-muted-foreground">Review not found.</div>;

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  const data = (review.input ?? {}) as ReviewData;
  const comments = Array.isArray(review.comments) ? (review.comments as Comment[]) : [];
  const loadEvaluation = () => {
    if (!evaluationLoaded) {
      setEvaluation({ annualPerformance: review.annualPerformance ?? "", overallPerformanceFeedback: review.overallPerformanceFeedback ?? "", finalAppraisal: review.finalAppraisal ?? "", incrementEligibility: review.incrementEligibility ?? "", performanceEligibility: review.performanceEligibility ?? "" });
      setEvaluationLoaded(true);
    }
  };
  const action = (name: "APPROVE" | "REJECT" | "REQUEST_MODIFICATION" | "COMMENT") => {
    update.mutate({ id, action: name, comment: comment.trim() || undefined, ...(evaluationLoaded ? evaluation : {}) }, { onSuccess: () => setComment("") });
  };
  const polishComment = () => {
    if (comment.trim()) polish.mutate(comment, { onSuccess: (result) => setComment(result.text) });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Button variant="ghost" size="sm" onClick={() => router.push("/reviews")}><ArrowLeft /> Back to reviews</Button>
      <Card>
        <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>{review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review</CardTitle><p className="text-sm text-muted-foreground">{review.user.name} · Submitted {format(new Date(review.submittedAt ?? review.createdAt), "PPP")}</p></div><Badge>{statusLabels[review.status] ?? review.status}</Badge></div></CardHeader>
        <CardContent className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2"><Info label="Rewards / recognitions" value={String(data.rewards ?? "None provided")} /><Info label="Certifications" value={String(data.certifications ?? "None provided")} /><Info label="Bugs resolved" value={String(data.bugsResolved ?? 0)} /><Info label="Features enhanced" value={String(data.featuresEnhanced ?? 0)} /></section>
          <Points title="What I achieved" values={[String(data.achievedPoint1 ?? ""), String(data.achievedPoint2 ?? "")]} />
          <Points title="What I learned" values={[String(data.learnedPoint1 ?? ""), String(data.learnedPoint2 ?? "")]} />
          {comments.length > 0 && <section className="space-y-2"><h3 className="text-sm font-semibold">Manager comments</h3>{comments.map((item, index) => <div key={`${item.authorName}-${index}`} className="rounded-lg border bg-muted/30 p-3 text-sm"><p className="font-medium">{item.authorName}</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.text}</p></div>)}</section>}
          {!isManager && (review.status === "MODIFICATION_REQUIRED" || review.status === "REJECTED" || review.status === "DRAFT") && <Button onClick={() => router.push(`/reviews?edit=${review.id}`)}>Edit and resubmit</Button>}
          {isManager && <ManagerActions comment={comment} setComment={setComment} evaluation={evaluation} setEvaluation={setEvaluation} loadEvaluation={loadEvaluation} action={action} polishComment={polishComment} busy={update.isPending || polish.isPending} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function Points({ title, values }: { title: string; values: string[] }) {
  return <section><h3 className="mb-2 text-sm font-semibold">{title}</h3><ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{values.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}</ul></section>;
}

function ManagerActions({ comment, setComment, evaluation, setEvaluation, loadEvaluation, action, polishComment, busy }: { comment: string; setComment: (value: string) => void; evaluation: Evaluation; setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>; loadEvaluation: () => void; action: (name: "APPROVE" | "REJECT" | "REQUEST_MODIFICATION" | "COMMENT") => void; polishComment: () => void; busy: boolean }) {
  return <section className="space-y-4 border-t pt-5"><h2 className="text-lg font-semibold">Manager Evaluation</h2><p className="text-sm text-muted-foreground">This section is visible only to managers.</p><div className="grid gap-3 sm:grid-cols-2"><Input placeholder="Annual Performance" value={evaluation.annualPerformance} onFocus={loadEvaluation} onChange={(e) => setEvaluation({ ...evaluation, annualPerformance: e.target.value })} /><Input placeholder="Final Appraisal" value={evaluation.finalAppraisal} onFocus={loadEvaluation} onChange={(e) => setEvaluation({ ...evaluation, finalAppraisal: e.target.value })} /><Input placeholder="Increment Eligibility" value={evaluation.incrementEligibility} onFocus={loadEvaluation} onChange={(e) => setEvaluation({ ...evaluation, incrementEligibility: e.target.value })} /><Input placeholder="Performance Eligibility" value={evaluation.performanceEligibility} onFocus={loadEvaluation} onChange={(e) => setEvaluation({ ...evaluation, performanceEligibility: e.target.value })} /></div><Textarea placeholder="Overall performance feedback" value={evaluation.overallPerformanceFeedback} onFocus={loadEvaluation} onChange={(e) => setEvaluation({ ...evaluation, overallPerformanceFeedback: e.target.value })} /><Textarea placeholder="Manager comment or decision reason" value={comment} onChange={(e) => setComment(e.target.value)} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={polishComment} disabled={busy || !comment.trim()}><Sparkles /> Polish with AI</Button><Button type="button" onClick={() => action("APPROVE")} disabled={busy}>Approve</Button><Button type="button" variant="destructive" onClick={() => action("REJECT")} disabled={busy}>Reject</Button><Button type="button" variant="outline" onClick={() => action("REQUEST_MODIFICATION")} disabled={busy}>Request Modification</Button><Button type="button" variant="ghost" onClick={() => action("COMMENT")} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Add Comment</Button></div></section>;
}
