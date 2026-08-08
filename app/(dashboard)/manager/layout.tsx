import { getSessionUser } from "@/features/auth/actions/session";

/**
 * Role guard example for manager-only sections. Wrapped in Suspense-friendly
 * server component; nested pages inherit the check via this layout.
 */
export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-muted-foreground">
            This area is restricted to managers.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
