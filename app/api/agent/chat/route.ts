import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db";
import { agentConfig, agentChatHistory, tools } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { executeOpenAIAgentChat } from "@/lib/openai/MyAgent";
import { executeGoogleAgentChat } from "@/lib/googleAI/MyAgent";
import { DEFAULT_CHAT_MODEL, isChatModel, isGoogleChatModel } from "@/lib/ai/models";
import { getConnectedToolkitSlugs } from "@/lib/composio";

//  GET: Load chat history when user opens the agent
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  if (!agentId)
    return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  const [history] = await db
    .select()
    .from(agentChatHistory)
    .where(
      and(
        eq(agentChatHistory.agentId, agentId),
        eq(agentChatHistory.userEmail, session.user.email),
      ),
    );

  const savedMessages = Array.isArray(history?.messages)
    ? history.messages
        .map((message) => {
          if (!message || typeof message !== "object") return null;
          const item = message as {
            text?: unknown;
            content?: unknown;
            time?: unknown;
            createdAt?: unknown;
            response?: { content?: unknown };
          };
          const text =
            (typeof item.text === "string" && item.text.trim()) ||
            (typeof item.content === "string" && item.content.trim()) ||
            (typeof item.response?.content === "string" &&
              item.response.content.trim()) ||
            "";
          if (!text) return null;

          const createdAt =
            typeof item.createdAt === "string" ? new Date(item.createdAt) : null;
          const time =
            (typeof item.time === "string" && item.time) ||
            (createdAt && !Number.isNaN(createdAt.getTime())
              ? createdAt.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "");

          return { ...item, text, time };
        })
        .filter((message): message is NonNullable<typeof message> => message !== null)
    : [];

  return NextResponse.json({ messages: savedMessages });
}

//  POST: Execute the selected provider model and save conversation history
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { agentId?: unknown; messages?: unknown; timeZone?: unknown; model?: unknown };
  const { agentId, messages, timeZone, model: requestedModel } = body;
  if (typeof agentId !== "string" || !agentId.trim()) {
    return NextResponse.json({ error: "A valid agentId is required." }, { status: 400 });
  }
  const model = requestedModel ?? DEFAULT_CHAT_MODEL;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Messages must be an array." }, { status: 400 });
  }
  const conversationMessages = messages.filter((message) => {
    if (!message || typeof message !== "object") return false;
    const item = message as { role?: unknown; text?: unknown; content?: unknown };
    if (!["user", "assistant", "agent", "model"].includes(String(item.role))) return false;
    return (
      (typeof item.text === "string" && item.text.trim().length > 0) ||
      (typeof item.content === "string" && item.content.trim().length > 0)
    );
  });
  if (conversationMessages.length === 0 || !conversationMessages.some((message) => (message as { role?: unknown }).role === "user")) {
    return NextResponse.json({ error: "Send a message before asking the agent to respond." }, { status: 400 });
  }

  // Load Agent info
  const [config] = await db
    .select()
    .from(agentConfig)
    .where(
      and(
        eq(agentConfig.agentId, agentId),
        eq(agentConfig.userEmail, session.user.email),
      ),
    );

  if (!config)
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (!isChatModel(model)) {
    return NextResponse.json({ error: "Unsupported chat model" }, { status: 400 });
  }

  // Load available tool list
  const catalog = await db.select().from(tools).where(eq(tools.isActive, true));
  const allowedToolkits = catalog.map((toolkit) => toolkit.slug.toLowerCase());
  const selectedToolkits = Array.isArray(config.tools)
    ? config.tools.filter((toolkit): toolkit is string => typeof toolkit === "string")
      .map((toolkit) => toolkit.toLowerCase())
      .filter((slug) => allowedToolkits.includes(slug))
    : [];

  const usesGoogle = isGoogleChatModel(model);
  if (usesGoogle && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Google Gemini is not configured on this server." },
      { status: 503 },
    );
  }
  if (!usesGoogle && !process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI is not configured on this server." },
      { status: 503 },
    );
  }

  let agentResponse;
  try {
    const enabledToolkits = process.env.COMPOSIO_API_KEY
      ? await getConnectedToolkitSlugs(session.user.email, selectedToolkits)
      : [];
    const agentParams = {
      agentName: config.name,
      instructions: config.description || "",
      messages: conversationMessages,
      enabledToolkits,
      availableTools: enabledToolkits.map((slug) => {
        const toolkit = catalog.find((entry) => entry.slug.toLowerCase() === slug.toLowerCase());
        return {
          slug,
          name: toolkit?.name || slug,
          description: toolkit?.description || "Connected Composio integration",
        };
      }),
      userEmail: session.user.email,
      timeZone: typeof timeZone === "string" ? timeZone : undefined,
      model,
    };
    agentResponse = usesGoogle
      ? await executeGoogleAgentChat(agentParams)
      : await executeOpenAIAgentChat(agentParams);
  } catch (error) {
    console.error(`${usesGoogle ? "Google" : "OpenAI"} agent request failed:`, error);
    const message = error instanceof Error ? error.message : "";
    const errorStatus = (error as { status?: number | string } | null)?.status;
    const isUnavailable =
      errorStatus === 503 ||
      errorStatus === "UNAVAILABLE" ||
      message.includes("503") ||
      message.includes("UNAVAILABLE");
    return NextResponse.json(
      {
        error: isUnavailable
          ? `${usesGoogle ? "Google Gemini" : "OpenAI"} is temporarily unavailable. Please try again shortly.`
          : "The agent could not generate a response. Please try again.",
      },
      { status: isUnavailable ? 503 : 502 },
    );
  }

  if (
    !agentResponse ||
    typeof agentResponse.content !== "string" ||
    agentResponse.content.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "The agent returned an empty response. Please try again." },
      { status: 502 },
    );
  }

  const updatedMessages = [
    ...conversationMessages,
    {
      id: crypto.randomUUID(),
      role: "agent",
      content: agentResponse.content,
      text: agentResponse.content,
      response: agentResponse,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
    },
  ];

  // Update existing history rows, or create one when this is the first reply.
  // The advisory lock serializes first writes because this table has no unique
  // constraint on (agent_id, user_email) in existing databases.
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${agentId}), hashtext(${session.user.email}))`,
    );

    const existingRows = await tx
      .update(agentChatHistory)
      .set({ messages: updatedMessages })
      .where(
        and(
          eq(agentChatHistory.agentId, agentId),
          eq(agentChatHistory.userEmail, session.user.email),
        ),
      )
      .returning({ id: agentChatHistory.id });

    if (existingRows.length === 0) {
      await tx.insert(agentChatHistory).values({
        agentId,
        userEmail: session.user.email,
        messages: updatedMessages,
      });
    }
  });

  return NextResponse.json({
    response: agentResponse,
    messages: updatedMessages,
  });
}
