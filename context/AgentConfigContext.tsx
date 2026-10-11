import type { Agent } from "@/db";
import { createContext } from "react";

type AgentConfigContextType = {
  agentConfig: Agent | null | undefined;
  setAgentConfig: React.Dispatch<
    React.SetStateAction<Agent | null | undefined>
  >;
};

export const AgentConfigContext = createContext<AgentConfigContextType | null>(
  null,
);
