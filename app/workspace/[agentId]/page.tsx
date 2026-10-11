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
    if (!window.matchMedia("(min-width: 1280px)").matches) {
      setConfigurationVisible(false);
    }
  }, []);

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
      <div className="app-canvas relative flex h-dvh min-h-[560px] min-w-0 overflow-hidden">
        {configurationVisible && (
          <button
            type="button"
            aria-label="Close agent configuration"
            onClick={() => setConfigurationVisible(false)}
            className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm xl:hidden"
          />
        )}
        <ChatPanel onShowConfiguration={configurationVisible ? undefined : () => setConfigurationVisible(true)} />
        {configurationVisible && <AgentConfigPanel onHide={() => setConfigurationVisible(false)} />}
      </div>
    </AgentConfigContext.Provider>
  );
}
