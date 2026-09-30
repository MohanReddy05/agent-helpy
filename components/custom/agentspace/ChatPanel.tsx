"use client";

import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { AgentConfigContext } from "@/context/AgentConfigContext";
import { ChatMessage } from "@/lib/types";
import { ChatMessages } from "./chat/ChatMessages";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatComposer } from "./chat/ChatComposer";
import { DEFAULT_CHAT_MODEL, isChatModel, type ChatModel } from "@/lib/ai/models";

function nowLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatPanel() {
  const params = useParams();
  const agentId = params.agentId as string;

  const context = useContext(AgentConfigContext);
  const agentConfig = context?.agentConfig;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ChatModel>(DEFAULT_CHAT_MODEL);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentId) return;
    const savedModel = window.localStorage.getItem(`helpy-chat-model:${agentId}`);
    if (savedModel === "gemini-3.1-flash-lite" || savedModel === "gemini-3.5-flash") {
      setSelectedModel("gemini-3.8-flash");
      window.localStorage.setItem(`helpy-chat-model:${agentId}`, "gemini-3.8-flash");
    } else if (isChatModel(savedModel)) {
      setSelectedModel(savedModel);
    }
  }, [agentId]);

  const handleModelChange = (model: ChatModel) => {
    setSelectedModel(model);
    if (agentId) window.localStorage.setItem(`helpy-chat-model:${agentId}`, model);
  };

  // 1. Fetch Chat History on mount
  useEffect(() => {
    async function loadChatHistory() {
      if (!agentId) return;
      try {
        setIsLoading(true);
        // Ensure you have an API route handling this GET request!
        const res = await axios.get(`/api/agent/chat?agentId=${agentId}`);

        if (res.data.messages?.length > 0) {
          setMessages(res.data.messages);
        } else {
          setMessages([
            {
              id: "init",
              role: "assistant",
              text: `Hi! I'm ${agentConfig?.name || "your agent"}. What can I help you automate today?`,
              time: nowLabel(),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setMessages([{
          id: "history-error",
          role: "assistant",
          text: "I couldn't load the saved conversation. You can still start a new message.",
          time: nowLabel(),
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    loadChatHistory();
  }, [agentId, agentConfig?.name]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading]);

  const canSend = draft.trim().length > 0 && !isLoading;

  // 3. Handle Send
  const handleSend = async () => {
    if (!canSend) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: draft.trim(),
      time: nowLabel(),
    };

    const previousMessages = messages.filter(
      (message) =>
        !message.id?.startsWith("transient-user-") &&
        !message.id?.startsWith("transient-error-"),
    );
    const updatedMessages = [...previousMessages, userMessage];
    setMessages(updatedMessages);
    setDraft("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/agent/chat", {
        agentId,
        model: selectedModel,
        messages: updatedMessages,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Backend should return the full updated message array (including agent's response payload)
      if (res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Error communicating with AI Agent:", err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error
        : null;
      setMessages((prev) => [
        ...prev.map((message) =>
          message.id === userMessage.id
            ? { ...message, id: `transient-user-${userMessage.id}` }
            : message,
        ),
        {
          id: `transient-error-${crypto.randomUUID()}`,
          role: "assistant",
          text:
            typeof errorMessage === "string"
              ? errorMessage
              : "I encountered an error trying to process that. Please try again.",
          time: nowLabel(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-white border-r">
      <ChatHeader
        agentConfig={agentConfig}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

      <ChatMessages
        messages={messages}
        bottomRef={bottomRef}
        isLoading={isLoading}
        agentId={agentId}
      />

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
      />
    </section>
  );
}
