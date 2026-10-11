import Link from "next/link";
import { Check } from "lucide-react";

export default function SignOutPage() {
  return (
    <main className="app-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 text-[#f1f3ed]">
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-[#b4ed3d]/[0.07] blur-[120px]" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.035] p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:p-10">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 text-sm font-semibold text-[#edf0e9]"><span className="flex size-8 items-center justify-center rounded-xl bg-[#d7ff63] text-xs font-bold text-[#151a10]">H</span> Helpy</Link>
        <span className="mx-auto mt-9 flex size-14 items-center justify-center rounded-2xl border border-[#d7ff63]/20 bg-[#d7ff63]/[0.08] text-[#d7ff63]"><Check className="size-6" /></span>
        <h1 className="mt-5 text-2xl font-medium tracking-tight">You’re signed out</h1>
        <p className="mt-2 text-sm leading-6 text-[#9ba59d]">Your workspace is closed for now. You can return whenever you’re ready.</p>
        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <Link href="/" className="rounded-xl border border-white/[0.1] bg-white/[0.035] px-4 py-3 text-sm font-medium text-[#d3d9d1] transition hover:bg-white/[0.07]">Back to home</Link>
          <Link href="/sign-in" className="rounded-xl bg-[#d7ff63] px-4 py-3 text-sm font-semibold text-[#151a10] transition hover:bg-[#e2ff8a]">Sign in again</Link>
        </div>
      </section>
    </main>
  );
}
