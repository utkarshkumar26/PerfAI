"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Goal,
  Crosshair,
  ClipboardList,
  Compass,
  MessageSquare,
  BarChart3,
  Target,
  Bell,
  User,
  LogOut,
  Download,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLogout } from "@/features/auth/actions/use-auth";

const PAGES = [
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

interface SearchResults {
  goals: { id: string; title: string; href: string }[];
  reviews: { id: string; period: string; href: string }[];
  objectives: { id: string; title: string; href: string }[];
  chats: { id: string; title: string | null; href: string }[];
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const logout = useLogout();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results, isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: async (): Promise<SearchResults> => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
      const json = await res.json();
      return json.data;
    },
    enabled: debounced.length >= 2,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  const hasResults =
    results &&
    (results.goals.length > 0 ||
      results.reviews.length > 0 ||
      results.objectives.length > 0 ||
      results.chats.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isFetching && debounced.length >= 2 && (
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
          </div>
        )}
        <CommandEmpty>No results found.</CommandEmpty>

        {hasResults && results!.goals.length > 0 && (
          <CommandGroup heading="Goals">
            {results!.goals.map((g) => (
              <CommandItem key={g.id} onSelect={() => go(g.href)}>
                <Goal className="mr-2 h-4 w-4" />
                {g.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hasResults && results!.reviews.length > 0 && (
          <CommandGroup heading="Reviews">
            {results!.reviews.map((r) => (
              <CommandItem key={r.id} onSelect={() => go(r.href)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Review — {r.period}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hasResults && results!.objectives.length > 0 && (
          <CommandGroup heading="OKRs">
            {results!.objectives.map((o) => (
              <CommandItem key={o.id} onSelect={() => go(o.href)}>
                <Crosshair className="mr-2 h-4 w-4" />
                {o.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {hasResults && results!.chats.length > 0 && (
          <CommandGroup heading="Chats">
            {results!.chats.map((c) => (
              <CommandItem key={c.id} onSelect={() => go(c.href)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                {c.title ?? "Untitled conversation"}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {debounced.length < 2 && (
          <>
            <CommandGroup heading="Pages">
              {PAGES.map((p) => (
                <CommandItem key={p.href} onSelect={() => go(p.href)}>
                  <p.icon className="mr-2 h-4 w-4" />
                  {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={() => go("/goals?new=1")}>Create new goal</CommandItem>
              <CommandItem onSelect={() => go("/reviews?new=1")}>Generate review</CommandItem>
              <CommandItem
                onSelect={() => {
                  onOpenChange(false);
                  window.open("/api/export?entity=goals", "_blank");
                }}
              >
                <Download className="mr-2 h-4 w-4" /> Export goals CSV
              </CommandItem>
              <CommandItem onSelect={() => logout.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
