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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReviews } from "../actions/use-reviews";
import { ReviewFormDrawer } from "./review-form";

const TYPES = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "MANUAL"] as const;

export function ReviewsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? undefined;

  const { data: reviews, isLoading } = useReviews({ type });
  const [drawerOpen, setDrawerOpen] = useState(searchParams.get("new") === "1");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Performance Reviews</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated reviews from your self-reported work
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={type ?? ""}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString());
              if (v) params.set("type", v);
              else params.delete("type");
              router.replace(`${pathname}?${params}`);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?entity=reviews", "_blank")}
          >
            Export CSV
          </Button>
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
            No reviews yet. Generate your first AI performance review.
          </p>
          <Button onClick={() => setDrawerOpen(true)} variant="outline" size="sm">
            <Plus /> Generate review
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

      <ReviewFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
