"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { AgentConfigContext } from "@/context/AgentConfigContext";
import { ChatComposer } from "./chat/ChatComposer";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatMessages } from "./chat/ChatMessages";
import type { ChatMessage } from "./chat/types";

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Hi Alex! I'm Orbit, your personal AI assistant. What can I help you with today?",
    time: "10:24 AM",
  },
  {
    role: "user",
    text: "Can you give me a quick overview of what you can do?",
    time: "10:25 AM",
  },
  {
    role: "assistant",
    text: "Absolutely. I can help you organize your work, answer questions, and connect the apps you use every day. Once you add tools, I can also take care of recurring tasks for you.",
    time: "10:25 AM",
  },
  {
    role: "user",
    text: "That sounds great. Let's get started!",
    time: "10:26 AM",
  },
];

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatPanelOld() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const context = useContext(AgentConfigContext);
  const agentConfig = context?.agentConfig;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const canSend = draft.trim().length > 0;
  const handleSend = () => {
    if (!canSend) return;
    setMessages((previous) => [
      ...previous,
      { role: "user", text: draft.trim(), time: nowLabel() },
    ]);
    setDraft("");
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-white">
      <ChatHeader agentConfig={agentConfig} />
      {/* <ChatMessages messages={messages} bottomRef={bottomRef} />
      <ChatComposer
        draft={draft}
        canSend={canSend}
        onDraftChange={setDraft}
        onSend={handleSend}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
      /> */}
    </section>
  );
}
