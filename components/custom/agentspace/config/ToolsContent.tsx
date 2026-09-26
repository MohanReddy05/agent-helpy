import { useState } from "react";
import { CalendarClock, Github, Mail, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./SectionHeading";

const toolList = [
  { name: "Gmail", caption: "Email and communication", icon: Mail, style: "bg-red-50 text-red-600" },
  { name: "Slack", caption: "Team messaging", icon: MessageCircle, style: "bg-violet-50 text-violet-600" },
  { name: "Google Calendar", caption: "Events and scheduling", icon: CalendarClock, style: "bg-blue-50 text-blue-600" },
  { name: "Notion", caption: "Docs and knowledge", icon: Sparkles, style: "bg-slate-100 text-slate-700" },
  { name: "GitHub", caption: "Code and projects", icon: Github, style: "bg-slate-100 text-slate-800" },
];

export function ToolsContent() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  return (
    <div>
      <SectionHeading title="Connected tools" detail="Connect apps to give Orbit access to the information it needs." />
      <div className="space-y-2.5">
        {toolList.map(({ name, caption, icon: Icon, style }) => {
          const isConnected = connected[name];
          return (
            <div key={name} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${style}`}>
                <Icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">{name}</span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{isConnected ? "Connected" : caption}</span>
              </span>
              <Button
                variant={isConnected ? "ghost" : "outline"}
                size="sm"
                onClick={() => setConnected((previous) => ({ ...previous, [name]: !previous[name] }))}
                className={`h-8 rounded-lg px-3 text-xs ${isConnected ? "text-slate-500 hover:text-red-600" : ""}`}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">More integrations coming soon</p>
    </div>
  );
}
