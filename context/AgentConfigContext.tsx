import { agent } from "@/db";
import { createContext } from "react";

type AgentConfigContextType = {
  agentConfig: agent | null | undefined;
  setAgentConfig: React.Dispatch<
    React.SetStateAction<agent | null | undefined>
  >;
};

export const AgentConfigContext = createContext<AgentConfigContextType | null>(
  null,
);
