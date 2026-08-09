import type { Metadata } from "next";
import { AnalyticsPage } from "@/features/analytics/components/analytics-page";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return <AnalyticsPage />;
}
