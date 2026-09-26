import type { RefObject } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "./types";

export function ChatMessages({ messages, bottomRef }: { messages: ChatMessage[]; bottomRef: RefObject<HTMLDivElement | null> }) {
  return <ScrollArea className="min-h-0 flex-1"><div className="px-6 py-8 md:px-10"><div className="mx-auto flex max-w-2xl flex-col gap-7"><div className="flex justify-center"><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">Today</span></div>{messages.map((message, index) => message.role === "assistant" ? <div key={index} className="flex items-start gap-3"><Avatar className="mt-0.5 size-8 rounded-lg bg-indigo-50 text-indigo-700"><AvatarFallback className="rounded-lg bg-indigo-50 text-indigo-700"><Sparkles className="size-4" /></AvatarFallback></Avatar><div className="max-w-[82%]"><div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">{message.text}</div><p className="mt-1.5 text-[11px] text-slate-400">Orbit · {message.time}</p></div></div> : <div key={index} className="flex justify-end"><div className="max-w-[78%]"><div className="rounded-2xl rounded-tr-md bg-indigo-600 px-4 py-3 text-sm leading-6 text-white">{message.text}</div><p className="mt-1.5 text-right text-[11px] text-slate-400">You · {message.time}</p></div></div>)}<div ref={bottomRef} /></div></div></ScrollArea>;
}
