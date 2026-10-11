import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Bot, Check, Plus, Wrench } from "lucide-react";
import { authOptions } from "./api/auth/[...nextauth]/route";

const features = [
  { number: "01", title: "Focused agents", text: "Give each assistant a clear role, useful context, and the tools it needs." },
  { number: "02", title: "One space per task", text: "Keep instructions and conversations together, so it’s easy to pick work back up." },
  { number: "03", title: "Work on a rhythm", text: "Set up recurring tasks and let your agents handle the routine parts." },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/workspace");

  return (
    <main className="app-canvas min-h-screen overflow-hidden text-[#f1f3ed]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(220,255,220,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(220,255,220,0.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-52 size-[38rem] rounded-full bg-[#b4ed3d]/[0.07] blur-[130px]" />

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-[#f1f3ed]">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#d7ff63] text-sm font-bold text-[#151a10] shadow-[0_0_20px_rgba(215,255,99,0.12)]">H</span>
          Helpy
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
          <Link href="/sign-in" className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#a9b2a9] transition hover:bg-white/[0.05] hover:text-white sm:px-4">Sign in</Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-[#d7ff63] px-3.5 py-2.5 text-sm font-semibold text-[#151a10] shadow-[0_0_22px_rgba(215,255,99,0.12)] transition hover:bg-[#e2ff8a] sm:px-4">Get started <ArrowRight className="size-4" /></Link>
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,0.95fr)] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.035] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bac4b8] shadow-sm">
            <span className="size-1.5 rounded-full bg-[#d7ff63] shadow-[0_0_10px_#d7ff63]" /> A thoughtful space for useful work
          </div>
          <h1 className="mt-6 text-[2.8rem] font-medium leading-[1.05] tracking-[-0.055em] text-[#f1f3ed] sm:text-6xl lg:text-[4.25rem]">
            Make room for <span className="text-[#d7ff63]">better work.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#a0aaa1] sm:text-lg sm:leading-8">
            Build focused AI agents for the tasks that take up your day. Give each one the right tools, guidance, and a place to work with you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-[#d7ff63] px-5 py-3.5 text-sm font-semibold text-[#151a10] shadow-[0_0_24px_rgba(215,255,99,0.13)] transition hover:-translate-y-0.5 hover:bg-[#e2ff8a]">Create your workspace <ArrowRight className="size-4" /></Link>
            <Link href="/sign-in" className="rounded-xl px-4 py-3.5 text-sm font-medium text-[#a9b2a9] transition hover:bg-white/[0.05] hover:text-white">I already have an account</Link>
          </div>
          <p className="mt-5 text-xs text-[#717c73]">A calmer way to get the repeatable work done.</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl" aria-label="Preview of the Helpy workspace">
          <div aria-hidden="true" className="absolute -inset-5 rounded-[2.5rem] bg-[#d7ff63]/[0.045] blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.12] bg-[#121815]/90 shadow-[0_32px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.09] px-4 py-3.5 sm:px-5">
              <div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-[#d7ff63] text-[#151a10]"><Bot className="size-4" /></span><span className="text-sm font-medium text-[#e8ebe4]">Your workspace</span></div>
              <span className="flex items-center gap-2 text-[10px] font-medium text-[#8d988f]"><i className="size-1.5 rounded-full bg-[#d7ff63]" /> ONLINE</span>
            </div>
            <div className="grid min-h-[330px] grid-cols-[8.5rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)]">
              <aside className="border-r border-white/[0.08] bg-white/[0.018] p-3 sm:p-4">
                <div className="mb-5 flex items-center gap-2 rounded-lg bg-[#d7ff63] px-2.5 py-2 text-[10px] font-semibold text-[#151a10]"><Plus className="size-3.5" /> New agent</div>
                <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#69746c]">Your agents</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.05] p-2 text-[10px] text-[#e2e8df]"><span className="flex size-6 items-center justify-center rounded-md bg-[#d7ff63]/10 text-[#d7ff63]"><Bot className="size-3.5" /></span><span className="truncate">Writing partner</span></div>
                  <div className="flex items-center gap-2 rounded-lg p-2 text-[10px] text-[#8d988f]"><span className="flex size-6 items-center justify-center rounded-md bg-white/[0.06] text-[#aab4aa]"><Wrench className="size-3.5" /></span><span className="truncate">Research helper</span></div>
                </div>
              </aside>
              <div className="flex min-w-0 flex-col p-4 sm:p-5">
                <div className="mb-7 flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-[#d7ff63]"><Bot className="size-4" /></span><div className="min-w-0"><p className="truncate text-xs font-medium text-[#e6ebe3]">Writing partner</p><p className="mt-0.5 text-[10px] text-[#7f8a81]">Ready when you are</p></div></div>
                <div className="max-w-[88%] self-end rounded-2xl rounded-br-sm border border-[#d7ff63]/15 bg-[#d7ff63]/[0.1] px-3 py-2.5 text-[10px] leading-5 text-[#e8f3ce]">Help me bring some clarity to this idea.</div>
                <div className="mt-3 flex max-w-[92%] items-start gap-2"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#d7ff63]"><Bot className="size-3" /></span><div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 text-[10px] leading-5 text-[#aab4aa]">Let’s find the heart of it together. What do you want someone to understand?</div></div>
                <div className="mt-auto flex items-center justify-between rounded-xl border border-white/[0.1] bg-black/10 px-3 py-2.5 text-[10px] text-[#737e75]"><span>Message your agent…</span><span className="flex size-6 items-center justify-center rounded-lg bg-[#d7ff63] text-[#151a10]"><ArrowUpRight className="size-3.5" /></span></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -left-3 hidden items-center gap-3 rounded-xl border border-white/[0.1] bg-[#171e19]/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex lg:-left-8">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#d7ff63]/[0.1] text-[#d7ff63]"><Check className="size-4" /></span>
            <span><span className="block text-[10px] text-[#8c978e]">Set up once</span><span className="mt-0.5 block text-xs font-medium text-[#e6ebe3]">Keep good work moving</span></span>
          </div>
        </div>
      </section>

      <section className="relative border-y border-white/[0.08] bg-white/[0.018]">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="max-w-xl"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7ff63]">A better rhythm</p><h2 className="mt-3 text-2xl font-medium tracking-tight text-[#f1f3ed] sm:text-3xl">Useful by design. Yours to shape.</h2><p className="mt-3 text-sm leading-6 text-[#9ba59d]">Keep the work organized around what you need to do, with enough structure to stay focused.</p></div>
          <div className="mt-9 grid gap-3 md:grid-cols-3">
            {features.map((feature) => <article key={feature.number} className="min-w-0 rounded-2xl border border-white/[0.09] bg-white/[0.025] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] transition hover:border-[#d7ff63]/20 hover:bg-white/[0.04] sm:p-6"><p className="font-mono text-[11px] tracking-wider text-[#d7ff63]">{feature.number}</p><h3 className="mt-5 text-base font-medium text-[#e9ece6]">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#8d988f]">{feature.text}</p></article>)}
          </div>
        </div>
      </section>

      <footer className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-7 text-xs text-[#79847b] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2 font-semibold text-[#cfd6cc]"><span className="flex size-7 items-center justify-center rounded-lg bg-[#d7ff63] text-[10px] font-bold text-[#151a10]">H</span> Helpy</Link>
        <span>Make room for better work.</span>
        <Link href="/sign-up" className="inline-flex items-center gap-1 font-medium text-[#d7ff63] hover:text-[#e2ff8a]">Get started <ArrowRight className="size-3.5" /></Link>
      </footer>
    </main>
  );
}
