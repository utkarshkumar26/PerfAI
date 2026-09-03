import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const provider = getAIProvider();

    const systemPrompt = `You are an expert Principal Software Engineer and QA Tech Lead at a high-scale technology company. 
Your goal is to inspect bug reports and tasks, identify root causes, provide exact solutions, code snippets, and verification steps.
Respond strictly with valid JSON.`;

    const userPrompt = `Please analyze this task/bug report and generate an actionable technical solution:
Task Number: ${body.taskNumber || "T-Unknown"}
Title: ${body.title || "Untitled Task"}
Bug Type / Category: ${body.bugType || body.category || "General"}
Section / Tab: ${body.sectionOrTab || "General"}
Repro Steps: ${body.reproSteps || "None provided"}
Expected Result: ${body.expectedResult || "Expected standard behavior"}
Actual Result: ${body.actualResult || "Unexpected behavior reported"}
Description: ${body.description || "N/A"}
Debug Info: ${JSON.stringify(body.debugInfo || {})}

Return JSON matching this schema:
{
  "summary": "Short 1-2 sentence executive summary of the issue and resolution",
  "rootCause": "Detailed explanation of what likely caused this bug or requirement",
  "solutionSteps": [
    "Step 1: Specific code or UI change needed",
    "Step 2: Additional adjustment",
    "Step 3: Verification"
  ],
  "codeSnippet": "// Optional code or config snippet demonstrating the fix\\n...",
  "suggestedPRTitle": "Fix or feature PR title following conventional commits (e.g. fix(pmt): standardize calibration headers)",
  "testPlan": [
    "Test case 1: Verify header casing",
    "Test case 2: Check responsiveness"
  ]
}`;

    const raw = await provider.generateText(systemPrompt, userPrompt, {
      json: true,
      temperature: 0.4,
      maxTokens: 3000,
    });

    interface TaskAISolution {
      summary: string;
      rootCause: string;
      solutionSteps: string[];
      codeSnippet?: string;
      suggestedPRTitle: string;
      testPlan: string[];
    }

    const solution = parseAIJson<TaskAISolution>(raw);
    return ok(solution);
  } catch (error) {
    return handleApiError(error);
  }
}
