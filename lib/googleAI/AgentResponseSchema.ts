// lib/google/agentResponseSchema.ts
import { z } from "zod";

export const RoutineSchema = z.object({
  name: z.string().describe("Name of the automated task routine"),
  goal: z.string().describe("Primary goal of the routine"),
  instructions: z
    .string()
    .describe("Specific execution steps for background worker"),
  schedule: z.object({
    frequency: z.enum(["once", "daily", "weekly", "monthly"]),
    time: z.string().describe("Execution time, e.g. 08:30"),
    days: z.array(z.string()).optional(),
  }),
  tools: z
    .array(z.string())
    .describe("List of tool slugs needed (e.g., ['gmail', 'slack'])"),
});

export const ToolSuggestionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  reason: z.string(),
});

export const AgentResponseSchema = z.object({
  type: z.enum(["message", "clarification", "routine", "tool_suggestion"]),
  content: z.string().describe("Conversational reply to the user"),
  routine: RoutineSchema.optional(),
  suggestedTools: z.array(ToolSuggestionSchema).default([]),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;
