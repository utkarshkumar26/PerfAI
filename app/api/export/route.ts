import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const entity = request.nextUrl.searchParams.get("entity");
    if (!entity || !["goals", "reviews"].includes(entity)) {
      throw new ApiError(400, "entity must be goals or reviews");
    }
    const isManager = user.role === "MANAGER" || user.role === "ADMIN";
    const scope = isManager ? {} : { userId: user.id };

    let csv: string;
    let filename: string;

    if (entity === "goals") {
      const goals = await prisma.goal.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      });
      csv = toCsv(
        ["Title", "Status", "Priority", "Category", "Progress", "Due Date", "Owner", "Created"],
        goals.map((g) => [
          g.title,
          g.status,
          g.priority,
          g.category,
          g.progress,
          g.dueDate?.toISOString().slice(0, 10) ?? "",
          g.user.name,
          g.createdAt.toISOString().slice(0, 10),
        ])
      );
      filename = "goals.csv";
    } else {
      const reviews = await prisma.review.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      });
      csv = toCsv(
        ["Period", "Type", "Rating", "Owner", "Created"],
        reviews.map((r) => [
          r.period,
          r.type,
          r.rating ?? "",
          r.user.name,
          r.createdAt.toISOString().slice(0, 10),
        ])
      );
      filename = "reviews.csv";
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
