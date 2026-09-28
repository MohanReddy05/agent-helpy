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
              className="min-h-[82px] resize-none bg-white text-sm leading-5"
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
            <p className="text-xs font-semibold text-slate-800">
              Make Orbit your own
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              A little context goes a long way. Add specific details to get more
              helpful responses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
