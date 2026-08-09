import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User, ChatHistory } from "@prisma/client";
import type { ChatMessage } from "@/services/ai/provider";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
}

function toMessages(raw: unknown): StoredMessage[] {
  return Array.isArray(raw) ? (raw as StoredMessage[]) : [];
}

export async function listConversations(user: User) {
  return prisma.chatHistory.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function getConversation(user: User, id: string): Promise<ChatHistory> {
  const convo = await prisma.chatHistory.findUnique({ where: { id } });
  if (!convo) throw new ApiError(404, "Conversation not found");
  if (convo.userId !== user.id) throw new ApiError(403, "Access denied");
  return convo;
}

export async function deleteConversation(user: User, id: string) {
  await getConversation(user, id);
  await prisma.chatHistory.delete({ where: { id } });
}

export function buildPrompt(
  history: StoredMessage[],
  newMessage: string,
  systemPrompt: string
): ChatMessage[] {
  return [
    { role: "system", content: systemPrompt },
    ...history
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
    { role: "user", content: newMessage },
  ];
}

export async function appendToConversation(
  user: User,
  conversationId: string | undefined,
  userMessage: string,
  assistantReply: string
): Promise<ChatHistory> {
  const now = new Date().toISOString();
  const additions: StoredMessage[] = [
    { role: "user", content: userMessage, ts: now },
    { role: "assistant", content: assistantReply, ts: new Date().toISOString() },
  ];

  let convo: ChatHistory;
  if (conversationId) {
    const existing = await getConversation(user, conversationId);
    const messages = [...toMessages(existing.messages), ...additions];
    convo = await prisma.chatHistory.update({
      where: { id: existing.id },
      data: { messages: JSON.parse(JSON.stringify(messages)) },
    });
  } else {
    const title = userMessage.slice(0, 60);
    convo = await prisma.chatHistory.create({
      data: {
        userId: user.id,
        title,
        messages: JSON.parse(JSON.stringify(additions)),
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CHAT_MESSAGE",
      entity: "ChatHistory",
      entityId: convo.id,
    },
  });

  return convo;
}
