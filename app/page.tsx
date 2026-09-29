import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";

const features = [
  { number: "01", title: "Build focused AI agents", text: "Shape each agent’s instructions, model, and tools around the work you need done." },
  { number: "02", title: "Keep every conversation close", text: "Pick up where you left off with a dedicated chat space for each agent." },
  { number: "03", title: "Make agents your own", text: "Tune the behavior and personality until each assistant fits your workflow." },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/workspace");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-950">
      <div className="absolute inset-x-0 top-0 -z-0 h-[620px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(129,140,248,0.22),transparent_68%)]" />
      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">✳</span>
          Helpy
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-950">Log in</Link>
          <Link href="/sign-up" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Get started <span aria-hidden>→</span></Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-32 lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-indigo-700 shadow-sm"><span className="size-2 rounded-full bg-emerald-500" /> YOUR AI WORKSPACE, MADE PERSONAL</div>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Meet the agents that <span className="text-indigo-600">move work forward.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">Create helpful AI agents for the way you work. Give each one the right tools, guidance, and a space to think with you.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/sign-up" className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700">Create your workspace <span aria-hidden>→</span></Link>
            <Link href="/sign-in" className="px-3 py-3 text-sm font-semibold text-slate-600 hover:text-indigo-700">I already have an account</Link>
          </div>
          <p className="mt-5 text-xs text-slate-400">A calmer home for the work you do with AI.</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg" aria-label="Preview of the Helpy agent workspace">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-indigo-200/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.7rem] border border-white bg-white shadow-[0_30px_90px_-35px_rgba(51,65,150,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-white">✳</span><span className="text-sm font-semibold">Your workspace</span></div><span className="flex gap-1"><i className="size-2 rounded-full bg-slate-200"/><i className="size-2 rounded-full bg-slate-200"/><i className="size-2 rounded-full bg-slate-200"/></span></div>
            <div className="grid min-h-[350px] grid-cols-[145px_1fr]">
              <aside className="border-r border-slate-100 bg-slate-50/70 p-3"><div className="mb-4 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">＋ New agent</div><p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Your agents</p><div className="space-y-1"><div className="flex items-center gap-2 rounded-lg bg-white p-2 text-[10px] font-medium shadow-sm"><span className="flex size-6 items-center justify-center rounded-md bg-violet-100">✍</span> Writing partner</div><div className="flex items-center gap-2 rounded-lg p-2 text-[10px] text-slate-500"><span className="flex size-6 items-center justify-center rounded-md bg-amber-100">⌁</span> Research helper</div><div className="flex items-center gap-2 rounded-lg p-2 text-[10px] text-slate-500"><span className="flex size-6 items-center justify-center rounded-md bg-emerald-100">✦</span> Project guide</div></div></aside>
              <div className="flex flex-col p-5"><div className="mb-8 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-lg">✍</span><div><p className="text-xs font-semibold">Writing partner</p><p className="mt-0.5 text-[10px] text-slate-400">Ready when you are</p></div></div><div className="self-end rounded-2xl rounded-tr-sm bg-indigo-600 px-3.5 py-2.5 text-[10px] leading-5 text-white">Help me bring some clarity to this idea.</div><div className="mt-4 flex gap-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs">✍</span><div className="rounded-2xl rounded-tl-sm bg-slate-50 px-3.5 py-2.5 text-[10px] leading-5 text-slate-600">Absolutely. Let’s find the heart of it together. What do you want someone to feel or understand?</div></div><div className="mt-auto rounded-xl border border-slate-200 px-3.5 py-3 text-[10px] text-slate-400">Message your agent... <span className="float-right rounded-md bg-indigo-600 px-2 py-1 text-white">↑</span></div></div>
            </div>
          </div>
          <div className="absolute -right-4 top-20 rounded-xl border border-indigo-50 bg-white px-4 py-3 shadow-xl shadow-indigo-100/70 sm:-right-8"><p className="text-[10px] font-medium text-slate-400">Your agents, your way</p><p className="mt-1 text-xs font-semibold text-slate-800">Made for your workflow <span className="text-emerald-500">✓</span></p></div>
        </div>
      </section>

      <section className="relative border-y border-slate-200/70 bg-white/70"><div className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">A little more helpful</p><h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Your ideas deserve a workspace that keeps up.</h2><p className="mt-4 leading-7 text-slate-600">Bring useful assistants into one thoughtful space, and shape how each one supports you.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{features.map((feature) => <article key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100"><p className="text-xs font-bold tracking-widest text-indigo-500">{feature.number}</p><h3 className="mt-5 text-lg font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p></article>)}</div></div></section>

      <footer className="relative mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10"><Link href="/" className="flex items-center gap-2 font-bold text-slate-800"><span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">✳</span>Helpy</Link><span>Make room for better work.</span><Link href="/sign-up" className="font-semibold text-indigo-600 hover:text-indigo-700">Get started <span aria-hidden>→</span></Link></footer>
    </main>
  );
}
