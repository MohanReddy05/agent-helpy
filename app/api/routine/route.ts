import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { agentConfig, routine, tools as toolCatalog } from "@/db/schema";
import { getNextRunAt, type RoutineSchedule } from "@/lib/routines";

const validFrequency = (value: unknown): value is RoutineSchedule["frequency"] =>
  value === "once" || value === "daily" || value === "weekly" || value === "monthly";

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
  return NextResponse.json({ routine: created }, { status: 201 });
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
  const nextRunAt = body.isActive
    ? getNextRunAt(current.schedule as RoutineSchedule, current.timeZone || "UTC")
    : current.nextRunAt;
  if (body.isActive && !nextRunAt) return NextResponse.json({ error: "Could not calculate the next run time." }, { status: 400 });
  const [updated] = await db.update(routine).set({ isActive: body.isActive, nextRunAt }).where(
    and(eq(routine.id, body.id), eq(routine.userEmail, email)),
  ).returning();
  return NextResponse.json({ routine: updated });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "A valid routine id is required." }, { status: 400 });
  const [deleted] = await db.delete(routine).where(
    and(eq(routine.id, id), eq(routine.userEmail, email)),
  ).returning({ id: routine.id });
  if (!deleted) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
