"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/sign-out" });
  };

  return (
    <aside
      className={`group/sidebar relative flex h-screen shrink-0 flex-col border-r border-white/[0.08] bg-[#101513] px-1.5 py-5 md:px-3 text-[#e8ebe4] transition-all duration-200 ease-in-out ${
        collapsed ? "w-14 md:w-16" : "w-14 md:w-64"
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
          className={`h-auto rounded-lg py-1 text-[#e8ebe4] hover:bg-white/[0.06] ${
            collapsed ? "w-10 justify-center px-0" : "w-10 justify-center px-0 md:w-auto md:justify-start md:gap-3 md:px-2"
          }`}
          aria-label="Helpy home"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#d7ff63] text-[#151a10] shadow-[0_0_18px_rgba(215,255,99,0.12)]">
            <Bot className="size-5" strokeWidth={2.2} />
          </span>

          {!collapsed && (
            <span className="hidden text-lg font-semibold tracking-tight md:inline">Helpy</span>
          )}
        </Button>

        {/* Collapse button */}
        {!collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="hidden size-8 shrink-0 text-[#849087] hover:bg-white/[0.07] hover:text-[#f1f3ed] md:inline-flex"
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
          className="mx-auto mb-6 hidden size-9 text-[#849087] hover:bg-white/[0.07] hover:text-[#f1f3ed] md:inline-flex"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="size-4" />
        </Button>
      )}

      {/* Create Agent */}
      <Button
        size="lg"
        onClick={() => navigate("/workspace/create-agent")}
        className={`mb-8 h-11 rounded-lg bg-[#d7ff63] text-sm font-medium text-[#151a10] shadow-[0_0_20px_rgba(215,255,99,0.12)] hover:bg-[#e2ff8a] ${
          collapsed ? "mx-auto w-10 px-0" : "mx-auto w-10 justify-center px-0 md:w-full md:justify-start md:gap-2 md:px-3"
        }`}
        aria-label="Create New Agent"
      >
        <Plus className="size-4 shrink-0" strokeWidth={2.5} />

        {!collapsed && <span className="hidden md:inline">Create New Agent</span>}
      </Button>

      {/* Agents */}
      <nav
        className="themed-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        aria-label="Workspace navigation"
      >
        {!collapsed && (
          <p className="mb-2 hidden px-2 text-xs font-semibold uppercase tracking-wider text-[#c5cdc4] md:block">
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
                      : "justify-center px-0 md:justify-start md:gap-3 md:px-2"
                  } ${
                    active
                      ? "bg-[#d7ff63]/[0.09] font-medium text-[#d7ff63] hover:bg-[#d7ff63]/[0.14]"
                      : "text-[#9ba59d] hover:bg-white/[0.06] hover:text-[#f1f3ed]"
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.07]">
                    <img
                      src={agent.agentImage}
                      alt={agent.name}
                      className="size-8 rounded-full object-cover"
                    />
                  </span>

                  {!collapsed && <span className="hidden truncate md:inline">{agent.name}</span>}
                </Button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="mt-5 border-t border-white/[0.08] pt-4">
        {/* Marketplace */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          aria-label="Marketplace"
          title={collapsed ? "Marketplace" : undefined}
          className={`mb-3 h-auto w-full rounded-lg py-2.5 text-sm font-normal transition-colors ${
            collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:gap-3 md:px-2"
          } ${
            pathname.startsWith("/marketplace")
              ? "bg-[#d7ff63]/[0.09] font-medium text-[#d7ff63] hover:bg-[#d7ff63]/[0.14]"
              : "text-[#9ba59d] hover:bg-white/[0.06] hover:text-[#f1f3ed]"
          }`}
        >
          <BriefcaseBusiness
            className="size-4 shrink-0 text-[#849087]"
            strokeWidth={1.8}
          />

          {!collapsed && <span className="hidden md:inline">Marketplace</span>}
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
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-xs font-semibold text-[#d3d9d1]">
              {initials || "U"}
            </span>
          )}

          {!collapsed && (
            <>
              <span className="hidden min-w-0 flex-1 md:block">
                <span className="block truncate text-sm font-medium text-[#e8ebe4]">
                  {userName}
                </span>

                <span className="block truncate text-xs text-[#849087]">
                  Personal workspace
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="hidden size-8 shrink-0 text-[#849087] hover:bg-red-400/10 hover:text-red-300 md:inline-flex"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          )}
        </div>
        {collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="mx-auto mt-2 hidden size-8 text-[#849087] hover:bg-red-400/10 hover:text-red-300 md:inline-flex"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="mx-auto mt-2 size-8 text-[#849087] hover:bg-red-400/10 hover:text-red-300 md:hidden"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}

export default AppSidebar;
