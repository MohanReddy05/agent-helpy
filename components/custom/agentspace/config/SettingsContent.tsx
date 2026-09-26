import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "./SectionHeading";

export function SettingsContent({ onDirty }: { onDirty: () => void }) {
  return (
    <div className="space-y-6">
      <section>
        <SectionHeading
          title="About your agent"
          detail="Give your agent context about its role and purpose."
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Agent description</Label>
            <Textarea
              id="description"
              defaultValue="A helpful personal assistant for keeping your work organized and moving forward."
              onChange={onDirty}
              className="min-h-[82px] resize-none bg-white text-sm leading-5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Agent instructions</Label>
            <Textarea
              id="instructions"
              defaultValue={
                "You are Orbit, a thoughtful and reliable personal assistant.\n\nBe clear, concise, and friendly. Ask a follow-up question when you need more context, and break complex tasks into manageable steps."
              }
              onChange={onDirty}
              className="min-h-[188px] resize-y bg-white text-sm leading-6"
            />
          </div>
        </div>
      </section>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-800">Make Orbit your own</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              A little context goes a long way. Add specific details to get more helpful responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
