import { createComposioSession, getConnectedToolkitSlugs } from "@/lib/composio";
import type { RoutineSchedule } from "@/lib/routines";

const GOOGLE_CALENDAR_TOOLKIT = "googlecalendar";
const CREATE_EVENT_TOOL = "GOOGLECALENDAR_CREATE_EVENT";

const weekdayCodes: Record<string, string> = {
  mon: "MO",
  tue: "TU",
  wed: "WE",
  thu: "TH",
  fri: "FR",
  sat: "SA",
  sun: "SU",
};

function recurrenceFor(schedule: RoutineSchedule) {
  switch (schedule.frequency) {
    case "daily":
      return ["RRULE:FREQ=DAILY"];
    case "weekly": {
      const days = (schedule.days ?? [])
        .map((day) => weekdayCodes[day.toLowerCase().slice(0, 3)])
        .filter(Boolean);
      return [
        `RRULE:FREQ=WEEKLY${days.length ? `;BYDAY=${[...new Set(days)].join(",")}` : ""}`,
      ];
    }
    case "monthly":
      return ["RRULE:FREQ=MONTHLY"];
    case "once":
      return undefined;
  }
}

function findEventId(value: unknown, depth = 0): string | undefined {
  if (!value || typeof value !== "object" || depth > 4) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.id === "string" && record.id) return record.id;
  for (const child of Object.values(record)) {
    const id = findEventId(child, depth + 1);
    if (id) return id;
  }
  return undefined;
}

export async function createRoutineCalendarEvent(params: {
  userEmail: string;
  agentName: string;
  name: string;
  goal: string;
  schedule: RoutineSchedule;
  nextRunAt: Date;
  timeZone: string;
}) {
  if (!process.env.COMPOSIO_API_KEY) {
    return { status: "not_configured" as const };
  }

  const connected = await getConnectedToolkitSlugs(params.userEmail, [GOOGLE_CALENDAR_TOOLKIT]);
  if (!connected.includes(GOOGLE_CALENDAR_TOOLKIT)) {
    return { status: "not_connected" as const };
  }

  const session = await createComposioSession(
    params.userEmail,
    [GOOGLE_CALENDAR_TOOLKIT],
    "google",
  );
  const result = await session.execute(CREATE_EVENT_TOOL, {
    calendar_id: "primary",
    summary: params.name,
    description: `Agent: ${params.agentName}\n\n${params.goal}`,
    start_datetime: params.nextRunAt.toISOString(),
    event_duration_hour: 0,
    event_duration_minutes: 30,
    timezone: params.timeZone,
    recurrence: recurrenceFor(params.schedule),
  });

  if (result.error) throw new Error(result.error);
  const eventId = findEventId(result.data);
  if (!eventId) {
    throw new Error("Google Calendar created the event but did not return an event ID.");
  }

  return { status: "synced" as const, eventId };
}

export async function deleteRoutineCalendarEvent(userEmail: string, eventId: string) {
  if (!process.env.COMPOSIO_API_KEY) {
    return { status: "not_configured" as const };
  }

  const connected = await getConnectedToolkitSlugs(userEmail, [GOOGLE_CALENDAR_TOOLKIT]);
  if (!connected.includes(GOOGLE_CALENDAR_TOOLKIT)) {
    return { status: "not_connected" as const };
  }

  const session = await createComposioSession(
    userEmail,
    [GOOGLE_CALENDAR_TOOLKIT],
    "google",
  );
  const result = await session.execute("GOOGLECALENDAR_DELETE_EVENT", {
    calendar_id: "primary",
    event_id: eventId,
  });
  if (result.error) throw new Error(result.error);
  return { status: "deleted" as const };
}
