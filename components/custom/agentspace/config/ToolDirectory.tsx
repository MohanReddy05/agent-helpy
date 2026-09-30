"use client";

import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Search, PlugZap, Check, Loader2, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AgentConfigContext } from "@/context/AgentConfigContext";

type Toolkit = {
  slug: string;
  name: string;
  description: string;
  logo?: string;
  category?: string;
  connected: boolean;
  enabled: boolean;
};

export function ToolDirectory({ agentId }: { agentId?: string }) {
  const agentContext = useContext(AgentConfigContext);
  const [tools, setTools] = useState<Toolkit[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError("");
      const result = await axios.get("/api/tools", { params: agentId ? { agentId } : {} });
      setTools(result.data.tools ?? []);
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Tools could not be loaded." : "Tools could not be loaded.");
    }
  }, [agentId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const filteredTools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tools.filter((tool) => !needle || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(needle));
  }, [tools, query]);

  const connect = async (tool: Toolkit) => {
    setBusy(tool.slug);
    try {
      const result = await axios.post("/api/tools/connect", { slug: tool.slug, ...(agentId ? { agentId } : {}) });
      if (result.data.redirectUrl) window.location.assign(result.data.redirectUrl);
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? `Could not connect ${tool.name}.` : `Could not connect ${tool.name}.`);
      setBusy(null);
    }
  };

  const toggleAgentTool = async (tool: Toolkit) => {
    if (!agentId) return;
    setBusy(tool.slug);
    try {
      const enabled = !tool.enabled;
      await axios.patch("/api/tools", { agentId, slug: tool.slug, enabled });
      setTools((current) => current.map((item) => item.slug === tool.slug ? { ...item, enabled } : item));
      agentContext?.setAgentConfig((current) => {
        if (!current) return current;
        const currentTools = Array.isArray(current.tools) ? current.tools.filter((slug): slug is string => typeof slug === "string") : [];
        const nextTools = enabled
          ? [...new Set([...currentTools.map((slug) => slug.toLowerCase()), tool.slug])]
          : currentTools.filter((slug) => slug.toLowerCase() !== tool.slug);
        return { ...current, tools: nextTools };
      });
    } catch (cause) {
      setError(axios.isAxiosError(cause) ? cause.response?.data?.error ?? "Could not update this agent's tools." : "Could not update this agent's tools.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps" className="h-10 pl-9" aria-label="Search apps" />
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="space-y-2">
        {filteredTools.map((tool) => (
          <article key={tool.slug} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 text-indigo-600">
              {tool.logo ? <img src={tool.logo} alt="" className="size-7 object-contain" /> : <Wrench className="size-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                {tool.name}
                {tool.connected && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700"><Check className="size-3" /> Connected</span>}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-slate-500">{tool.description}</span>
              {tool.category && <span className="mt-1 block text-[10px] text-slate-400">{tool.category}</span>}
            </span>
            {agentId && tool.connected ? (
              <button type="button" disabled={busy === tool.slug} onClick={() => void toggleAgentTool(tool)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ${tool.enabled ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                {busy === tool.slug ? <Loader2 className="size-3.5 animate-spin" /> : tool.enabled ? <Check className="size-3.5" /> : null}
                {tool.enabled ? "Remove" : "Add to agent"}
              </button>
            ) : tool.connected ? (
              <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-medium text-emerald-700">{agentId ? "Shared with agents" : "Connected"}</span>
            ) : (
              <button type="button" disabled={busy === tool.slug} onClick={() => void connect(tool)} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                {busy === tool.slug ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />} Connect
              </button>
            )}
          </article>
        ))}
        {!error && tools.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Loading available apps…</p>}
        {tools.length > 0 && filteredTools.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No apps match your search.</p>}
      </div>
    </div>
  );
}
