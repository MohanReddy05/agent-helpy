import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { agentConfig, db } from "@/db";
import { desc, eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { agentId, name, description, agentImage } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized user" },
        { status: 401 },
      );
    }

    const newAgentConfig = await db
      .insert(agentConfig)
      .values({
        agentId,
        name,
        description,
        agentImage,
        userEmail: session.user.email,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Agent Created Successfully",
        data: newAgentConfig,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating agent:", error);

    return NextResponse.json(
      { message: "Failed to create agent" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const agentId = req.nextUrl.searchParams.get("agentId");

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized!" }, { status: 401 });
  }

  if (agentId) {
    const getAgent = await db
      .select()
      .from(agentConfig)
      .where(
        and(
          eq(agentConfig.userEmail, session?.user?.email),
          eq(agentConfig.agentId, agentId),
        ),
      );
    return NextResponse.json(getAgent[0]);
  }

  const getAgents = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.userEmail, session?.user?.email))
    .orderBy(desc(agentConfig.createdAt));

  return NextResponse.json(getAgents);
}

export async function PUT(req: NextRequest) {
  const { agentId, name, description, agentImage } = await req.json();
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (agentId) {
      const UpdateAgent = await db
        .update(agentConfig)
        .set({
          name,
          description,
          agentImage,
        })
        .where(
          and(
            eq(agentConfig.userEmail, session?.user?.email),
            eq(agentConfig.agentId, agentId),
          ),
        )
        .returning();
    }

    return NextResponse.json(
      { message: "Agent updated successfully!" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: `Internal Server Error ${error}` },
      { status: 501 },
    );
  }
}
