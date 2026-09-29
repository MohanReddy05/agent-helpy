"use client";

import { useContext, useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  Check,
  Settings2,
  Shuffle,
  Wrench,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentConfigContext } from "@/context/AgentConfigContext";
import { AgentSettingsContent } from "./config/AgentSettingsContent";
import { ScheduleContent } from "./config/ScheduleContent";
import { SettingsContent } from "./config/SettingsContent";
import { ToolsContent } from "./config/ToolsContent";
import { AvailableAvatars } from "@/lib/Avatars";
import axios from "axios";
import { toast } from "@/components/ui/toast";

const tabs = [
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "schedule", label: "Schedule", icon: CalendarClock },
  { id: "agent", label: "Agent", icon: Bot },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AgentConfigPanel({ onHide }: { onHide: () => void }) {
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("settings");
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const context = useContext(AgentConfigContext);
  const agentConfig = context?.agentConfig;
  const setAgentConfig = context?.setAgentConfig;

  const agentName = agentConfig?.name ?? "New agent";
  const avatars = AvailableAvatars;

  const avatarSeed = avatars[avatarIndex];

  const shuffledAvatarUrl = useMemo(
    () =>
      `https://api.dicebear.com/10.x/bottts-neutral/svg?seed=${encodeURIComponent(
        avatarSeed,
      )}&backgroundColor=4a4d52,6b6f75,8d9197,b2b6bc&eyesVariant=dizzy,glow,happy,robocop,round,roundFrame01,sensor&mouthVariant=bite,grill01,grill02,grill03,smile01,smile02,square01,square02`,
    [avatarSeed],
  );

  // Use the configured avatar if one exists.
  // Otherwise use the currently selected/shuffled avatar.
  const agentAvatar = agentConfig?.agentImage || shuffledAvatarUrl;

  const handleSave = async () => {
    try {
      setIsDirty(false);
      setJustSaved(true);
      toast.add({ title: "Updating Agent Configuration", type: "info" });
      const result = await axios.put("/api/agent", agentConfig);
      console.log(result.data);
      window.setTimeout(() => setJustSaved(false), 1800);
      toast.add({ title: "Agent Updated!", type: "success" });
    } catch (error) {
      toast.add({ title: "Agent Updation Failed!", type: "error" });
    }
  };

  const handleNameChange = (name: string) => {
    setAgentConfig?.((currentAgent) =>
      currentAgent ? { ...currentAgent, name } : currentAgent,
    );

    setIsDirty(true);
  };

  function shuffleAvatar() {
    setAvatarIndex((current) => {
      if (avatars.length <= 1) return current;

      let next = current;

      while (next === current) {
        next = Math.floor(Math.random() * avatars.length);
      }

      // Immediately update the agent image so the UI changes.
      setAgentConfig?.((currentAgent) =>
        currentAgent
          ? {
              ...currentAgent,
              agentImage: `https://api.dicebear.com/10.x/bottts-neutral/svg?seed=${encodeURIComponent(
                avatars[next],
              )}&backgroundColor=4a4d52,6b6f75,8d9197,b2b6bc&eyesVariant=dizzy,glow,happy,robocop,round,roundFrame01,sensor&mouthVariant=bite,grill01,grill02,grill03,smile01,smile02,square01,square02`,
            }
          : currentAgent,
      );

      setIsDirty(true);

      return next;
    });
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    settings: <SettingsContent onDirty={() => setIsDirty(true)} />,
    tools: <ToolsContent />,
    schedule: <ScheduleContent />,
    agent: <AgentSettingsContent agentName={agentName} />,
  };

  return (
    <aside className="flex h-full w-[440px] shrink-0 flex-col border-l border-slate-200 bg-slate-50/70 xl:w-[480px]">
      <div className="flex h-[76px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Agent Configuration
          </p>

          <p className="mt-0.5 truncate text-xs text-slate-500">
            Personalize how {agentName} works
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            disabled={!isDirty && !justSaved}
            onClick={handleSave}
            className={`h-9 rounded-lg px-4 text-xs font-medium transition-colors ${
              justSaved
                ? "bg-emerald-600 hover:bg-emerald-600"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {justSaved ? (
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5" />
                Saved
              </span>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <section className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-end gap-3">
            <div className="relative shrink-0">
              {agentAvatar ? (
                <img
                  key={agentAvatar}
                  src={agentAvatar}
                  alt={agentName}
                  className="size-[58px] shrink-0 rounded-2xl border border-slate-200 object-cover"
                />
              ) : (
                <Avatar className="size-[58px] shrink-0 rounded-2xl bg-indigo-50 text-indigo-700">
                  <AvatarFallback className="rounded-2xl bg-indigo-50 text-indigo-700">
                    <Bot className="size-7" />
                  </AvatarFallback>
                </Avatar>
              )}

              <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1">
              <Label
                htmlFor="agent-name"
                className="mb-1.5 block text-xs text-slate-500"
              >
                Agent name
              </Label>

              <Input
                id="agent-name"
                value={agentName}
                onChange={(event) => handleNameChange(event.target.value)}
                className="h-9 border-slate-200 bg-white text-sm font-medium"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              aria-label="Shuffle avatar"
              title="Shuffle avatar"
              onClick={shuffleAvatar}
            >
              <Shuffle className="size-4" />
            </Button>
          </div>
        </section>

        <div className="px-6 pt-5">
          <div
            role="tablist"
            aria-label="Agent configuration sections"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
          >
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-controls={`panel-${id}`}
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors ${
                  activeTab === id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="hidden truncate sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="mb-6 mt-5"
          >
            {tabContent[activeTab]}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
