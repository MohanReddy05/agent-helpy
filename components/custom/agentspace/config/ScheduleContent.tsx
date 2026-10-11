"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CalendarCheck2, CalendarClock, Clock3, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "./SectionHeading";

type Routine = {
  id: number;
  name: string;
  goal: string;
  schedule: { frequency: "once" | "daily" | "weekly" | "monthly"; time: string; days?: string[]; calendarEventId?: string };
  nextRunAt: string | null;
  isActive: boolean | null;
};

const weekdays = [
  ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"],
  ["thu", "Thursday"], ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
];

export function ScheduleContent({ agentId }: { agentId?: string }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [frequency, setFrequency] = useState<Routine["schedule"]["frequency"]>("daily");
  const [time, setTime] = useState("08:00");
  const [days, setDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [calendarNotice, setCalendarNotice] = useState("");

  const load = useCallback(async () => {
    if (!agentId) return;
    try {
      const result = await axios.get("/api/routine", { params: { agentId } });
      setRoutines(result.data.routines ?? []);
    } catch {
      setError("Could not load this agent's schedules.");
    }
  }, [agentId]);

  useEffect(() => { void load(); }, [load]);

  const createSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agentId || !name.trim() || !goal.trim()) return;
    setBusy(true);
    setError("");
    setCalendarNotice("");
    try {
      const result = await axios.post("/api/routine", {
        agentId,
        name,
        goal,
        instructions: goal,
        schedule: { frequency, time, days: frequency === "weekly" ? days : [] },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setName("");
      setGoal("");
      const sync = result.data.calendarSync;
      setCalendarNotice(
        sync?.status === "synced"
          ? "Added to Google Calendar."
          : sync?.status === "not_connected"
          ? "Schedule saved. Connect Google Calendar in Marketplace to add it to your calendar."
          : sync?.status === "failed"
          ? `Schedule saved, but Calendar sync failed: ${sync.message}`
          : sync?.status === "not_configured"
          ? "Schedule saved, but Google Calendar sync is not configured on this server."
          : "Schedule saved.",
      );
      await load();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not save the schedule." : "Could not save the schedule.");
    } finally {
      setBusy(false);
    }
  };

  const syncToCalendar = async (item: Routine) => {
    if (!agentId) return;
    setBusy(true);
    setError("");
    setCalendarNotice("");
    try {
      const result = await axios.post("/api/routine", {
        agentId,
        name: item.name,
        goal: item.goal,
        instructions: item.goal,
        schedule: item.schedule,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      const sync = result.data.calendarSync;
      setCalendarNotice(
        sync?.status === "synced"
          ? "Added to Google Calendar."
          : sync?.status === "not_connected"
          ? "Connect Google Calendar in Marketplace, then try again."
          : sync?.status === "failed"
          ? `Calendar sync failed: ${sync.message}`
          : sync?.status === "not_configured"
          ? "Google Calendar sync is not configured on this server."
          : "This schedule is not active, so it cannot be added to Calendar yet.",
      );
      await load();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not sync this schedule to Google Calendar." : "Could not sync this schedule to Google Calendar.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: Routine) => {
    setBusy(true);
    setError("");
    try {
      const result = await axios.patch("/api/routine", { id: item.id, isActive: !item.isActive });
      const sync = result.data.calendarSync;
      if (sync?.status === "synced") setCalendarNotice("Schedule resumed and added to Google Calendar.");
      else if (sync?.status === "removed") setCalendarNotice("Schedule paused and removed from Google Calendar.");
      else if (sync?.status === "not_connected") setCalendarNotice("Schedule resumed. Connect Google Calendar in Marketplace to sync it.");
      else if (sync?.status === "not_configured") setCalendarNotice("Schedule resumed, but Calendar sync is not configured on this server.");
      await load();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not update the schedule." : "Could not update the schedule.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Routine) => {
    setBusy(true);
    setError("");
    try {
      await axios.delete("/api/routine", { params: { id: item.id } });
      setCalendarNotice("Schedule deleted and removed from Google Calendar.");
      await load();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not remove the schedule." : "Could not remove the schedule.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading title="Agent schedule" detail="Create and manage scheduled tasks for this agent." />
        <form onSubmit={createSchedule} className="space-y-4 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-4">
          <div className="space-y-2"><Label htmlFor="schedule-name">Schedule name</Label><Input id="schedule-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Morning inbox summary" className="border-white/[0.1] bg-white/[0.035] text-[#e8ebe4] placeholder:text-[#707b72] focus-visible:border-[#d7ff63]/40 focus-visible:ring-[#d7ff63]/10" /></div>
          <div className="space-y-2"><Label htmlFor="schedule-goal">Task instructions</Label><textarea id="schedule-goal" required maxLength={2000} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Summarize new messages and highlight anything urgent." className="min-h-24 w-full resize-y rounded-xl border border-white/[0.1] bg-white/[0.035] p-3 text-sm text-[#e8ebe4] outline-none placeholder:text-[#707b72] focus-visible:border-[#d7ff63]/40 focus-visible:ring-2 focus-visible:ring-[#d7ff63]/10" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="schedule-frequency">Frequency</Label><select id="schedule-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Routine["schedule"]["frequency"])} className="h-10 w-full rounded-xl border border-white/[0.1] bg-[#151b17] px-3 text-sm text-[#e8ebe4] outline-none focus:border-[#d7ff63]/40"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
            <div className="space-y-2"><Label htmlFor="schedule-time">Local time</Label><Input id="schedule-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} className="border-white/[0.1] bg-white/[0.035] text-[#e8ebe4] focus-visible:border-[#d7ff63]/40 focus-visible:ring-[#d7ff63]/10" /></div>
          </div>
          {frequency === "weekly" && <fieldset className="space-y-2"><legend className="text-sm font-medium text-[#c5cdc4]">Run on</legend><div className="flex flex-wrap gap-2">{weekdays.map(([key, label]) => <label key={key} className="flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.025] px-2.5 py-1.5 text-xs text-[#c5cdc4]"><input type="checkbox" className="accent-[#d7ff63]" checked={days.includes(key)} onChange={() => setDays((current) => current.includes(key) ? current.filter((day) => day !== key) : [...current, key])} />{label}</label>)}</div></fieldset>}
          {error && <p role="alert" className="text-xs text-red-200">{error}</p>}
          {calendarNotice && <p role="status" aria-live="polite" className="rounded-lg border border-[#d7ff63]/15 bg-[#d7ff63]/[0.05] px-3 py-2 text-xs text-[#c9d6ae]">{calendarNotice}</p>}
          <Button type="submit" disabled={busy || !agentId || !name.trim() || !goal.trim()} className="w-full rounded-xl bg-[#d7ff63] font-semibold text-[#151a10] hover:bg-[#e2ff8a]"><Plus className="size-4" />Add schedule</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[#e8ebe4]">Saved schedules</h3>
        {routines.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d7ff63]/15 bg-[#d7ff63]/[0.06] text-[#d7ff63]"><CalendarClock className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#e8ebe4]">{item.name}</p><p className="mt-0.5 line-clamp-2 text-xs text-[#8c978e]">{item.goal}</p><p className="mt-2 flex items-center gap-1 text-[11px] text-[#838e85]"><Clock3 className="size-3" />{item.schedule.frequency} at {item.schedule.time}{item.nextRunAt ? ` · Next ${new Date(item.nextRunAt).toLocaleString()}` : ""}</p></div>
              {item.schedule.calendarEventId ? (
                <span title="Added to Google Calendar" className="mt-1 text-[#d7ff63]"><CalendarCheck2 className="size-4" /></span>
              ) : (
                <button type="button" disabled={busy} title="Add to Google Calendar" onClick={() => void syncToCalendar(item)} className="rounded-lg p-1.5 text-[#929d94] hover:bg-[#d7ff63]/[0.08] hover:text-[#d7ff63]"><CalendarClock className="size-4" /></button>
              )}
              <button type="button" disabled={busy} title={item.isActive ? "Pause schedule" : "Resume schedule"} onClick={() => void toggle(item)} className="rounded-lg p-1.5 text-[#929d94] hover:bg-white/[0.08] hover:text-[#e8ebe4]">{item.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
              <button type="button" disabled={busy} title="Delete schedule" onClick={() => void remove(item)} className="rounded-lg p-1.5 text-[#929d94] hover:bg-red-400/[0.08] hover:text-red-200"><Trash2 className="size-4" /></button>
            </div>
          </article>
        ))}
        {!routines.length && <p className="rounded-xl border border-dashed border-white/[0.12] px-4 py-6 text-center text-xs text-[#8c978e]">No scheduled tasks yet.</p>}
      </section>
    </div>
  );
}
