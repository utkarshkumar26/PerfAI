import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 p-4">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          PerfAI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI Performance Review &amp; Career Assistant
        </p>
      </div>
      <RegisterForm />
    </main>
  );
}
