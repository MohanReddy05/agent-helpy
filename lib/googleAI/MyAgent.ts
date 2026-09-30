import { GoogleGenAI, Type } from "@google/genai";
import { AgentResponseSchema, type AgentResponse } from "./AgentResponseSchema";
import { buildGoogleAgentInstructions } from "./PromptBuilder";
import { createComposioSession } from "@/lib/composio";

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
  enabledToolkits?: string[];
  userEmail?: string;
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

  const session = params.userEmail && params.enabledToolkits?.length
    ? await createComposioSession(params.userEmail, params.enabledToolkits, "google")
    : null;
  const composioTools = session ? await session.tools() : [];
  const geminiTools = JSON.parse(
    JSON.stringify(composioTools, (key, value) => key === "examples" ? undefined : value),
  ) as typeof composioTools;

  // UPDATED: Format message history safely for Gemini SDK
  const contents = messages.map((m) => ({
    role: m.role === "agent" || m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text || m.content || " " }],
  }));

  // Extract config to keep the try/catch block clean
  const config = {
    systemInstruction,
    ...(geminiTools.length
      ? { tools: [{ functionDeclarations: geminiTools }] }
      : {}),
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

  const primaryModel = params.model || "gemini-3.8-flash";
  const modelFallbacks = [...new Set([
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
  ])].filter((model) => model !== primaryModel);
  const isOverloaded = (error: unknown) => {
    const apiError = error as { status?: number | string; message?: string };
    return apiError.status === "UNAVAILABLE" || apiError.status === "RESOURCE_EXHAUSTED" ||
      apiError.status === 503 || apiError.status === 429 ||
      apiError.message?.includes("503") === true ||
      apiError.message?.includes("UNAVAILABLE") === true ||
      apiError.message?.includes("RESOURCE_EXHAUSTED") === true;
  };
  const isMissingModel = (error: unknown) => {
    const apiError = error as { status?: number | string; message?: string };
    return apiError.status === 404 || apiError.message?.toLowerCase().includes("model") === true &&
      (apiError.message.toLowerCase().includes("not found") || apiError.message.toLowerCase().includes("does not exist"));
  };
  type GeminiRequestContents = Parameters<typeof ai.models.generateContent>[0]["contents"];
  const generate = async (requestContents: GeminiRequestContents) => {
    let lastError: unknown;
    const modelChain = [primaryModel, ...modelFallbacks];
    for (const [modelIndex, model] of modelChain.entries()) {
      const attempts = modelIndex === 0 ? 2 : 1;
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          return await ai.models.generateContent({ model, contents: requestContents, config });
        } catch (error) {
          lastError = error;
          if (!isOverloaded(error) && !isMissingModel(error)) throw error;
          if (isMissingModel(error)) {
            console.warn(`[Gemini API] Model ${model} is unavailable; trying the next configured model.`);
            break;
          }
          if (attempt + 1 < attempts) {
            const delayMs = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
            console.warn(`[Gemini API] ${model} is overloaded; retrying in ${delayMs}ms.`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else if (modelChain[modelIndex + 1]) {
            console.warn(`[Gemini API] Falling back from ${model} to ${modelChain[modelIndex + 1]}.`);
          }
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Gemini models are temporarily unavailable.");
  };

  // The call helper handles overload retries. Do not restart a conversation
  // after a tool has run, since that could repeat a side effect.
  const maxAttempts = 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response;
    try {
      let conversation: GeminiRequestContents = [...contents];
      response = await generate(conversation);
      for (let step = 0; step < 8 && session; step++) {
        const calls = response.candidates?.flatMap((candidate) =>
          candidate.content?.parts?.flatMap((part) => part.functionCall ? [part.functionCall] : []) ?? [],
        ) ?? [];
        if (!calls.length) break;
        const toolResponses = await Promise.all(calls.map(async (call) => {
          if (!call.name) throw new Error("Gemini returned a tool call without a name.");
          const toolResult = await session.execute(call.name, call.args ?? {});
          let output: Record<string, unknown>;
          try {
            const parsed: unknown = JSON.parse(JSON.stringify(toolResult));
            output = parsed && typeof parsed === "object" && !Array.isArray(parsed)
              ? parsed as Record<string, unknown>
              : { result: parsed };
          } catch {
            output = { result: String(toolResult) };
          }
          return { functionResponse: { name: call.name, response: output } };
        }));
        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) conversation = [...conversation, modelContent];
        conversation = [...conversation, { role: "user", parts: toolResponses }];
        response = await generate(conversation);
      }
    } catch (error: unknown) {
      lastError = error;
      if (!isOverloaded(error) || attempt === maxAttempts - 1) {
        throw error;
      }

      const delayMs = 1000 * (attempt + 1);
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
