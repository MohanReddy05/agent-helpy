import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentConfig, tools as toolCatalog } from "@/db/schema";
import { createComposioSession, getConnectedToolkitSlugs } from "@/lib/composio";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function ownedAgent(agentId: string, email: string) {
  const [agent] = await db.select().from(agentConfig).where(
    and(eq(agentConfig.agentId, agentId), eq(agentConfig.userEmail, email)),
  );
  return agent;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agentId = request.nextUrl.searchParams.get("agentId");
  const agent = agentId ? await ownedAgent(agentId, email) : null;
  if (agentId && !agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  try {
    const catalog = await db.select().from(toolCatalog).where(eq(toolCatalog.isActive, true));
    if (catalog.length === 0) return NextResponse.json({ tools: [] });
    const catalogSlugs = catalog.map((toolkit) => toolkit.slug.toLowerCase());
    const connected = new Map<string, boolean>();
    if (process.env.COMPOSIO_API_KEY) {
      const composioSession = await createComposioSession(email, catalogSlugs);
      let cursor: string | undefined;
      do {
        const status = await composioSession.toolkits({ limit: 50, ...(cursor ? { cursor } : {}) });
        for (const item of status.items) {
          connected.set(item.slug.toLowerCase(), Boolean(item.connection?.isActive));
        }
        cursor = status.cursor;
      } while (cursor);
    }
    const enabled = new Set(Array.isArray(agent?.tools)
      ? agent.tools.filter((toolkit): toolkit is string => typeof toolkit === "string").map((slug) => slug.toLowerCase())
      : []);
    return NextResponse.json({
      tools: catalog.map((toolkit) => ({
        slug: toolkit.slug.toLowerCase(),
        name: toolkit.name,
        description: toolkit.description || "Connect this app to give your agent access to its tools.",
        logo: toolkit.icon || undefined,
        category: toolkit.category || undefined,
        connected: connected.get(toolkit.slug.toLowerCase()) ?? false,
        enabled: enabled.has(toolkit.slug.toLowerCase()),
      })),
    });
  } catch (error) {
    console.error("Composio toolkit catalog failed:", error);
    return NextResponse.json({ error: "Could not load Composio tools." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { agentId?: string; slug?: string; enabled?: boolean };
  if (!body.agentId || !body.slug || typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "agentId, slug, and enabled are required." }, { status: 400 });
  }
  const agent = await ownedAgent(body.agentId, email);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const slug = body.slug.toLowerCase();
  const catalogEntries = await db.select({ slug: toolCatalog.slug }).from(toolCatalog).where(eq(toolCatalog.isActive, true));
  const catalogEntry = catalogEntries.find((entry) => entry.slug.toLowerCase() === slug);
  if (!catalogEntry) return NextResponse.json({ error: "This app is not in the enabled toolkit catalog." }, { status: 404 });
  if (body.enabled) {
    const connected = await getConnectedToolkitSlugs(email, [slug]);
    if (!connected.includes(slug)) {
      return NextResponse.json({ error: "Connect this app in the marketplace first." }, { status: 409 });
    }
  }
  const current = Array.isArray(agent.tools)
    ? agent.tools.filter((toolkit): toolkit is string => typeof toolkit === "string").map((value) => value.toLowerCase())
    : [];
  const next = body.enabled
    ? [...new Set([...current, slug])]
    : current.filter((toolkit) => toolkit !== slug);
  await db.update(agentConfig).set({ tools: next }).where(
    and(eq(agentConfig.agentId, body.agentId), eq(agentConfig.userEmail, email)),
  );
  return NextResponse.json({ enabled: body.enabled });
}
