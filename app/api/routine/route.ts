import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { agentConfig, routine, tools as toolCatalog } from "@/db/schema";
import { getNextRunAt, type RoutineSchedule } from "@/lib/routines";
import { createRoutineCalendarEvent, deleteRoutineCalendarEvent } from "@/lib/googleCalendar";

const validFrequency = (value: unknown): value is RoutineSchedule["frequency"] =>
  value === "once" || value === "daily" || value === "weekly" || value === "monthly";

async function syncCalendarForRoutine(
  item: typeof routine.$inferSelect,
  agentName: string,
) {
  const savedSchedule = item.schedule as RoutineSchedule | null;
  if (savedSchedule?.calendarEventId) {
    return {
      routine: item,
      calendarSync: { status: "synced" as const, eventId: savedSchedule.calendarEventId },
    };
  }
  if (!item.isActive || !item.nextRunAt || !savedSchedule) {
    return { routine: item, calendarSync: { status: "inactive" as const } };
  }

  try {
    const result = await createRoutineCalendarEvent({
      userEmail: item.userEmail,
      agentName,
      name: item.name,
      goal: item.goal,
      schedule: savedSchedule,
      nextRunAt: item.nextRunAt,
      timeZone: item.timeZone || "UTC",
    });
    if (result.status !== "synced") {
      return { routine: item, calendarSync: result };
    }

    const updatedSchedule = { ...savedSchedule, calendarEventId: result.eventId };
    const [updated] = await db.update(routine).set({ schedule: updatedSchedule }).where(
      and(eq(routine.id, item.id), eq(routine.userEmail, item.userEmail)),
    ).returning();
    return {
      routine: updated ?? { ...item, schedule: updatedSchedule },
      calendarSync: result,
    };
  } catch (error) {
    console.error("Google Calendar routine sync failed:", error);
    return {
      routine: item,
      calendarSync: {
        status: "failed" as const,
        message: error instanceof Error ? error.message : "Could not add this schedule to Google Calendar.",
      },
    };
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) return NextResponse.json({ error: "agentId is required." }, { status: 400 });
  const [agent] = await db.select({ agentId: agentConfig.agentId }).from(agentConfig).where(
    and(eq(agentConfig.agentId, agentId), eq(agentConfig.userEmail, email)),
  );
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const schedules = await db.select().from(routine).where(
    and(eq(routine.agentId, agentId), eq(routine.userEmail, email)),
  );
  return NextResponse.json({ routines: schedules });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as {
    agentId?: string;
    name?: string;
    goal?: string;
    instructions?: string;
    schedule?: Partial<RoutineSchedule>;
    tools?: unknown;
    timeZone?: string;
  };
  if (!body.agentId || !body.name?.trim() || !body.goal?.trim() || !body.schedule ||
    !validFrequency(body.schedule.frequency) || !/^\d{2}:\d{2}$/.test(body.schedule.time || "")) {
    return NextResponse.json({ error: "A name, task, valid frequency, and time are required." }, { status: 400 });
  }
  const [agent] = await db.select().from(agentConfig).where(
    and(eq(agentConfig.agentId, body.agentId), eq(agentConfig.userEmail, email)),
  );
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const schedule: RoutineSchedule = {
    frequency: body.schedule.frequency,
    time: body.schedule.time,
    days: Array.isArray(body.schedule.days) ? body.schedule.days.filter((day): day is string => typeof day === "string") : [],
  };
  if (schedule.frequency === "weekly" && schedule.days?.length === 0) {
    return NextResponse.json({ error: "Choose at least one day for a weekly schedule." }, { status: 400 });
  }
  const timeZone = body.timeZone || "UTC";
  const nextRunAt = getNextRunAt(schedule, timeZone);
  if (!nextRunAt) return NextResponse.json({ error: "Could not calculate the next run time." }, { status: 400 });
  const activeTools = Array.isArray(agent.tools)
    ? agent.tools.filter((slug): slug is string => typeof slug === "string").map((slug) => slug.toLowerCase())
    : [];
  const catalog = await db.select({ slug: toolCatalog.slug }).from(toolCatalog).where(eq(toolCatalog.isActive, true));
  const requestedTools = body.tools === undefined
    ? activeTools
    : Array.isArray(body.tools)
    ? body.tools.filter((slug): slug is string => typeof slug === "string").map((slug) => slug.toLowerCase())
    : [];
  const requiredTools = requestedTools.filter((slug) => activeTools.includes(slug) && catalog.some((item) => item.slug.toLowerCase() === slug));
  const existingSchedules = await db.select().from(routine).where(
    and(eq(routine.agentId, body.agentId), eq(routine.userEmail, email)),
  );
  const sameSet = (left: string[], right: string[]) => [...left].sort().join(",") === [...right].sort().join(",");
  const existing = existingSchedules.find((item) => {
    const savedSchedule = item.schedule as RoutineSchedule | null;
    return item.name === body.name!.trim() &&
      item.goal === body.goal!.trim() &&
      savedSchedule?.frequency === schedule.frequency &&
      savedSchedule?.time === schedule.time &&
      sameSet(savedSchedule?.days ?? [], schedule.days ?? []);
  });
  if (existing) {
    const synced = await syncCalendarForRoutine(existing, agent.name);
    return NextResponse.json({ ...synced, alreadyExists: true });
  }

  const [created] = await db.insert(routine).values({
    agentId: body.agentId,
    userEmail: email,
    name: body.name.trim(),
    goal: body.goal.trim(),
    instructions: body.instructions?.trim() || body.goal.trim(),
    schedule,
    timeZone,
    requiredTools,
    isActive: true,
    nextRunAt,
  }).returning();
  const synced = await syncCalendarForRoutine(created, agent.name);
  return NextResponse.json(synced, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { id?: number; isActive?: boolean };
  if (!body.id || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "A routine id and active state are required." }, { status: 400 });
  }
  const [current] = await db.select().from(routine).where(
    and(eq(routine.id, body.id), eq(routine.userEmail, email)),
  );
  if (!current) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  const currentSchedule = current.schedule as RoutineSchedule | null;
  if (!currentSchedule) return NextResponse.json({ error: "Schedule data is missing." }, { status: 409 });

  if (!body.isActive && currentSchedule.calendarEventId) {
    try {
      const deletion = await deleteRoutineCalendarEvent(email, currentSchedule.calendarEventId);
      if (deletion.status !== "deleted") {
        return NextResponse.json({ error: "Reconnect Google Calendar before pausing this schedule." }, { status: 409 });
      }
    } catch (error) {
      console.error("Google Calendar event removal failed:", error);
      return NextResponse.json({ error: "Could not remove the calendar event. The schedule was not paused." }, { status: 502 });
    }
  }

  const nextRunAt = body.isActive
    ? getNextRunAt(currentSchedule, current.timeZone || "UTC")
    : current.nextRunAt;
  if (body.isActive && !nextRunAt) return NextResponse.json({ error: "Could not calculate the next run time." }, { status: 400 });
  const updatedSchedule = body.isActive
    ? currentSchedule
    : Object.fromEntries(Object.entries(currentSchedule).filter(([key]) => key !== "calendarEventId")) as RoutineSchedule;
  const [updated] = await db.update(routine).set({ isActive: body.isActive, nextRunAt, schedule: updatedSchedule }).where(
    and(eq(routine.id, body.id), eq(routine.userEmail, email)),
  ).returning();
  if (body.isActive && updated) {
    const [agent] = await db.select({ name: agentConfig.name }).from(agentConfig).where(
      and(eq(agentConfig.agentId, current.agentId), eq(agentConfig.userEmail, email)),
    );
    const synced = await syncCalendarForRoutine(updated, agent?.name || "Agent");
    return NextResponse.json(synced);
  }
  return NextResponse.json({ routine: updated, calendarSync: { status: "removed" } });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "A valid routine id is required." }, { status: 400 });
  const [current] = await db.select().from(routine).where(
    and(eq(routine.id, id), eq(routine.userEmail, email)),
  );
  if (!current) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  const savedSchedule = current.schedule as RoutineSchedule | null;
  if (savedSchedule?.calendarEventId) {
    try {
      const deletion = await deleteRoutineCalendarEvent(email, savedSchedule.calendarEventId);
      if (deletion.status !== "deleted") {
        return NextResponse.json({ error: "Reconnect Google Calendar before deleting this schedule." }, { status: 409 });
      }
    } catch (error) {
      console.error("Google Calendar event removal failed:", error);
      return NextResponse.json({ error: "Could not remove the calendar event. The schedule was not deleted." }, { status: 502 });
    }
  }
  await db.delete(routine).where(
    and(eq(routine.id, id), eq(routine.userEmail, email)),
  );
  return NextResponse.json({ success: true, calendarSync: { status: "removed" } });
}
