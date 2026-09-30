"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CalendarClock, Clock3, Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "./SectionHeading";

type Routine = {
  id: number;
  name: string;
  goal: string;
  schedule: { frequency: "once" | "daily" | "weekly" | "monthly"; time: string; days?: string[] };
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
    try {
      await axios.post("/api/routine", {
        agentId,
        name,
        goal,
        instructions: goal,
        schedule: { frequency, time, days: frequency === "weekly" ? days : [] },
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setName("");
      setGoal("");
      await load();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not save the schedule." : "Could not save the schedule.");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (item: Routine) => {
    setBusy(true);
    try {
      await axios.patch("/api/routine", { id: item.id, isActive: !item.isActive });
      await load();
    } catch {
      setError("Could not update the schedule.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: Routine) => {
    setBusy(true);
    try {
      await axios.delete("/api/routine", { params: { id: item.id } });
      await load();
    } catch {
      setError("Could not remove the schedule.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading title="Agent schedule" detail="Create and manage scheduled tasks for this agent." />
        <form onSubmit={createSchedule} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="space-y-2"><Label htmlFor="schedule-name">Schedule name</Label><Input id="schedule-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Morning inbox summary" /></div>
          <div className="space-y-2"><Label htmlFor="schedule-goal">Task instructions</Label><textarea id="schedule-goal" required maxLength={2000} value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Summarize new messages and highlight anything urgent." className="min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="schedule-frequency">Frequency</Label><select id="schedule-frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as Routine["schedule"]["frequency"])} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
            <div className="space-y-2"><Label htmlFor="schedule-time">Local time</Label><Input id="schedule-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></div>
          </div>
          {frequency === "weekly" && <fieldset className="space-y-2"><legend className="text-sm font-medium text-slate-700">Run on</legend><div className="flex flex-wrap gap-2">{weekdays.map(([key, label]) => <label key={key} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs"><input type="checkbox" checked={days.includes(key)} onChange={() => setDays((current) => current.includes(key) ? current.filter((day) => day !== key) : [...current, key])} />{label}</label>)}</div></fieldset>}
          {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={busy || !agentId || !name.trim() || !goal.trim()} className="w-full"><Plus className="size-4" />Add schedule</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Saved schedules</h3>
        {routines.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><CalendarClock className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{item.name}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.goal}</p><p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="size-3" />{item.schedule.frequency} at {item.schedule.time}{item.nextRunAt ? ` · Next ${new Date(item.nextRunAt).toLocaleString()}` : ""}</p></div>
              <button type="button" disabled={busy} title={item.isActive ? "Pause schedule" : "Resume schedule"} onClick={() => void toggle(item)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">{item.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}</button>
              <button type="button" disabled={busy} title="Delete schedule" onClick={() => void remove(item)} className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="size-4" /></button>
            </div>
          </article>
        ))}
        {!routines.length && <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">No scheduled tasks yet.</p>}
      </section>
    </div>
  );
}
