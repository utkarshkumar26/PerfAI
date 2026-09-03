/**
 * AI Provider abstraction.
 *
 * All AI access flows through `getAIProvider()`. Switch providers by changing
 * the AI_PROVIDER / AI_MODEL env vars — no code changes required.
 * To add a new provider, implement the AIProvider interface and register it
 * in the `providers` map.
 */
import { env } from "@/lib/env";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  /** Ask for strict JSON output. */
  json?: boolean;
}

export interface AIProvider {
  readonly name: string;
  generateText(systemPrompt: string, userPrompt: string, options?: GenerateOptions): Promise<string>;
  chat(messages: ChatMessage[], options?: GenerateOptions): Promise<string>;
}

/* ------------------------------ OpenAI ------------------------------ */

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private model = env.AI_MODEL;
  private apiKey = env.OPENAI_API_KEY;

  async chat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI request failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message.content ?? "";
  }

  generateText(systemPrompt: string, userPrompt: string, options?: GenerateOptions) {
    return this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options
    );
  }
}

/* ------------------------------ Gemini ------------------------------ */

class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private get model() {
    const m = env.AI_MODEL;
    return m && m.startsWith("gemini") ? m : "gemini-2.5-flash";
  }
  private get apiKey() {
    return env.GEMINI_API_KEY;
  }

  async chat(messages: ChatMessage[], options: GenerateOptions = {}): Promise<string> {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY is not configured");
    const system = messages.find((m) => m.role === "system")?.content;
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2000,
          ...(options.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini request failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    return data.candidates[0]?.content.parts.map((p) => p.text).join("") ?? "";
  }

  generateText(systemPrompt: string, userPrompt: string, options?: GenerateOptions) {
    return this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      options
    );
  }
}

/* ---------------------------- Provider map ---------------------------- */

const providers: Record<string, AIProvider> = {
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
};

export function getAIProvider(): AIProvider {
  const providerKey =
    env.AI_PROVIDER === "gemini" || (env.GEMINI_API_KEY && !env.OPENAI_API_KEY)
      ? "gemini"
      : env.AI_PROVIDER;

  const provider = providers[providerKey] ?? providers.gemini;
  if (!provider) throw new Error(`Unknown AI provider: ${env.AI_PROVIDER}`);
  return provider;
}

/** Parse a JSON response from the model, tolerating markdown fences. */
export function parseAIJson<T>(raw: string): T {
  const cleaned = raw
    .replace(/```(?:json)?/gi, "")
    .replace(/^[^{\[]*/, "")
    .replace(/[^}\]]*$/, "");
  return JSON.parse(cleaned) as T;
}
