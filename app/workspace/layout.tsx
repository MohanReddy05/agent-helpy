import React from "react";
import AppSidebar from "@/components/custom/workspace/AppSidebar";
import { AgentProvider } from "@/components/custom/workspace/AgentProvider";

function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AppSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AgentProvider>
  );
}

export default WorkspaceLayout;
