import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { agent } from "@/db";

export function ChatHeader({ agentConfig }: { agentConfig: agent | null | undefined }) {
  const agentName = agentConfig?.name ?? "Your agent";

  return <header className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-200 px-8"><div className="flex items-center gap-3">{agentConfig?.agentImage ? <img src={agentConfig.agentImage} alt={agentName} className="size-10 rounded-xl border border-slate-200 object-cover" /> : <Avatar className="size-10 rounded-xl bg-indigo-50 text-indigo-700"><AvatarFallback className="rounded-xl bg-indigo-50 text-indigo-700"><Bot className="size-5" /></AvatarFallback></Avatar>}<div><h1 className="text-sm font-semibold text-slate-900">{agentName}</h1><p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><span className="size-1.5 rounded-full bg-emerald-500" />Ready to help</p></div></div></header>;
}
