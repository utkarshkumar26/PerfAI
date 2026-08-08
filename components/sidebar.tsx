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
  Goal,
  Crosshair,
  Users,
  Bell,
  User,
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
  { label: "Goals", href: "/goals", icon: Goal },
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
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/50 backdrop-blur md:flex">
      <div className="flex h-14 items-center px-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          PerfAI
        </Link>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
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
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
