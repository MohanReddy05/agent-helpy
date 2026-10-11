"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { AlertTriangle, Clock3, Copy, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";
import { AgentConfigContext } from "@/context/AgentConfigContext";

export function AgentSettingsContent({ agentName }: { agentName: string }) {
  const router = useRouter();
  const context = useContext(AgentConfigContext);
  const agentId = context?.agentConfig?.agentId;
  const [paused, setPaused] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!agentId) return;
    axios.get("/api/agent", { params: { agentId } }).then((result) => setPaused(Boolean(result.data.isPaused))).catch(() => undefined);
  }, [agentId]);

  const runAction = async (action: "duplicate" | "pause" | "reset") => {
    if (!agentId) return;
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const result = await axios.patch("/api/agent", {
        agentId,
        action,
        ...(action === "pause" ? { paused: !paused } : {}),
      });
      if (action === "pause") {
        setPaused(result.data.paused);
        const syncResults = result.data.calendarSync as Array<{ status: string }> | undefined;
        if (result.data.paused) setNotice("Scheduled runs paused and removed from Google Calendar.");
        else if (syncResults?.some((item) => item.status === "failed")) setNotice("Scheduled runs resumed, but one or more Calendar events could not be added.");
        else if (syncResults?.some((item) => item.status === "not_connected")) setNotice("Scheduled runs resumed. Connect Google Calendar in Marketplace to sync them.");
        else if (syncResults?.some((item) => item.status === "not_configured")) setNotice("Scheduled runs resumed, but Google Calendar sync is not configured on this server.");
        else if (syncResults?.length) setNotice("Scheduled runs resumed and synced to Google Calendar.");
        else setNotice("Scheduled runs resumed.");
      }
      if (action === "reset") {
        context?.setAgentConfig((current) => current ? { ...current, description: "" } : current);
      }
      if (action === "duplicate" && result.data.agent?.agentId) {
        router.push(`/workspace/${result.data.agent.agentId}`);
        router.refresh();
      }
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.message ?? "Could not update the agent." : "Could not update the agent.");
    } finally {
      setBusy(null);
    }
  };

  const deleteAgent = async () => {
    if (!agentId) return;
    setBusy("delete");
    setError("");
    try {
      await axios.delete("/api/agent", { params: { agentId } });
      router.push("/workspace");
      router.refresh();
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.message ?? "Could not delete the agent." : "Could not delete the agent.");
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading title="General options" detail="Manage this agent and its scheduled work." />
        <div className="space-y-2 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-3">
          <Button variant="outline" disabled={Boolean(busy)} onClick={() => void runAction("duplicate")} className="w-full justify-start gap-3 border-white/[0.1] bg-white/[0.035] text-[#dce2da] hover:bg-white/[0.08] hover:text-white">
            {busy === "duplicate" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
            Duplicate agent
          </Button>
          <Button variant="outline" disabled={Boolean(busy)} onClick={() => void runAction("pause")} className="w-full justify-start gap-3 border-white/[0.1] bg-white/[0.035] text-[#dce2da] hover:bg-white/[0.08] hover:text-white">
            {busy === "pause" ? <Loader2 className="size-4 animate-spin" /> : <Clock3 className="size-4" />}
            {paused ? "Resume scheduled runs" : "Pause scheduled runs"}
          </Button>
          <Button variant="outline" disabled={Boolean(busy)} onClick={() => void runAction("reset")} className="w-full justify-start gap-3 border-white/[0.1] bg-white/[0.035] text-[#dce2da] hover:bg-white/[0.08] hover:text-white">
            {busy === "reset" ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
            Reset agent instructions
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-300/20 bg-red-400/[0.035] p-4">
        <div className="mb-4">
          <Badge variant="outline" className="border-red-300/20 bg-red-400/[0.08] text-[10px] font-semibold uppercase tracking-wider text-red-200">Danger zone</Badge>
          <p className="mt-2 text-xs leading-5 text-[#929d94]">Deleting removes {agentName}&rsquo;s chat history, schedules, and execution logs.</p>
        </div>
        {confirmingDelete ? (
          <div className="space-y-2 rounded-xl border border-red-300/15 bg-red-400/[0.06] p-3">
            <div className="flex items-start gap-2 text-xs text-red-200"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>Delete &ldquo;{agentName}&rdquo; and its configuration? This can&rsquo;t be undone.</p></div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="h-8 flex-1 rounded-lg text-xs" disabled={Boolean(busy)} onClick={() => void deleteAgent()}>{busy === "delete" ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}Yes, delete</Button>
              <Button variant="outline" size="sm" className="h-8 flex-1 rounded-lg text-xs" disabled={Boolean(busy)} onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" disabled={Boolean(busy)} className="w-full border-red-300/25 bg-transparent text-red-200 hover:bg-red-400/[0.08] hover:text-red-100" onClick={() => setConfirmingDelete(true)}><Trash2 className="size-4" />Delete Agent</Button>
        )}
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/[0.08] p-3 text-xs text-red-200">{error}</p>}
      {notice && <p role="status" aria-live="polite" className="rounded-xl border border-[#d7ff63]/15 bg-[#d7ff63]/[0.05] p-3 text-xs text-[#c9d6ae]">{notice}</p>}
    </div>
  );
}
