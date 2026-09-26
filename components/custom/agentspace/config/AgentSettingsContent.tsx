import { useState } from "react";
import { AlertTriangle, ChevronDown, Clock3, Copy, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";

const options = [
  { title: "Duplicate agent", description: "Create a copy with the same setup", icon: Copy },
  { title: "Pause agent", description: "Temporarily stop scheduled runs", icon: Clock3 },
  { title: "Reset agent", description: "Restore the default instructions", icon: RotateCcw },
];

export function AgentSettingsContent({ agentName }: { agentName: string }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading title="General options" detail="Manage how your agent is set up." />
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-3">
          {options.map(({ title, description, icon: Icon }) => (
            <button key={title} type="button" className="flex w-full items-center gap-3 py-3 text-left">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-800">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
              <ChevronDown className="size-4 -rotate-90 text-slate-400" />
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-red-200 bg-white p-4">
        <div className="mb-4">
          <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] font-semibold uppercase tracking-wider text-red-600">Danger zone</Badge>
          <p className="mt-2 text-xs leading-5 text-slate-500">Deleting this agent will permanently remove its configuration.</p>
        </div>
        {confirmingDelete ? (
          <div className="space-y-2 rounded-lg bg-red-50 p-3">
            <div className="flex items-start gap-2 text-xs text-red-700"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>Delete &ldquo;{agentName}&rdquo; and its configuration? This can&rsquo;t be undone.</p></div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="h-8 flex-1 rounded-lg text-xs" onClick={() => setConfirmingDelete(false)}>Yes, delete</Button>
              <Button variant="outline" size="sm" className="h-8 flex-1 rounded-lg text-xs" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmingDelete(true)}><Trash2 className="size-4" />Delete Agent</Button>
        )}
      </section>
    </div>
  );
}
