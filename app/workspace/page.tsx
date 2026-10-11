"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarClock,
  Clock3,
  Plus,
  Search,
  Wrench,
} from "lucide-react";
import { useAgents } from "@/components/custom/workspace/AgentProvider";

type RoutineSummary = {
  id: number;
  agentId: string;
  name: string;
  schedule: { frequency: string; time: string } | null;
  nextRunAt: string | null;
  isActive: boolean | null;
};

export default function WorkspacePage() {
  const agents = useAgents();
  const [query, setQuery] = useState("");
  const [schedules, setSchedules] = useState<RoutineSummary[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedules() {
      if (!agents.length) {
        setSchedules([]);
        setSchedulesError(false);
        setSchedulesLoading(false);
        return;
      }

      setSchedulesError(false);
      setSchedulesLoading(true);
      const results = await Promise.allSettled(
        agents.map((agent) =>
          axios.get<{ routines: RoutineSummary[] }>("/api/routine", {
            params: { agentId: agent.agentId },
          }),
        ),
      );

      if (cancelled) return;
      const fulfilled = results.filter(
        (result) => result.status === "fulfilled",
      );
      setSchedulesError(fulfilled.length === 0);
      setSchedules(
        results.flatMap((result) =>
          result.status === "fulfilled"
            ? (result.value.data.routines ?? [])
            : [],
        ),
      );
      setSchedulesLoading(false);
    }

    void loadSchedules();
    return () => {
      cancelled = true;
    };
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return agents;
    return agents.filter((agent) =>
      `${agent.name} ${agent.description ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [agents, query]);

  const activeSchedules = schedules
    .filter((schedule) => schedule.isActive && schedule.nextRunAt)
    .sort(
      (a, b) =>
        new Date(a.nextRunAt!).getTime() - new Date(b.nextRunAt!).getTime(),
    );
  const connectedTools = agents.reduce(
    (total, agent) =>
      total + (Array.isArray(agent.tools) ? agent.tools.length : 0),
    0,
  );
  const agentNames = new Map(
    agents.map((agent) => [agent.agentId, agent.name]),
  );

  return (
    <main className="app-canvas relative min-h-screen overflow-hidden px-5 py-8 text-[#f1f3ed] sm:px-8 sm:py-10 xl:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(220,255,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(220,255,220,0.12)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -top-52 size-[34rem] rounded-full bg-[#b4ed3d]/[0.07] blur-[120px]"
      />

      <div className="relative mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/[0.09] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7ff63]">
              <span className="size-1.5 rounded-full bg-[#d7ff63] shadow-[0_0_12px_#d7ff63]" />{" "}
              Workspace / Overview
            </p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#f1f3ed] sm:text-4xl">
              Your workspace
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9ba59d]">
              A clear view of your agents, connected tools, and scheduled work.
            </p>
          </div>
          <Link
            href="/workspace/create-agent"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e5ff9e]/30 bg-[#d7ff63] px-4 text-sm font-semibold text-[#151a10] shadow-[0_0_24px_rgba(215,255,99,0.12)] transition hover:bg-[#e2ff8a] sm:w-auto"
          >
            <Plus className="size-4" /> Create an agent
          </Link>
        </header>

        <section
          className="grid grid-cols-1 gap-3 py-6 xl:grid-cols-3"
          aria-label="Workspace summary"
        >
          <SummaryCard
            label="Agents"
            value={agents.length}
            detail="Ready to work"
            icon={<Bot className="size-[18px]" />}
          />
          <SummaryCard
            label="Connected tools"
            value={connectedTools}
            detail="Across your agents"
            icon={<Wrench className="size-[18px]" />}
          />
          <SummaryCard
            label="Active schedules"
            value={schedulesLoading ? "—" : activeSchedules.length}
            detail={
              schedulesLoading
                ? "Checking schedules"
                : schedulesError
                  ? "Could not load"
                  : "Upcoming automation"
            }
            icon={<CalendarClock className="size-[18px]" />}
          />
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.85fr)]">
          <section
            className="min-w-0 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-5"
            aria-labelledby="agents-heading"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  id="agents-heading"
                  className="text-sm font-semibold text-[#edf0e9]"
                >
                  Your agents
                </h2>
                <p className="mt-1 text-xs text-[#818c84]">
                  Open an agent to continue its work.
                </p>
              </div>
              <label className="relative block w-full sm:max-w-[15rem]">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#768178]"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find an agent"
                  aria-label="Find an agent"
                  className="h-10 w-full rounded-xl border border-white/[0.1] bg-[#0d1210]/80 pl-9 pr-3 text-sm text-[#edf0e9] outline-none placeholder:text-[#68736b] focus:border-[#d7ff63]/50 focus:ring-2 focus:ring-[#d7ff63]/10"
                />
              </label>
            </div>

            {filteredAgents.length ? (
              <div className="themed-scrollbar mt-5 grid max-h-[min(58vh,560px)] gap-3 overflow-y-auto overscroll-contain pr-2 md:grid-cols-2">
                {filteredAgents.map((agent) => (
                  <Link
                    key={agent.agentId}
                    href={`/workspace/${agent.agentId}`}
                    className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 transition hover:border-[#d7ff63]/30 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7ff63]"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/[0.09] bg-[#171e19] text-[#d7ff63]">
                      {agent.agentImage ? (
                        <img
                          src={agent.agentImage}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Bot className="size-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#edf0e9]">
                        {agent.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-[#818c84]">
                        {agent.description || "No description added"}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-[#748078] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#d7ff63]" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-white/[0.12] px-5 py-10 text-center">
                <p className="text-sm font-medium text-[#dce2da]">
                  {agents.length
                    ? "No agents match your search"
                    : "Your workspace is ready for its first agent"}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[#818c84]">
                  {agents.length
                    ? "Try a different name or description."
                    : "Create an agent to give a recurring task its own tools and instructions."}
                </p>
                {!agents.length && (
                  <Link
                    href="/workspace/create-agent"
                    className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#d7ff63] px-3 text-sm font-semibold text-[#151a10] transition hover:bg-[#e2ff8a]"
                  >
                    <Plus className="size-4" /> Create your first agent
                  </Link>
                )}
              </div>
            )}
          </section>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2 xl:grid-cols-1">
            <section
              className="min-w-0 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-5"
              aria-labelledby="schedule-heading"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2
                    id="schedule-heading"
                    className="text-sm font-semibold text-[#edf0e9]"
                  >
                    Coming up
                  </h2>
                  <p className="mt-1 text-xs text-[#818c84]">
                    Your next scheduled runs.
                  </p>
                </div>
                <CalendarClock className="size-4 text-[#d7ff63]" />
              </div>
              <div className="themed-scrollbar mt-4 max-h-[min(42vh,360px)] space-y-2.5 overflow-y-auto overscroll-contain pr-2">
                {schedulesLoading ? (
                  <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-4 text-xs text-[#818c84]">
                    Loading schedules…
                  </p>
                ) : schedulesError ? (
                  <p
                    role="status"
                    className="rounded-xl border border-red-300/15 bg-red-400/[0.06] px-3 py-4 text-xs text-[#d6a5a1]"
                  >
                    Schedules are temporarily unavailable.
                  </p>
                ) : activeSchedules.length ? (
                  activeSchedules.slice(0, 4).map((schedule) => (
                    <Link
                      key={schedule.id}
                      href={`/workspace/${schedule.agentId}`}
                      className="block rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-[#d7ff63]/25 hover:bg-white/[0.045]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 truncate text-xs font-medium text-[#e4e9e1]">
                          {schedule.name}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0 text-[#748078]" />
                      </div>
                      <span className="mt-2 flex items-center gap-1.5 text-[11px] text-[#88938a]">
                        <Clock3 className="size-3" />
                        {new Date(schedule.nextRunAt!).toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-[#68736b]">
                        {agentNames.get(schedule.agentId) ?? "Agent"}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-white/[0.1] px-3 py-5 text-center">
                    <p className="text-xs text-[#a5aea6]">
                      No active schedules yet
                    </p>
                    <p className="mt-1 text-[11px] text-[#737e75]">
                      Set one up from an agent’s Schedule settings.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              className="min-w-0 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-5"
              aria-labelledby="shortcuts-heading"
            >
              <h2
                id="shortcuts-heading"
                className="text-sm font-semibold text-[#edf0e9]"
              >
                Quick access
              </h2>
              <p className="mt-1 text-xs text-[#818c84]">
                Jump straight into setup.
              </p>
              <div className="themed-scrollbar mt-4 grid max-h-64 gap-2 overflow-y-auto overscroll-contain pr-2">
                <QuickLink
                  href="/workspace/create-agent"
                  icon={<Plus className="size-4" />}
                  title="Create an agent"
                  detail="Set up a focused assistant"
                />
                <QuickLink
                  href="/marketplace"
                  icon={<Wrench className="size-4" />}
                  title="Browse integrations"
                  detail="Connect the tools you use"
                />
                {agents[0] && (
                  <QuickLink
                    href={`/workspace/${agents[0].agentId}`}
                    icon={<ArrowRight className="size-4" />}
                    title="Open your latest agent"
                    detail={agents[0].name}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-white/[0.09] bg-white/[0.03] px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:px-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#d7ff63]/15 bg-[#d7ff63]/[0.06] text-[#d7ff63]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-[#8b968d]">{label}</span>
        <span className="mt-0.5 flex items-baseline gap-2">
          <span className="text-2xl font-medium tracking-tight text-[#f1f3ed]">
            {value}
          </span>
          <span className="truncate text-[11px] text-[#737e75]">{detail}</span>
        </span>
      </span>
    </article>
  );
}

function QuickLink({
  href,
  icon,
  title,
  detail,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 transition hover:border-[#d7ff63]/25 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7ff63]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#aeb7ac] transition group-hover:bg-[#d7ff63]/[0.08] group-hover:text-[#d7ff63]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-[#e4e9e1]">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#7f8a81]">
          {detail}
        </span>
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-[#68736b] transition group-hover:text-[#d7ff63]" />
    </Link>
  );
}
