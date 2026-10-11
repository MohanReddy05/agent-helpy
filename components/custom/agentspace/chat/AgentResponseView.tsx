"use client";

import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { AgentResponse } from "@/lib/types";

export function AgentResponseView({
  response,
  agentId,
}: {
  response: AgentResponse;
  agentId: string;
}) {
  const { type, routine, suggestedTools } = response;
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [routineSaved, setRoutineSaved] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(false);
  const [checkingRoutine, setCheckingRoutine] = useState(false);
  const [actionError, setActionError] = useState("");
  const [calendarNotice, setCalendarNotice] = useState("");

  useEffect(() => {
    if (type !== "routine" || !routine) return;
    let cancelled = false;
    const loadSavedState = async () => {
      setCheckingRoutine(true);
      try {
        const result = await axios.get("/api/routine", { params: { agentId } });
        const saved = (result.data.routines ?? []).find((item: {
          name?: string;
          goal?: string;
          instructions?: string | null;
          schedule?: { frequency?: string; time?: string; days?: string[]; calendarEventId?: string } | null;
          requiredTools?: string[] | null;
        }) => {
          const savedDays = [...(item.schedule?.days ?? [])].sort();
          const proposedDays = [...(routine.schedule.days ?? [])].sort();
          return item.name === routine.name &&
            item.goal === routine.goal &&
            item.schedule?.frequency === routine.schedule.frequency &&
            item.schedule?.time === routine.schedule.time &&
            savedDays.join(",") === proposedDays.join(",");
        });
        if (!cancelled) {
          setRoutineSaved(Boolean(saved));
          setCalendarSynced(Boolean(saved?.schedule?.calendarEventId));
        }
      } catch {
        // Keep the confirmation available when saved state cannot be checked.
      } finally {
        if (!cancelled) setCheckingRoutine(false);
      }
    };
    void loadSavedState();
    return () => {
      cancelled = true;
    };
  }, [agentId, routine, type]);

  const handleConnectTool = async (slug: string) => {
    try {
      setActionError("");
      // Calls your Composio connect endpoint
      const res = await axios.post("/api/tools/connect", { agentId, slug });
      if (res.data.redirectUrl) {
        window.location.assign(res.data.redirectUrl);
      }
    } catch (err) {
      console.error("Failed to connect tool", err);
      setActionError("Could not create a connection link. Try again from Tools or Marketplace.");
    }
  };

  const handleCreateRoutine = async () => {
    if (!routine || savingRoutine || (routineSaved && calendarSynced)) return;
    setSavingRoutine(true);
    setActionError("");
    try {
      const result = await axios.post("/api/routine", {
        agentId,
        ...routine,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setRoutineSaved(true);
      const sync = result.data.calendarSync;
      setCalendarSynced(sync?.status === "synced");
      setCalendarNotice(
        sync?.status === "synced"
          ? "This schedule is on Google Calendar."
          : sync?.status === "not_connected"
          ? "Schedule saved. Connect Google Calendar in Marketplace to add it to your calendar."
          : sync?.status === "failed"
          ? `Schedule saved, but Calendar sync failed: ${sync.message}`
          : sync?.status === "not_configured"
          ? "Schedule saved, but Google Calendar sync is not configured on this server."
          : "Schedule saved.",
      );
    } catch (err) {
      console.error("Failed to create routine", err);
      setActionError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Could not save this schedule." : "Could not save this schedule.");
    } finally {
      setSavingRoutine(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3">
      {actionError && <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/[0.08] p-2.5 text-xs text-red-200">{actionError}</p>}
      {calendarNotice && <p role="status" aria-live="polite" className="rounded-xl border border-[#d7ff63]/15 bg-[#d7ff63]/[0.05] p-2.5 text-xs text-[#c9d6ae]">{calendarNotice}</p>}
      {/* Tool Suggestion Card */}
      {suggestedTools && suggestedTools.length > 0 && (
        <div className="flex flex-col gap-2">
          {suggestedTools.map((tool) => (
            <div
              key={tool.slug}
              className="flex items-center justify-between rounded-xl border border-white/[0.1] bg-white/[0.035] p-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-[#edf0e9]">
                  {tool.name}
                </p>
                <p className="text-xs text-[#929d94]">{tool.reason}</p>
              </div>
              <button
                onClick={() => handleConnectTool(tool.slug)}
                className="flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-[#d7ff63] shadow-sm transition hover:bg-white/[0.09]"
              >
                Connect <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Routine Confirmation Card */}
      {type === "routine" && routine && (
        <div className="rounded-2xl border border-[#d7ff63]/20 bg-[#d7ff63]/[0.055] p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-[#d7ff63]">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {routineSaved ? "Schedule already set" : "Proposed Schedule"}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-[#edf0e9]">
            {routine.name}
          </h4>
          <p className="mt-1 text-xs text-[#a5afa5]">{routine.goal}</p>

          <div className="mt-3 flex gap-2">
            <span className="rounded-lg border border-white/[0.1] bg-black/10 px-2.5 py-1.5 text-xs text-[#c8d0c6]">
              Frequency: {routine.schedule.frequency}
            </span>
            <span className="rounded-lg border border-white/[0.1] bg-black/10 px-2.5 py-1.5 text-xs text-[#c8d0c6]">
              Time: {routine.schedule.time}
            </span>
          </div>

          <button
            onClick={() => void handleCreateRoutine()}
            disabled={savingRoutine || checkingRoutine || (routineSaved && calendarSynced)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d7ff63] px-4 py-2.5 text-xs font-semibold text-[#151a10] shadow-sm transition hover:bg-[#e2ff8a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {calendarSynced ? "Added to Google Calendar" : checkingRoutine ? "Checking schedule…" : savingRoutine ? "Saving schedule…" : routineSaved ? "Add to Google Calendar" : "Confirm & Schedule Routine"}
          </button>
        </div>
      )}
    </div>
  );
}
