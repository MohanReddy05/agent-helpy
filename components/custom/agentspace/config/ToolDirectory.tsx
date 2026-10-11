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
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#78847b]" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search apps" className="h-10 border-white/[0.1] bg-black/10 pl-9 text-[#e8ebe4] placeholder:text-[#718077] focus-visible:border-[#d7ff63]/40 focus-visible:ring-[#d7ff63]/10" aria-label="Search apps" />
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-300/20 bg-red-400/[0.08] px-3 py-2 text-xs text-red-200">{error}</p>}
      <div className="themed-scrollbar max-h-[min(65vh,680px)] space-y-2 overflow-y-auto overscroll-contain pr-2">
        {filteredTools.map((tool) => (
          <article key={tool.slug} className="flex flex-col items-stretch gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] p-3 transition hover:border-white/[0.14] sm:flex-row sm:items-center">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#c6d0c5]">
              {tool.logo ? <img src={tool.logo} alt="" className="size-7 object-contain" /> : <Wrench className="size-5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-[#e8ebe4]">
                <span className="min-w-0 break-words">{tool.name}</span>
                {tool.connected && <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#d7ff63]"><Check className="size-3" /> Connected</span>}
              </span>
              <span className="mt-0.5 line-clamp-2 block text-xs leading-4 text-[#8c978e]">{tool.description}</span>
              {tool.category && <span className="mt-1 block text-[10px] text-[#707b72]">{tool.category}</span>}
            </span>
            {agentId && tool.connected ? (
              <button type="button" disabled={busy === tool.slug} onClick={() => void toggleAgentTool(tool)} className={`flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium sm:h-8 sm:w-auto ${tool.enabled ? "bg-[#d7ff63] text-[#151a10] hover:bg-[#e2ff8a]" : "border border-white/[0.12] bg-white/[0.04] text-[#b9c2b8] hover:bg-white/[0.08]"}`}>
                {busy === tool.slug ? <Loader2 className="size-3.5 animate-spin" /> : tool.enabled ? <Check className="size-3.5" /> : null}
                {tool.enabled ? "Remove" : "Add to agent"}
              </button>
            ) : tool.connected ? (
              <span className="shrink-0 rounded-lg border border-[#d7ff63]/15 bg-[#d7ff63]/[0.06] px-2.5 py-2 text-xs font-medium text-[#d7ff63]">{agentId ? "Shared with agents" : "Connected"}</span>
            ) : (
              <button type="button" disabled={busy === tool.slug} onClick={() => void connect(tool)} className="flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 text-xs font-medium text-[#c5cdc4] hover:bg-white/[0.08] sm:h-8 sm:w-auto">
                {busy === tool.slug ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />} Connect
              </button>
            )}
          </article>
        ))}
        {!error && tools.length === 0 && <p className="py-8 text-center text-sm text-[#8c978e]">Loading available apps…</p>}
        {tools.length > 0 && filteredTools.length === 0 && <p className="py-8 text-center text-sm text-[#8c978e]">No apps match your search.</p>}
      </div>
    </div>
  );
}
