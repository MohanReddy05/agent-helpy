import { useState } from "react";
import { CalendarClock, Check, ChevronDown, Clock3, MessageCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { SectionHeading } from "./SectionHeading";

type RunMode = "manual" | "recurring" | "specific";

const frequencies = ["Every day", "Weekdays", "Every week", "Every month"];
const days = [
  { id: "mon", label: "M", name: "Monday" },
  { id: "tue", label: "T", name: "Tuesday" },
  { id: "wed", label: "W", name: "Wednesday" },
  { id: "thu", label: "T", name: "Thursday" },
  { id: "fri", label: "F", name: "Friday" },
  { id: "sat", label: "S", name: "Saturday" },
  { id: "sun", label: "S", name: "Sunday" },
];

const runModes = [
  { id: "manual" as const, icon: MessageCircle, title: "Manual", desc: "Run only when you ask" },
  { id: "recurring" as const, icon: Clock3, title: "Recurring", desc: "Run on a repeating schedule" },
  { id: "specific" as const, icon: CalendarClock, title: "Specific time", desc: "Choose a one-time run" },
];

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function ScheduleContent() {
  const [mode, setMode] = useState<RunMode>("recurring");
  const [frequency, setFrequency] = useState(frequencies[0]);
  const [showFrequencyMenu, setShowFrequencyMenu] = useState(false);
  const [time, setTime] = useState("08:00");
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(["mon", "tue", "wed", "thu", "fri"]));

  const toggleDay = (id: string) => {
    setActiveDays((previous) => {
      const next = new Set(previous);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const summary = mode === "manual"
    ? "Runs only when you ask"
    : mode === "specific"
      ? `Runs once at ${formatTime(time)}`
      : activeDays.size === 0
        ? "Pick at least one day"
        : `${frequency} at ${formatTime(time)}`;

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading title="When should Orbit run?" detail="Choose how and when your agent should execute." />
        <div role="radiogroup" aria-label="Run mode" className="space-y-2">
          {runModes.map(({ id, icon: Icon, title, desc }) => {
            const selected = mode === id;
            return (
              <button key={id} type="button" role="radio" aria-checked={selected} onClick={() => setMode(id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <span className={`flex size-9 items-center justify-center rounded-lg ${selected ? "bg-white text-indigo-600" : "bg-slate-100 text-slate-600"}`}><Icon className="size-4" /></span>
                <span className="flex-1"><span className="block text-sm font-medium text-slate-800">{title}</span><span className="text-xs text-slate-500">{desc}</span></span>
                <span className={`flex size-4 items-center justify-center rounded-full border ${selected ? "border-[5px] border-indigo-600" : "border-slate-300"}`} />
              </button>
            );
          })}
        </div>
      </section>

      {mode !== "manual" && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          {mode === "recurring" && (
            <div className="relative space-y-2">
              <Label>Frequency</Label>
              <button type="button" onClick={() => setShowFrequencyMenu((visible) => !visible)} aria-expanded={showFrequencyMenu} className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 px-3 text-sm text-slate-800">
                {frequency}<ChevronDown className={`size-4 text-slate-400 transition-transform ${showFrequencyMenu ? "rotate-180" : ""}`} />
              </button>
              {showFrequencyMenu && (
                <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                  {frequencies.map((option) => (
                    <button key={option} type="button" onClick={() => { setFrequency(option); setShowFrequencyMenu(false); }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                      {option}{option === frequency && <Check className="size-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="run-time">Time</Label>
            <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 px-3 text-sm text-slate-800">
              <input id="run-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-full bg-transparent outline-none [&::-webkit-calendar-picker-indicator]:hidden" />
              <Clock3 className="size-4 shrink-0 text-slate-400" />
            </div>
          </div>
          {mode === "recurring" && (
            <div className="space-y-2"><Label>Days</Label><div className="flex justify-between gap-1">
              {days.map(({ id, label, name }) => {
                const active = activeDays.has(id);
                return <button key={id} type="button" aria-pressed={active} aria-label={name} onClick={() => toggleDay(id)} className={`flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{label}</button>;
              })}
            </div></div>
          )}
        </section>
      )}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${mode === "recurring" && activeDays.size === 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
        <Clock3 className="size-4" />{summary}
      </div>
    </div>
  );
}
