import type { Metadata } from "next";
import { ChatPage } from "@/features/ai/components/chat-page";

export const metadata: Metadata = { title: "AI Assistant" };

export default function Page() {
  return <ChatPage />;
}
