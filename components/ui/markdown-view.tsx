"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  if (!content || !content.trim()) {
    return (
      <p className="text-muted-foreground text-xs italic">
        No description provided. Click &quot;Generate with AI&quot; or &quot;Write&quot; to add details.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-xs text-foreground space-y-3 leading-relaxed",
        className
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-bold tracking-tight text-foreground border-b pb-1.5 mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold tracking-tight text-foreground mt-3.5 mb-1.5 flex items-center gap-1.5 first:mt-0">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mt-3 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-foreground mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-xs text-foreground leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground/90">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 mb-2 text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-xs leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/50 bg-muted/30 px-3 py-1.5 my-2 rounded-r italic text-xs text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className && typeof children === "string" && !children.includes("\n");
            if (isInline) {
              return (
                <code
                  className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary font-semibold border"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn(
                  "block bg-muted/80 p-3 rounded-lg text-[11px] font-mono overflow-x-auto border text-foreground my-2 leading-relaxed",
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
