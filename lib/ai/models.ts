export const CHAT_MODELS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", provider: "openai" },
  { id: "gpt-5.6-luna", label: "GPT-5.6 Luna · fast", provider: "openai" },
  { id: "gpt-5.6-terra", label: "GPT-5.6 Terra · balanced", provider: "openai" },
  { id: "gpt-5.6", label: "GPT-5.6 · advanced", provider: "openai" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", provider: "google" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "google" },
] as const;

export type ChatModel = (typeof CHAT_MODELS)[number]["id"];
export const DEFAULT_CHAT_MODEL: ChatModel = "gpt-4.1-mini";

export function isChatModel(value: unknown): value is ChatModel {
  return CHAT_MODELS.some((model) => model.id === value);
}

export function isGoogleChatModel(value: ChatModel): boolean {
  return CHAT_MODELS.some(
    (model) => model.id === value && model.provider === "google",
  );
}
