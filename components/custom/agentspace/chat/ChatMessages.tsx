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
  bottomRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  agentId: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
      <div className="flex flex-col gap-6">
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
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
              <span className="mt-1 text-[10px] text-slate-400 font-medium">
                {msg.time}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex max-w-[85%] items-center gap-2 self-start rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-xs font-medium text-slate-500">
              Agent is thinking...
            </span>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
