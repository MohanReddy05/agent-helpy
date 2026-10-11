import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "./SectionHeading";
import { useContext } from "react";
import { AgentConfigContext } from "@/context/AgentConfigContext";

export function SettingsContent({ onDirty }: { onDirty: () => void }) {
  const context = useContext(AgentConfigContext);

  const agentConfig = context?.agentConfig;
  const setAgentConfig = context?.setAgentConfig;

  const agentDescription =
    agentConfig?.description ?? "No description is given for the agent";

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const description = event.target.value;

    setAgentConfig?.((currentAgent) =>
      currentAgent
        ? {
            ...currentAgent,
            description,
          }
        : currentAgent,
    );

    onDirty();
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading
          title="About your agent"
          detail="Give your agent context about its role and purpose."
        />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Agent description / instructions
            </Label>

            <Textarea
              id="description"
              value={agentDescription}
              onChange={handleDescriptionChange}
              placeholder="Describe what this agent does..."
              className="min-h-[110px] resize-y border-white/[0.1] bg-white/[0.035] text-sm leading-5 text-[#e8ebe4] placeholder:text-[#68736b] focus-visible:border-[#d7ff63]/40 focus-visible:ring-[#d7ff63]/10"
            />
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#d7ff63]/15 bg-[#d7ff63]/[0.045] p-4">
        <div className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#d7ff63]/[0.08] text-[#d7ff63]">
            <Sparkles className="size-4" />
          </span>

          <div>
            <p className="text-xs font-semibold text-[#e8ebe4]">
              Shape this agent
            </p>

            <p className="mt-1 text-xs leading-5 text-[#929d94]">
              A little context goes a long way. Add specific details to get more
              helpful responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
