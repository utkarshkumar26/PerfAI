"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { format } from "date-fns";
import { ClipboardList, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReview, useReviews } from "../actions/use-reviews";
import { ReviewFormDrawer } from "./review-form";
import { useSession } from "@/features/auth/actions/use-auth";
import { useManagerReviews } from "../actions/use-reviews";

export function ReviewsPage() {
  const { data: user } = useSession();
  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  if (isManager) return <ManagerReviewsPage />;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit") ?? "";

  const { data: reviews, isLoading } = useReviews({ type: undefined });
  const { data: editReview } = useReview(editId);
  const [drawerOpen, setDrawerOpen] = useState(searchParams.get("new") === "1");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Reviews</h1>
            <p className="text-sm text-muted-foreground">Submit and track your Mid-Year and Final-Year reviews.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus /> New review
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : reviews?.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No reviews yet. Submit your first review.
          </p>
            <Button onClick={() => setDrawerOpen(true)} variant="outline" size="sm">
            <Plus /> Start review
          </Button>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {reviews?.map((r) => (
            <motion.div
              key={r.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            >
              <Link href={`/reviews/${r.id}`}>
                <Card className="h-full rounded-xl shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {r.period}
                      <Badge variant="secondary" className="text-[10px]">
                        {r.type}
                      </Badge>
                    </div>
                    {r.rating && (
                      <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {r.rating.toFixed(1)}
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-3 text-sm text-muted-foreground">{r.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={r.user.avatarUrl ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {r.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {r.user.name}
                      </div>
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <ReviewFormDrawer
        open={drawerOpen || Boolean(editReview)}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open && editId) router.replace(pathname);
        }}
        review={editReview}
      />
    </div>
  );
}

function ManagerReviewsPage() {
  const { data: reviews, isLoading } = useManagerReviews();
  const groups = [
    ["PENDING", "Pending for Review"],
    ["APPROVED", "Completed / Approved Reviews"],
    ["REJECTED", "Rejected Reviews"],
    ["MODIFICATION_REQUIRED", "Modification Required"],
  ] as const;
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold tracking-tight">Employee Reviews</h1><p className="text-sm text-muted-foreground">Review submissions from your employees and record decisions.</p></div>{isLoading ? <Skeleton className="h-64 w-full rounded-xl" /> : <div className="grid gap-5 lg:grid-cols-2">{groups.map(([status, label]) => { const items = reviews?.filter((review) => review.status === status) ?? []; return <Card key={status}><CardHeader><div className="flex items-center justify-between"><h2 className="font-semibold">{label}</h2><Badge variant="secondary">{items.length}</Badge></div></CardHeader><CardContent className="space-y-2">{items.length === 0 ? <p className="text-sm text-muted-foreground">No reviews in this group.</p> : items.map((review) => <Link key={review.id} href={`/reviews/${review.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"><div><p className="font-medium">{review.user.name}</p><p className="text-xs text-muted-foreground">{review.type === "MID_YEAR" ? "Mid-Year" : "Final-Year"} Review</p></div><div className="text-right text-xs text-muted-foreground"><Badge variant="outline">{review.status}</Badge><p className="mt-1">{format(new Date(review.submittedAt ?? review.createdAt), "MMM d, yyyy")}</p></div></Link>)}</CardContent></Card>; })}</div>}</div>;
}
