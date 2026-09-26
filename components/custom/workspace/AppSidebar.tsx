"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bot, BriefcaseBusiness, Compass, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import axios from "axios";
import { agent } from "@/db";

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "Your account";
  const initials = userName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const [agents, setAgents] = useState<agent[]>([]);
  useEffect(() => {
    GetUserAgents();
  }, [pathname]);
  const GetUserAgents = async () => {
    const result = await axios.get("/api/agent");
    setAgents(result.data);
    console.log(result.data);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 text-slate-900">
      <Button
        variant="ghost"
        onClick={() => router.push("/workspace")}
        className="mb-8 h-auto justify-start gap-3 rounded-lg px-2 py-1 text-slate-900 hover:bg-slate-50"
        aria-label="Helpy home"
      >
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Bot className="size-5" strokeWidth={2.2} />
        </span>
        <span className="text-lg font-semibold tracking-tight">Helpy</span>
      </Button>

      <Button
        size="lg"
        onClick={() => router.push("/workspace/create-agent")}
        className="mb-8 h-11 w-full gap-2 rounded-lg  px-3 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
      >
        <Plus className="size-4" strokeWidth={2.5} />
        Create New Agent
      </Button>

      <nav className="min-h-0 flex-1" aria-label="Workspace navigation">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
          Your Agents
        </p>
        {agents.length > 0 ? (
          <div className="space-y-1">
            {agents.map((agent) => {
              const active = pathname === `/workspace/${agent.agentId}`;

              return (
                <Button
                  key={agent.agentId}
                  type="button"
                  variant="ghost"
                  onClick={() => router.push(`/workspace/${agent.agentId}`)}
                  aria-current={active ? "page" : undefined}
                  className={`group h-auto w-full justify-start gap-3 rounded-lg px-2 py-2.5 text-sm font-normal transition-colors ${
                    active
                      ? "bg-slate-200 font-medium text-slate-900 hover:bg-slate-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={agent.agentImage}
                      alt={agent.name}
                      className="size-8 object-cover rounded-full "
                    />
                  </span>

                  <span className="truncate">{agent.name}</span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div></div>
        )}
      </nav>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/marketplace")}
          className={`mb-3 h-auto w-full justify-start gap-3 rounded-lg px-2 py-2.5 text-sm font-normal transition-colors ${
            pathname.startsWith("/marketplace")
              ? "bg-slate-100 font-medium text-slate-900 hover:bg-slate-100"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
          aria-current={
            pathname.startsWith("/marketplace") ? "page" : undefined
          }
        >
          <BriefcaseBusiness
            className="size-4 text-slate-500"
            strokeWidth={1.8}
          />
          Marketplace
        </Button>
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {initials || "U"}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-800">
              {userName}
            </span>
            <span className="block truncate text-xs text-slate-500">
              Personal workspace
            </span>
          </span>
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
