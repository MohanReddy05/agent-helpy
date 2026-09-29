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
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask your agent to automate something..."
          className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-2 py-2.5 text-sm text-slate-900 focus:outline-none"
          rows={1}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white disabled:bg-slate-300 transition-colors hover:bg-blue-700"
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
