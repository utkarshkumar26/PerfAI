import { Suspense } from "react";
import type { Metadata } from "next";
import { GoalsPage } from "@/features/goals/components/goals-page";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Tasks | PerfAI" };

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <GoalsPage />
    </Suspense>
  );
}

