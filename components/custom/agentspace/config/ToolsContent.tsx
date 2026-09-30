"use client";

import { useContext } from "react";
import { useParams } from "next/navigation";
import { AgentConfigContext } from "@/context/AgentConfigContext";
import { SectionHeading } from "./SectionHeading";
import { ToolDirectory } from "./ToolDirectory";

export function ToolsContent() {
  const context = useContext(AgentConfigContext);
  const params = useParams<{ agentId?: string }>();
  const agentId = context?.agentConfig?.agentId || params.agentId;

  return (
    <div>
      <SectionHeading title="Agent tools" detail="Marketplace connections are shared. Add or remove an app here to change only this agent's access." />
      <ToolDirectory agentId={agentId} />
    </div>
  );
}
