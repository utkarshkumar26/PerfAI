import type { Metadata } from "next";
import { CareerPage } from "@/features/career/components/career-page";

export const metadata: Metadata = { title: "Career Advisor" };

export default function Page() {
  return <CareerPage />;
}
