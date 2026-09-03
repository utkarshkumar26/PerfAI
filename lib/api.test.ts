import { handleApiError } from "@/lib/api";

describe("handleApiError", () => {
  it("returns a 503 for AI provider rate limit errors", async () => {
    const response = handleApiError(new Error("Gemini request failed (429): Too Many Requests"));
    expect(response.status).toBe(503);

    const json = await response.json();
    expect(json.error).toBe("AI service is temporarily unavailable. Please try again later.");
  });
});
