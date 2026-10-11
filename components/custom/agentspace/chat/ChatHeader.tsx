import { Bot, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Agent } from "@/db";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { CHAT_MODELS, type ChatModel } from "@/lib/ai/models";

export function ChatHeader({
  agentConfig,
  selectedModel,
  onModelChange,
  onShowConfiguration,
}: {
  agentConfig: Agent | null | undefined;
  selectedModel: ChatModel;
  onModelChange: (model: ChatModel) => void;
  onShowConfiguration?: () => void;
}) {
  const agentName = agentConfig?.name ?? "Your agent";

  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between gap-2 border-b border-white/[0.09] bg-[#101513] px-3 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {agentConfig?.agentImage ? (
          <img
            src={agentConfig.agentImage}
            alt={agentName}
            className="size-8 shrink-0 rounded-lg border border-white/[0.12] object-cover sm:size-10 sm:rounded-xl"
          />
        ) : (
          <Avatar className="size-8 shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.04] text-[#d7ff63] sm:size-10 sm:rounded-xl">
            <AvatarFallback className="rounded-lg bg-transparent text-[#d7ff63] sm:rounded-xl">
              <Bot className="size-4 sm:size-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <h1 className="max-w-[22vw] truncate text-sm font-medium text-[#edf0e9] sm:max-w-none">{agentName}</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#929d94]" aria-label="Ready to help">
            <span className="size-1.5 rounded-full bg-[#d7ff63] shadow-[0_0_8px_#d7ff63]" />
            <span className="hidden sm:inline">Ready to help</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#929d94]">
          <span className="hidden sm:inline">Model</span>
          <NativeSelect
            aria-label="Chat model"
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value as ChatModel)}
            className="w-[72px] sm:w-[180px] [&_select]:border-white/10 [&_select]:bg-[#151b17] [&_select]:text-[#e8ebe4] [&_svg]:text-[#89948b]"
          >
            {CHAT_MODELS.map((model) => (
              <NativeSelectOption key={model.id} value={model.id}>
                {model.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        {onShowConfiguration && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onShowConfiguration}
            className="size-8 shrink-0 text-[#929d94] hover:bg-white/[0.07] hover:text-[#d7ff63] sm:size-9"
            aria-label="Open agent configuration"
            title="Open agent configuration"
          >
            <PanelRightOpen className="size-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
