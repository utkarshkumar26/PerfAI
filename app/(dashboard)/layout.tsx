import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/actions/session";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { QuickTaskButton } from "@/components/quick-task-button";

/**
 * Server-side auth guard for every dashboard route + app shell.
 * Role-scoped sections (e.g. /manager) gate in their own layouts.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <QuickTaskButton />
    </div>
  );
}
