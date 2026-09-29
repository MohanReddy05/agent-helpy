import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AppSidebar from "@/components/custom/workspace/AppSidebar";
import { AgentProvider } from "@/components/custom/workspace/AgentProvider";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fworkspace");

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
