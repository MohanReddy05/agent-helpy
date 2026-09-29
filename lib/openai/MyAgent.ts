import { AgentResponseSchema, type AgentResponse } from "@/lib/googleAI/AgentResponseSchema";
import { buildAgentInstructions } from "./PromptBuilder";
import { DEFAULT_CHAT_MODEL, type ChatModel } from "@/lib/ai/models";

export interface MessagePayload {
  role: "user" | "model" | "agent" | "assistant";
  content?: string;
  text?: string;
}

type OpenAIResponse = {
  output?: {
    content?: { type?: string; text?: string }[];
  }[];
  error?: { message?: string };
};

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["message", "clarification", "routine", "tool_suggestion"],
    },
    content: { type: "string" },
    routine: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            goal: { type: "string" },
            instructions: { type: "string" },
            schedule: {
              type: "object",
              additionalProperties: false,
              properties: {
                frequency: {
                  type: "string",
                  enum: ["once", "daily", "weekly", "monthly"],
                },
                time: { type: "string" },
                days: { type: "array", items: { type: "string" } },
              },
              required: ["frequency", "time", "days"],
            },
            tools: { type: "array", items: { type: "string" } },
          },
          required: ["name", "goal", "instructions", "schedule", "tools"],
        },
        { type: "null" },
      ],
    },
    suggestedTools: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          reason: { type: "string" },
        },
        required: ["slug", "name", "reason"],
      },
    },
  },
  required: ["type", "content", "routine", "suggestedTools"],
} as const;

export async function executeOpenAIAgentChat(params: {
  agentName: string;
  instructions: string;
  messages: MessagePayload[];
  availableTools: { slug: string; name: string; description: string }[];
  timeZone?: string;
  model?: ChatModel;
}): Promise<AgentResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const instructions = buildAgentInstructions(
    params.agentName,
    params.instructions,
    params.availableTools,
    params.timeZone,
  );
  const input = params.messages.map((message) => ({
    role:
      message.role === "assistant" ||
      message.role === "agent" ||
      message.role === "model"
        ? "assistant"
        : "user",
    content: message.text || message.content || " ",
  }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model || process.env.OPENAI_MODEL || DEFAULT_CHAT_MODEL,
      instructions,
      input,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "helpy_agent_response",
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  const result = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(result.error?.message || "OpenAI request failed.");
  }
  const outputText = result.output
    ?.flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text || "")
    .join("");
  if (!outputText) {
    throw new Error("OpenAI returned an empty agent response.");
  }

  const parsed = JSON.parse(outputText) as Record<string, unknown>;
  if (parsed.routine === null) delete parsed.routine;
  return AgentResponseSchema.parse(parsed);
}
