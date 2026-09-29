import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponseSchema, type AgentResponse } from "./AgentResponseSchema";
import { buildGoogleAgentInstructions } from "./PromptBuilder";

// UPDATED: Accept both 'text' and 'content', and support 'assistant' role from frontend
export interface MessagePayload {
  role: "user" | "model" | "agent" | "assistant";
  content?: string;
  text?: string;
}

export async function executeGoogleAgentChat(params: {
  agentName: string;
  instructions: string;
  messages: MessagePayload[];
  availableTools: { slug: string; name: string; description: string }[];
  timeZone?: string;
  model?: string;
}): Promise<AgentResponse> {
  const { agentName, instructions, messages, availableTools, timeZone } =
    params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = buildGoogleAgentInstructions(
    agentName,
    instructions,
    availableTools,
    timeZone,
  );

  // UPDATED: Format message history safely for Gemini SDK
  const contents = messages.map((m) => ({
    role: m.role === "agent" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text || m.content || " " }],
  }));

  // Extract config to keep the try/catch block clean
  const config = {
    systemInstruction,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ["message", "clarification", "routine", "tool_suggestion"],
        },
        content: { type: Type.STRING },
        routine: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            goal: { type: Type.STRING },
            instructions: { type: Type.STRING },
            schedule: {
              type: Type.OBJECT,
              properties: {
                frequency: {
                  type: Type.STRING,
                  enum: ["once", "daily", "weekly", "monthly"],
                },
                time: { type: Type.STRING },
                days: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["frequency", "time"],
            },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["name", "goal", "instructions", "schedule", "tools"],
        },
        suggestedTools: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              slug: { type: Type.STRING },
              name: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["slug", "name", "reason"],
          },
        },
      },
      required: ["type", "content"],
    },
  };

  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response;
    try {
      response = await ai.models.generateContent({
        model: params.model || "gemini-3.1-flash-lite",
        contents,
        config,
      });
    } catch (error: unknown) {
      lastError = error;
      const apiError = error as { status?: number | string; message?: string };
      const isOverloaded =
        apiError.status === "UNAVAILABLE" ||
        apiError.status === 503 ||
        apiError.message?.includes("503") === true;

      if (!isOverloaded || attempt === maxAttempts - 1) {
        throw error;
      }

      const delayMs = 2000 * (attempt + 1);
      console.warn(
        `[Gemini API] 503 High Demand. Retrying attempt ${attempt + 1} in ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    const responseText = response.text?.trim();
    if (!responseText) {
      const finishReason = response.candidates?.[0]?.finishReason;
      const blockReason = response.promptFeedback?.blockReason;
      lastError = new Error(
        blockReason
          ? `Gemini blocked the prompt (${blockReason}).`
          : `Gemini returned an empty response${finishReason ? ` (${finishReason})` : ""}.`,
      );
    } else {
      try {
        const parsed = JSON.parse(responseText) as unknown;
        const validated = AgentResponseSchema.safeParse(parsed);
        if (validated.success && validated.data.content.trim()) {
          return validated.data;
        }
        lastError = new Error(
          validated.success
            ? "Gemini returned an empty agent message."
            : "Gemini returned a response that did not match the agent format.",
        );
      } catch (error) {
        lastError = error;
      }
    }

    if (attempt < maxAttempts - 1) {
      const delayMs = 1000 * (attempt + 1);
      console.warn(
        `[Gemini API] Empty or invalid response. Retrying attempt ${attempt + 1} in ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini could not generate a valid response.");
}
