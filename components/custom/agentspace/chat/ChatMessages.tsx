import { Loader2 } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { AgentResponseView } from "./AgentResponseView";

export function ChatMessages({
  messages,
  bottomRef,
  isLoading,
  agentId,
}: {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  isLoading: boolean;
  agentId: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0f0e] p-5 sm:p-7">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {messages.map((msg, idx) => {
          const displayText = [msg.text, msg.content, msg.response?.content].find(
            (text): text is string =>
              typeof text === "string" && text.trim().length > 0,
          );
          if (!displayText) return null;

          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm sm:max-w-[78%] ${
                  isUser
                    ? "rounded-br-sm border-[#d7ff63]/50 bg-[#d7ff63] text-[#151a10]"
                    : "rounded-bl-sm border-white/[0.1] bg-white/[0.045] text-[#e0e5dd]"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {displayText}
                </p>

                {/* Render Generative UI Cards for Agent messages */}
                {!isUser && msg.response && (
                  <AgentResponseView
                    response={msg.response}
                    agentId={agentId}
                  />
                )}
              </div>
              <span className="mt-1 text-[10px] font-medium text-[#768178]">
                {msg.time}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex max-w-[85%] items-center gap-2 self-start rounded-2xl rounded-bl-sm border border-white/[0.1] bg-white/[0.045] px-4 py-3 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-[#d7ff63]" />
            <span className="text-xs font-medium text-[#a0aaa1]">
              Agent is thinking...
            </span>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
