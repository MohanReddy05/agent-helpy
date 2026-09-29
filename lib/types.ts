export interface RoutineData {
  name: string;
  goal: string;
  instructions: string;
  schedule: {
    frequency: "once" | "daily" | "weekly" | "monthly";
    time: string;
    days?: string[];
  };
  tools: string[];
}

export interface ToolSuggestionData {
  slug: string;
  name: string;
  reason: string;
}

export interface AgentResponse {
  type: "message" | "clarification" | "routine" | "tool_suggestion";
  content: string;
  routine?: RoutineData;
  suggestedTools?: ToolSuggestionData[];
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "agent";
  text: string;
  content?: string;
  time: string;
  response?: AgentResponse; // Holds the structured generative UI data
}
