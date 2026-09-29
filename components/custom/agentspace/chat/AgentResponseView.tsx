"use client";

import { Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import axios from "axios";
import { AgentResponse } from "@/lib/types";

export function AgentResponseView({
  response,
  agentId,
}: {
  response: AgentResponse;
  agentId: string;
}) {
  const { type, routine, suggestedTools } = response;

  const handleConnectTool = async (slug: string) => {
    try {
      // Calls your Composio connect endpoint
      const res = await axios.post("/api/tools/connect", { agentId, slug });
      if (res.data.redirectUrl) {
        window.open(res.data.redirectUrl, "_blank", "width=600,height=700");
      }
    } catch (err) {
      console.error("Failed to connect tool", err);
    }
  };

  const handleCreateRoutine = async () => {
    if (!routine) return;
    try {
      // Saves the routine to Drizzle for Inngest scheduling
      await axios.post("/api/routine", { agentId, ...routine });
      alert(
        "Routine successfully scheduled! It will now run in the background.",
      );
    } catch (err) {
      console.error("Failed to create routine", err);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Tool Suggestion Card */}
      {suggestedTools && suggestedTools.length > 0 && (
        <div className="flex flex-col gap-2">
          {suggestedTools.map((tool) => (
            <div
              key={tool.slug}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {tool.name}
                </p>
                <p className="text-xs text-slate-500">{tool.reason}</p>
              </div>
              <button
                onClick={() => handleConnectTool(tool.slug)}
                className="flex items-center gap-1 rounded-md bg-white border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                Connect <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Routine Confirmation Card */}
      {type === "routine" && routine && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-blue-700">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Proposed Schedule
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-900">
            {routine.name}
          </h4>
          <p className="mt-1 text-xs text-slate-600">{routine.goal}</p>

          <div className="mt-3 flex gap-2">
            <span className="rounded bg-white border border-blue-100 px-2 py-1 text-xs text-slate-700">
              Frequency: {routine.schedule.frequency}
            </span>
            <span className="rounded bg-white border border-blue-100 px-2 py-1 text-xs text-slate-700">
              Time: {routine.schedule.time}
            </span>
          </div>

          <button
            onClick={handleCreateRoutine}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirm & Schedule Routine
          </button>
        </div>
      )}
    </div>
  );
}
