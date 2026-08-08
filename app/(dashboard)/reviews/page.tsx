import { Suspense } from "react";
import type { Metadata } from "next";
import { ReviewsPage } from "@/features/reviews/components/reviews-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Reviews" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <ReviewsPage />
    </Suspense>
  );
}
