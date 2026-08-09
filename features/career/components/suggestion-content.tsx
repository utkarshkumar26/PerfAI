"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

/**
 * Generic renderer for AI career guidance JSON. Unknown keys with string[]
 * values render as bullet lists; objects render as sub-sections.
 */
export function SuggestionContent({ content }: { content: Record<string, unknown> }) {
  return (
    <div className="space-y-5">
      {typeof content.readinessScore === "number" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Promotion readiness</span>
            <span className="font-medium">{content.readinessScore}%</span>
          </div>
          <Progress value={content.readinessScore} className="h-2" />
        </div>
      )}
      {typeof content.readyFor === "string" && content.readyFor && (
        <p className="text-sm">
          <span className="font-semibold">Ready for: </span>
          <Badge variant="secondary">{content.readyFor}</Badge>
        </p>
      )}
      {typeof content.estimatedTimeline === "string" && content.estimatedTimeline && (
        <p className="text-sm text-muted-foreground">
          Estimated timeline: {content.estimatedTimeline}
        </p>
      )}
      {Object.entries(content)
        .filter(([k]) => !["summary", "readinessScore", "readyFor", "estimatedTimeline"].includes(k))
        .map(([key, value]) => (
          <div key={key}>
            <Section title={labelize(key)} value={value} />
            <Separator className="mt-4" />
          </div>
        ))}
    </div>
  );
}

function labelize(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function Section({ title, value }: { title: string; value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (typeof value[0] === "string") {
      return (
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {(value as string[]).map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="space-y-2">
          {(value as Array<Record<string, unknown>>).map((obj, i) => (
            <div key={i} className="space-y-1 rounded-lg border p-3">
              {Object.entries(obj).map(([k, v]) => (
                <div key={k} className="text-sm">
                  {isScalarArray(v) ? (
                    <>
                      <span className="font-medium">{labelize(k)}: </span>
                      <span className="text-muted-foreground">{(v as string[]).join(", ")}</span>
                    </>
                  ) : typeof v === "string" || typeof v === "number" ? (
                    <>
                      <span className="font-medium">{labelize(k)}: </span>
                      <span className="text-muted-foreground">{String(v)}</span>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === "string" && value) {
    return (
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
      </div>
    );
  }
  return null;
}

function isScalarArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}
