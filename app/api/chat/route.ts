import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { chatMessageSchema } from "@/features/ai/validations/chat.schema";
import {
  appendToConversation,
  buildPrompt,
  getConversation,
  listConversations,
} from "@/features/ai/actions/chat.service";
import { getAIProvider } from "@/services/ai/provider";
import { CHAT_SYSTEM } from "@/features/ai/prompts";
import type { StoredMessage } from "@/features/ai/actions/chat.service";

export async function GET() {
  try {
    const user = await requireUser();
    return ok(await listConversations(user));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(chatMessageSchema, await request.json());

    let history: StoredMessage[] = [];
    if (body.conversationId) {
      const convo = await getConversation(user, body.conversationId);
      history = Array.isArray(convo.messages)
        ? (convo.messages as unknown as StoredMessage[])
        : [];
    }

    const provider = getAIProvider();
    const reply = await provider.chat(buildPrompt(history, body.message, CHAT_SYSTEM), {
      temperature: 0.7,
      maxTokens: 1500,
    });

    const convo = await appendToConversation(
      user,
      body.conversationId,
      body.message,
      reply
    );

    return ok({ conversationId: convo.id, reply });
  } catch (error) {
    return handleApiError(error);
  }
}
