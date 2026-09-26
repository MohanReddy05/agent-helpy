"use client";

import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import type { agent } from "@/db";

const AgentContext = createContext<agent[]>([]);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<agent[]>([]);
  const pathname = usePathname();
  useEffect(() => {
    let mounted = true;
    axios
      .get<agent[]>("/api/agent")
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
