import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PlugZap } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AppSidebar from "@/components/custom/workspace/AppSidebar";
import { AgentProvider } from "@/components/custom/workspace/AgentProvider";
import { ToolDirectory } from "@/components/custom/agentspace/config/ToolDirectory";

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fmarketplace");

  return (
    <AgentProvider>
      <div className="app-canvas flex min-h-screen flex-col md:flex-row">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-5 py-8 text-[#f1f3ed] sm:px-8 sm:py-10 xl:px-10">
          <div className="mx-auto max-w-5xl">
            <header className="mb-8 flex flex-col gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7ff63]"><span className="size-1.5 rounded-full bg-[#d7ff63] shadow-[0_0_10px_#d7ff63]" /> Integrations</p>
                <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#f1f3ed]">App marketplace</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9ba59d]">Connect the services you use, then choose which agents can access them.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#d7ff63]/15 bg-[#d7ff63]/[0.06] text-[#d7ff63]"><PlugZap className="size-5" /></span>
            </header>
            <section className="rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:p-6" aria-label="Available integrations">
              <ToolDirectory />
            </section>
          </div>
        </main>
      </div>
    </AgentProvider>
  );
}
