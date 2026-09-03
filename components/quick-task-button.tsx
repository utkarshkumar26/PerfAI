"use client";

import Link from "next/link";
import { Bug } from "lucide-react";

export function QuickTaskButton() {
  return (
    <Link
      href="/tasks?new=1"
      aria-label="Create a task"
      title="Create a task"
      className="fixed bottom-24 left-1 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-background bg-destructive text-white shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Bug className="h-4 w-4" />
    </Link>
  );
}