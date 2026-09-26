"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAgents } from "@/components/custom/workspace/AgentProvider";

function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user;

  const userName = user?.name || user?.email?.split("@")[0] || "Your account";

  const initials = userName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const agents = useAgents();

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={`group/sidebar relative flex h-screen shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 text-slate-900 transition-all duration-200 ease-in-out ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo */}
      <div
        className={`mb-8 flex items-center ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/workspace")}
          className={`h-auto rounded-lg py-1 text-slate-900 hover:bg-slate-50 ${
            collapsed ? "w-10 justify-center px-0" : "justify-start gap-3 px-2"
          }`}
          aria-label="Helpy home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bot className="size-5" strokeWidth={2.2} />
          </span>

          {!collapsed && (
            <span className="text-lg font-semibold tracking-tight">Helpy</span>
          )}
        </Button>

        {/* Collapse button */}
        {!collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="size-8 shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>

      {/* Expand button */}
      {collapsed && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="mx-auto mb-6 size-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="size-4" />
        </Button>
      )}

      {/* Create Agent */}
      <Button
        size="lg"
        onClick={() => navigate("/workspace/create-agent")}
        className={`mb-8 h-11 rounded-lg text-sm font-medium text-white shadow-sm hover:bg-slate-700 ${
          collapsed ? "mx-auto w-10 px-0" : "w-full gap-2 px-3"
        }`}
        aria-label="Create New Agent"
      >
        <Plus className="size-4 shrink-0" strokeWidth={2.5} />

        {!collapsed && <span>Create New Agent</span>}
      </Button>

      {/* Agents */}
      <nav
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        aria-label="Workspace navigation"
      >
        {!collapsed && (
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
            Your Agents
          </p>
        )}

        {agents.length > 0 && (
          <div className="space-y-1">
            {agents.map((agent) => {
              const active = pathname === `/workspace/${agent.agentId}`;

              return (
                <Button
                  key={agent.agentId}
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/workspace/${agent.agentId}`)}
                  aria-current={active ? "page" : undefined}
                  aria-label={agent.name}
                  title={collapsed ? agent.name : undefined}
                  className={`group h-auto w-full rounded-lg py-2.5 text-sm font-normal transition-colors ${
                    collapsed
                      ? "justify-center px-0"
                      : "justify-start gap-3 px-2"
                  } ${
                    active
                      ? "bg-slate-200 font-medium text-slate-900 hover:bg-slate-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    <img
                      src={agent.agentImage}
                      alt={agent.name}
                      className="size-8 rounded-full object-cover"
                    />
                  </span>

                  {!collapsed && <span className="truncate">{agent.name}</span>}
                </Button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="mt-5 border-t border-slate-200 pt-4">
        {/* Marketplace */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          aria-label="Marketplace"
          title={collapsed ? "Marketplace" : undefined}
          className={`mb-3 h-auto w-full rounded-lg py-2.5 text-sm font-normal transition-colors ${
            collapsed ? "justify-center px-0" : "justify-start gap-3 px-2"
          } ${
            pathname.startsWith("/marketplace")
              ? "bg-slate-100 font-medium text-slate-900 hover:bg-slate-100"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <BriefcaseBusiness
            className="size-4 shrink-0 text-slate-500"
            strokeWidth={1.8}
          />

          {!collapsed && <span>Marketplace</span>}
        </Button>

        {/* User */}
        <div
          className={`flex items-center rounded-lg py-2 ${
            collapsed ? "justify-center px-0" : "gap-3 px-2"
          }`}
          title={collapsed ? userName : undefined}
        >
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="size-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {initials || "U"}
            </span>
          )}

          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">
                {userName}
              </span>

              <span className="block truncate text-xs text-slate-500">
                Personal workspace
              </span>
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

export default AppSidebar;
