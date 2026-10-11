import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { agentConfig, db, tools as toolCatalog } from "@/db";
import { desc, eq, and, inArray } from "drizzle-orm";
import { agentChatHistory, routine, routineExecution } from "@/db/schema";
import { getNextRunAt, type RoutineSchedule } from "@/lib/routines";
import { createRoutineCalendarEvent, deleteRoutineCalendarEvent } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  try {
    const { agentId, name, description, agentImage, tools: requestedTools } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized user" },
        { status: 401 },
      );
    }

    const catalog = await db.select({ slug: toolCatalog.slug }).from(toolCatalog).where(eq(toolCatalog.isActive, true));
    const allowed = new Set(catalog.map((tool) => tool.slug.toLowerCase()));
    const selectedTools = Array.isArray(requestedTools)
      ? [...new Set(requestedTools.filter((tool): tool is string => typeof tool === "string").map((tool) => tool.toLowerCase()).filter((slug) => allowed.has(slug)))]
      : [];

    const newAgentConfig = await db
      .insert(agentConfig)
      .values({
        agentId,
        name,
        description,
        agentImage,
        tools: selectedTools,
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
    if (!getAgent[0]) return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    const schedules = await db.select({ isActive: routine.isActive, nextRunAt: routine.nextRunAt }).from(routine).where(
      and(eq(routine.agentId, agentId), eq(routine.userEmail, session.user.email)),
    );
    return NextResponse.json({
      ...getAgent[0],
      isPaused: schedules.some((item) => item.nextRunAt !== null) && schedules.every((item) => !item.isActive),
    });
  }

  const getAgents = await db
    .select()
    .from(agentConfig)
    .where(eq(agentConfig.userEmail, session?.user?.email))
    .orderBy(desc(agentConfig.createdAt));

  return NextResponse.json(getAgents);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await req.json() as { agentId?: string; action?: "duplicate" | "pause" | "reset"; paused?: boolean };
  if (!body.agentId || !body.action) return NextResponse.json({ message: "Agent and action are required." }, { status: 400 });
  const [agent] = await db.select().from(agentConfig).where(and(
    eq(agentConfig.agentId, body.agentId),
    eq(agentConfig.userEmail, session.user.email),
  ));
  if (!agent) return NextResponse.json({ message: "Agent not found" }, { status: 404 });

  if (body.action === "duplicate") {
    const [copy] = await db.insert(agentConfig).values({
      agentId: crypto.randomUUID(),
      name: `${agent.name} copy`,
      description: agent.description,
      agentImage: agent.agentImage,
      tools: agent.tools,
      userEmail: session.user.email,
    }).returning();
    return NextResponse.json({ agent: copy }, { status: 201 });
  }

  if (body.action === "reset") {
    const [updated] = await db.update(agentConfig).set({ description: "" }).where(
      and(eq(agentConfig.agentId, body.agentId), eq(agentConfig.userEmail, session.user.email)),
    ).returning();
    return NextResponse.json({ agent: updated });
  }

  if (body.action === "pause") {
    if (typeof body.paused !== "boolean") return NextResponse.json({ message: "Paused state is required." }, { status: 400 });
    const schedules = await db.select().from(routine).where(and(
      eq(routine.agentId, body.agentId),
      eq(routine.userEmail, session.user.email),
    ));
    if (body.paused) {
      try {
        for (const item of schedules) {
          const savedSchedule = item.schedule as RoutineSchedule | null;
          if (savedSchedule?.calendarEventId) {
            const result = await deleteRoutineCalendarEvent(session.user.email, savedSchedule.calendarEventId);
            if (result.status !== "deleted") {
              return NextResponse.json({ message: "Reconnect Google Calendar before pausing this agent." }, { status: 409 });
            }
          }
        }
      } catch (error) {
        console.error("Google Calendar event removal failed while pausing agent:", error);
        return NextResponse.json({ message: "Could not remove the calendar events. The agent was not paused." }, { status: 502 });
      }
    }
    const calendarSync: Array<{ routineId: number; status: string }> = [];
    for (const item of schedules) {
      const savedSchedule = item.schedule as RoutineSchedule | null;
      if (!savedSchedule) continue;
      const nextRunAt = body.paused
        ? item.nextRunAt
        : getNextRunAt(savedSchedule, item.timeZone || "UTC");
      const schedule = body.paused
        ? Object.fromEntries(Object.entries(savedSchedule).filter(([key]) => key !== "calendarEventId")) as RoutineSchedule
        : savedSchedule;
      const [updated] = await db.update(routine).set({
        isActive: !body.paused && nextRunAt !== null,
        nextRunAt,
        schedule,
      }).where(eq(routine.id, item.id)).returning();
      if (!body.paused && updated && nextRunAt) {
        try {
          const result = await createRoutineCalendarEvent({
            userEmail: session.user.email,
            agentName: agent.name,
            name: item.name,
            goal: item.goal,
            schedule,
            nextRunAt,
            timeZone: item.timeZone || "UTC",
          });
          if (result.status === "synced") {
            const syncedSchedule = { ...schedule, calendarEventId: result.eventId };
            await db.update(routine).set({ schedule: syncedSchedule }).where(eq(routine.id, item.id));
          }
          calendarSync.push({ routineId: item.id, status: result.status });
        } catch (error) {
          console.error("Google Calendar routine sync failed while resuming agent:", error);
          calendarSync.push({ routineId: item.id, status: "failed" });
        }
      }
    }
    return NextResponse.json({ paused: schedules.length > 0 && body.paused, scheduleCount: schedules.length, calendarSync });
  }

  return NextResponse.json({ message: "Unsupported action." }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const agentId = req.nextUrl.searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ message: "agentId is required." }, { status: 400 });

  const [agent] = await db.select({ agentId: agentConfig.agentId }).from(agentConfig).where(and(
    eq(agentConfig.agentId, agentId),
    eq(agentConfig.userEmail, session.user.email),
  ));
  if (!agent) return NextResponse.json({ message: "Agent not found" }, { status: 404 });

  const schedules = await db.select({ schedule: routine.schedule }).from(routine).where(and(
    eq(routine.agentId, agentId),
    eq(routine.userEmail, session.user.email),
  ));
  try {
    for (const item of schedules) {
      const savedSchedule = item.schedule as RoutineSchedule | null;
      if (savedSchedule?.calendarEventId) {
        const result = await deleteRoutineCalendarEvent(session.user.email, savedSchedule.calendarEventId);
        if (result.status !== "deleted") {
          return NextResponse.json({ message: "Reconnect Google Calendar before deleting this agent." }, { status: 409 });
        }
      }
    }
  } catch (error) {
    console.error("Google Calendar event removal failed while deleting agent:", error);
    return NextResponse.json({ message: "Could not remove the calendar events. The agent was not deleted." }, { status: 502 });
  }

  await db.transaction(async (tx) => {
    const scheduleRows = await tx.select({ id: routine.id }).from(routine).where(
      and(eq(routine.agentId, agentId), eq(routine.userEmail, session.user.email)),
    );
    const scheduleIds = scheduleRows.map((item) => item.id);
    if (scheduleIds.length) {
      await tx.delete(routineExecution).where(inArray(routineExecution.routineId, scheduleIds));
    }
    await tx.delete(routine).where(and(eq(routine.agentId, agentId), eq(routine.userEmail, session.user.email)));
    await tx.delete(agentChatHistory).where(and(eq(agentChatHistory.agentId, agentId), eq(agentChatHistory.userEmail, session.user.email)));
    await tx.delete(agentConfig).where(and(eq(agentConfig.agentId, agentId), eq(agentConfig.userEmail, session.user.email)));
  });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { agentId, name, description, agentImage, tools } = await req.json();
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
          ...(Array.isArray(tools)
            ? { tools: tools.filter((tool: unknown): tool is string => typeof tool === "string") }
            : {}),
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
