"use client";

import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { Agent } from "@/db";

const AgentContext = createContext<Agent[]>([]);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const pathname = usePathname();
  useEffect(() => {
    let mounted = true;
    axios
      .get<Agent[]>("/api/agent")
      .then(({ data }) => {
        if (mounted) setAgents(data);
      })
      .catch(() => {
        if (mounted) setAgents([]);
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  return (
    <AgentContext.Provider value={agents}>{children}</AgentContext.Provider>
  );
}

export function useAgents() {
  return useContext(AgentContext);
}
