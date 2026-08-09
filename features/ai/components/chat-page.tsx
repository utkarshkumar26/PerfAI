"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, MessageSquarePlus, Send, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/features/auth/actions/use-auth";
import {
  useConversation,
  useConversations,
  useDeleteConversation,
  useSendMessage,
} from "../actions/use-chat";
import type { StoredMessage } from "../actions/chat.service";

export function ChatPage() {
  const { data: user } = useSession();
  const { data: conversations, isLoading: loadingList } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: conversation, isLoading: loadingConvo } = useConversation(activeId);
  const send = useSendMessage();
  const del = useDeleteConversation();
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<StoredMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const serverMessages: StoredMessage[] = Array.isArray(conversation?.messages)
    ? (conversation.messages as unknown as StoredMessage[])
    : [];

  const messages = activeId ? serverMessages : localMessages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, send.isPending]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft("");

    // Optimistic append when starting a fresh conversation.
    const optimistic: StoredMessage = {
      role: "user",
      content: text,
      ts: new Date().toISOString(),
    };
    if (!activeId) setLocalMessages((m) => [...m, optimistic]);

    send.mutate(
      { conversationId: activeId ?? undefined, message: text },
      {
        onSuccess: (data) => {
          if (!activeId) {
            setActiveId(data.conversationId);
            setLocalMessages([]);
          }
        },
      }
    );
  };

  const startNew = () => {
    setActiveId(null);
    setLocalMessages([]);
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 md:grid-cols-[260px_1fr]">
      {/* Conversation list */}
      <Card className="hidden rounded-xl shadow-sm md:flex md:flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chats</CardTitle>
            <Button size="icon-sm" variant="ghost" onClick={startNew} aria-label="New chat">
              <MessageSquarePlus />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-1 overflow-y-auto">
          {loadingList ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)
          ) : conversations?.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No conversations yet.
            </p>
          ) : (
            conversations?.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors hover:bg-accent",
                  activeId === c.id && "border-primary bg-primary/5"
                )}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setActiveId(c.id);
                    setLocalMessages([]);
                  }}
                >
                  <div className="truncate font-medium">{c.title ?? "Untitled"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {format(new Date(c.updatedAt), "MMM d")}
                  </div>
                </button>
                <button
                  className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                  aria-label="Delete conversation"
                  onClick={() => {
                    if (confirm("Delete this conversation?")) {
                      del.mutate(c.id);
                      if (activeId === c.id) startNew();
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Thread */}
      <Card className="flex flex-col rounded-xl shadow-sm">
        <CardHeader className="flex-row items-center justify-between border-b pb-3 md:hidden">
          <CardTitle className="text-base">AI Assistant</CardTitle>
          <Button size="sm" variant="outline" onClick={startNew}>
            <MessageSquarePlus /> New
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          {loadingConvo ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-2/3" />
              <Skeleton className="ml-auto h-12 w-1/2" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <MessageSquarePlus className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Ask about career guidance, resume review, goal suggestions, promotion
                tips, learning roadmaps or performance improvement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {m.role === "user"
                        ? (user?.name ?? "U").slice(0, 2).toUpperCase()
                        : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {send.isPending && (
                <div className="flex gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[10px]">AI</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </CardContent>
        <Separator />
        <div className="flex items-end gap-2 p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Ask the AI assistant..."
            className="max-h-40 min-h-10 resize-none"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!draft.trim() || send.isPending}
            aria-label="Send message"
          >
            {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
