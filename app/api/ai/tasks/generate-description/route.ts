import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const provider = getAIProvider();

    const title = body.title || "Untitled Task";
    const prompt = body.prompt || body.roughDescription || "";
    const project = body.project || "Platform";

    const systemPrompt = `You are a world-class Staff Technical Product Manager and Lead Architect.
Your task is to take a task title and/or rough user thoughts/notes, and transform them into a comprehensive, crystal-clear, highly professional task description.

Structure the description cleanly with:
- **Overview**: High-level context and objective.
- **Scope & Requirements**: Bullet points of key deliverables and technical expectations.
- **Acceptance Criteria**: Concrete checklist criteria for definition of done.
- **Notes / Edge Cases**: Any critical performance, UI/UX, or security considerations.

Keep the tone professional, structured, concise, and ready to paste into modern engineering task trackers (like Jira, Linear, or Asana).`;

    const userPrompt = `Task Title: ${title}
Project/Team Context: ${project}
User Input / Rough Thoughts: ${prompt || "Generate based on title"}

Please return JSON in this exact structure:
{
  "description": "Complete formatted description with markdown headers and bullet points",
  "summary": "1-sentence summary of the task"
}`;

    const raw = await provider.generateText(systemPrompt, userPrompt, {
      json: true,
      temperature: 0.3,
      maxTokens: 2500,
    });

    interface GeneratedDescriptionResponse {
      description: string;
      summary?: string;
    }

    const data = parseAIJson<GeneratedDescriptionResponse>(raw);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
