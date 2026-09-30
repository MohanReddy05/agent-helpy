export type RoutineSchedule = {
  frequency: "once" | "daily" | "weekly" | "monthly";
  time: string;
  days?: string[];
};

const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function localTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const target = Date.UTC(year, month - 1, day, hour, minute);
  let result = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = localParts(new Date(result), timeZone);
    const observed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    const adjustment = target - observed;
    result += adjustment;
    if (adjustment === 0) break;
  }
  return new Date(result);
}

export function getNextRunAt(schedule: RoutineSchedule, timeZone = "UTC", from = new Date()): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(schedule.time);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  let nowParts: Record<string, string>;
  try {
    nowParts = localParts(from, timeZone);
  } catch {
    timeZone = "UTC";
    nowParts = localParts(from, timeZone);
  }
  const base = new Date(Date.UTC(Number(nowParts.year), Number(nowParts.month) - 1, Number(nowParts.day)));
  const selectedDays = new Set((schedule.days ?? []).map((day) => day.toLowerCase().slice(0, 3)));

  for (let offset = 0; offset <= 370; offset++) {
    const date = new Date(base.getTime() + offset * 86_400_000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const weekday = weekdayKeys[date.getUTCDay()];
    if (schedule.frequency === "once" && offset > 1) return null;
    if (schedule.frequency === "weekly" && selectedDays.size > 0 && !selectedDays.has(weekday)) continue;
    if (schedule.frequency === "monthly" && day !== Number(nowParts.day)) continue;
    const candidate = localTimeToUtc(year, month, day, hour, minute, timeZone);
    if (candidate > from) return candidate;
  }
  return null;
}
