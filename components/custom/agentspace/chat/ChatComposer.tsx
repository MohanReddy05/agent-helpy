import { SendHorizonal } from "lucide-react";

export function ChatComposer({
  draft,
  canSend,
  onDraftChange,
  onSend,
  onKeyDown,
}: {
  draft: string;
  canSend: boolean;
  onDraftChange: (val: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="border-t border-white/[0.08] bg-[#101513] p-4 sm:px-6">
      <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.035] p-2 shadow-sm transition-all focus-within:border-[#d7ff63]/50 focus-within:ring-4 focus-within:ring-[#d7ff63]/[0.08]">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your agent to automate something..."
          className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-2.5 text-sm text-[#f1f3ed] outline-none placeholder:text-[#758078] focus:outline-none"
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7ff63] text-[#151a10] shadow-[0_0_16px_rgba(215,255,99,0.1)] transition-colors hover:bg-[#e2ff8a] disabled:bg-[#59614e] disabled:text-[#a0a795]"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// import type { KeyboardEvent } from "react";
// import { ArrowUp } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";

// type ChatComposerProps = {
//   draft: string;
//   canSend: boolean;
//   onDraftChange: (value: string) => void;
//   onSend: () => void;
//   onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
// };

// export function ChatComposer({
//   draft,
//   canSend,
//   onDraftChange,
//   onSend,
//   onKeyDown,
// }: ChatComposerProps) {
//   return (
//     <div className="shrink-0 px-6 pb-6 pt-3 md:px-10">
//       <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
//         <Textarea
//           value={draft}
//           onChange={(event) => onDraftChange(event.target.value)}
//           onKeyDown={onKeyDown}
//           placeholder="Ask your agent anything..."
//           className="min-h-[64px] resize-none border-0 px-3 py-2 text-sm shadow-none focus-visible:ring-0"
//         />
//         <div className="flex items-center justify-between px-1 pb-0.5">
//           <p className="pl-2 text-[11px] text-slate-400">
//             Orbit can make mistakes. Check important info.
//           </p>
//           <Button
//             size="icon"
//             disabled={!canSend}
//             onClick={onSend}
//             className="size-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40"
//             aria-label="Send message"
//           >
//             <ArrowUp className="size-4" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
