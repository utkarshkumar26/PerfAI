import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[13px] font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-semibold tracking-tight")}>{value}</div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
