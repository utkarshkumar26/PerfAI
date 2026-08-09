import type { Metadata } from "next";
import { OkrsPage } from "@/features/okrs/components/okrs-page";

export const metadata: Metadata = { title: "OKRs" };

export default function Page() {
  return <OkrsPage />;
}
