"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import AgentConfigPanel from "@/components/custom/agentspace/AgentConfigPanel";

import { AgentConfigContext } from "@/context/AgentConfigContext";
import ChatPanel from "@/components/custom/agentspace/ChatPanel";
import { Agent } from "@/db";

export default function AgentSpace() {
  const params = useParams<{ agentId: string }>();
  const [agentConfig, setAgentConfig] = useState<Agent | null>();
  const [configurationVisible, setConfigurationVisible] = useState(true);

  useEffect(() => {
    const loadAgent = async () => {
      const result = await axios.get<Agent>(
        `/api/agent?agentId=${params.agentId}`,
      );
      setAgentConfig(result.data);
    };

    loadAgent();
  }, [params.agentId]);

  return (
    <AgentConfigContext.Provider value={{ agentConfig, setAgentConfig }}>
      <div className="flex h-screen min-h-[620px] min-w-0 bg-slate-50">
        <ChatPanel />
        {configurationVisible && (
          <AgentConfigPanel onHide={() => setConfigurationVisible(false)} />
        )}
      </div>
    </AgentConfigContext.Provider>
  );
}
