import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentConfig, tools as toolCatalog } from "@/db/schema";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createComposioSession } from "@/lib/composio";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { agentId?: string; slug?: string };
  const slug = body.slug?.trim().toLowerCase();
  if (!slug) return NextResponse.json({ error: "A toolkit slug is required." }, { status: 400 });

  try {
    const catalog = await db.select().from(toolCatalog).where(eq(toolCatalog.isActive, true));
    const toolkit = catalog.find((entry) => entry.slug.toLowerCase() === slug);
    if (!toolkit) return NextResponse.json({ error: "This app is not in the enabled toolkit catalog." }, { status: 404 });
    if (body.agentId) {
      const [agent] = await db.select().from(agentConfig).where(
        and(eq(agentConfig.agentId, body.agentId), eq(agentConfig.userEmail, email)),
      );
      if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const composioSession = await createComposioSession(email, [slug]);
    const connection = await composioSession.authorize(slug, {
      callbackUrl: body.agentId
        ? `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/workspace/${encodeURIComponent(body.agentId)}`
        : `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/marketplace`,
    });
    const agents = await db.select().from(agentConfig).where(eq(agentConfig.userEmail, email));
    await db.transaction(async (tx) => {
      for (const agent of agents) {
        const current = Array.isArray(agent.tools)
          ? agent.tools.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase())
          : [];
        if (!current.includes(slug)) {
          await tx.update(agentConfig).set({ tools: [...current, slug] }).where(
            and(eq(agentConfig.agentId, agent.agentId), eq(agentConfig.userEmail, email)),
          );
        }
      }
    });
    return NextResponse.json({ redirectUrl: connection.redirectUrl, toolkit: toolkit.name });
  } catch (error) {
    console.error("Composio connection link failed:", error);
    return NextResponse.json({ error: "Could not create a connection link for this app." }, { status: 502 });
  }
}
