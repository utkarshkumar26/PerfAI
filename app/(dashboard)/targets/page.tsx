import type { Metadata } from "next";
import { TargetsPage } from "@/features/analytics/components/targets-page";

export const metadata: Metadata = { title: "Targets" };

export default function Page() {
  return <TargetsPage />;
}
