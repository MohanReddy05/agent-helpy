import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AppSidebar from "@/components/custom/workspace/AppSidebar";
import { AgentProvider } from "@/components/custom/workspace/AgentProvider";
import { ToolDirectory } from "@/components/custom/agentspace/config/ToolDirectory";

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/sign-in?callbackUrl=%2Fmarketplace");

  return (
    <AgentProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-10 sm:px-10">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Integrations</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">App marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Connect the services you use. Once connected, choose which agents can access each app from their Tools settings.</p>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <ToolDirectory />
            </section>
          </div>
        </main>
      </div>
    </AgentProvider>
  );
}
