"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  ClipboardList,
  Compass,
  MessageSquare,
  BarChart3,
  CheckSquare,
  Crosshair,
  Users,
  Bell,
  User,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/features/auth/actions/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "OKRs", href: "/okrs", icon: Crosshair },
  { label: "Reviews", href: "/reviews", icon: ClipboardList },
  { label: "Career", href: "/career", icon: Compass },
  { label: "AI Assistant", href: "/chat", icon: MessageSquare },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Targets", href: "/targets", icon: Target },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Profile", href: "/profile", icon: User },
];

const MANAGER_ITEM: NavItem = {
  label: "Team",
  href: "/manager",
  icon: Users,
  managerOnly: true,
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: user } = useSession();

  const items =
    user?.role === "MANAGER" || user?.role === "ADMIN"
      ? [...NAV_ITEMS, MANAGER_ITEM]
      : NAV_ITEMS;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Gauge className="h-4 w-4" />
        </div>
        <Link href="/dashboard" className="flex flex-col leading-none">
          <span className="text-base font-semibold tracking-tight">PerfAI</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">
            Performance Platform
          </span>
        </Link>
      </div>
      <Separator className="opacity-60" />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-primary/10"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border px-5 py-3">
        <p className="text-[11px] leading-snug text-muted-foreground">
          PerfAI — AI Performance Review &amp; Career Assistant
        </p>
      </div>
    </aside>
  );
}
