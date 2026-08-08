"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Star, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useDeleteReview, useReview, useUpdateReview } from "../actions/use-reviews";

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewDetailPage({ id }: { id: string }) {
  const { data: review, isLoading } = useReview(id);
  const update = useUpdateReview();
  const del = useDeleteReview();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;
  if (!review) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Review not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push("/reviews")}>
          <ArrowLeft /> Back to reviews
        </Button>
        <div className="flex gap-2">
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDraft(review.content);
                setEditing(true);
              }}
            >
              <Pencil /> Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete this review?")) {
                del.mutate(review.id, { onSuccess: () => router.push("/reviews") });
              }
            }}
          >
            <Trash2 /> Delete
          </Button>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl">{review.period} Review</CardTitle>
              <CardDescription>
                {review.type} · Generated {format(new Date(review.createdAt), "PPP")}
                {review.aiGenerated && " · AI Generated"}
              </CardDescription>
            </div>
            {review.rating && (
              <Badge className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Star className="h-3.5 w-3.5 fill-current" />
                {review.rating.toFixed(1)} / 5
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {editing ? (
            <div className="space-y-2">
              <Textarea
                rows={14}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate(
                      { id: review.id, content: draft },
                      { onSuccess: () => setEditing(false) }
                    )
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{review.content}</ReactMarkdown>
            </div>
          )}

          <Separator />
          <div className="grid gap-6 sm:grid-cols-2">
            <Section title="Strengths" items={review.strengths} />
            <Section title="Weaknesses" items={review.weaknesses} />
            <Section title="Growth areas" items={review.growthAreas} />
            {review.actionPlan && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold">Action plan</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {review.actionPlan}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
