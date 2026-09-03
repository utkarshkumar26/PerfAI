import { Metadata } from "next";
import { GoalsPage } from "@/features/goals/components/goals-page";

export const metadata: Metadata = {
  title: "Tasks | PerfAI",
  description: "Manage, track, and assign engineering tasks and bug fixes with AI",
};

export default function TasksRoutePage() {
  return <GoalsPage />;
}
