import { Composio } from "@composio/core";
import { OpenAIResponsesProvider } from "@composio/openai";
import { GoogleProvider } from "@composio/google";

function apiKey() {
  const key = process.env.COMPOSIO_API_KEY;
  if (!key) throw new Error("COMPOSIO_API_KEY is not configured.");
  return key;
}

export const composioOpenAI = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new OpenAIResponsesProvider(),
});

export const composioGoogle = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new GoogleProvider(),
});

export function composioUserId(email: string) {
  return email.trim().toLowerCase();
}

export async function createComposioSession(
  email: string,
  toolkits: string[] = [],
  provider: "openai" | "google" = "openai",
) {
  apiKey();
  const client = provider === "google" ? composioGoogle : composioOpenAI;
  return client.sessions.create(composioUserId(email), {
    ...(toolkits.length ? { toolkits } : {}),
    manageConnections: true,
  });
}

export async function getConnectedToolkitSlugs(email: string, allowedToolkits: string[]) {
  if (allowedToolkits.length === 0) return [];
  const session = await createComposioSession(email, allowedToolkits);
  const connected: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await session.toolkits({ limit: 50, ...(cursor ? { cursor } : {}) });
    for (const toolkit of page.items) {
      if (toolkit.connection?.isActive) connected.push(toolkit.slug.toLowerCase());
    }
    cursor = page.cursor;
  } while (cursor);
  return connected;
}
