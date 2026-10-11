"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { AvailableAvatars } from "@/lib/Avatars";

type ToolkitOption = { slug: string; name: string; connected: boolean };

function CreateAgent() {
  const router = useRouter();
  const avatars = AvailableAvatars;
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolkits, setToolkits] = useState<ToolkitOption[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  useEffect(() => {
    axios.get("/api/tools").then((result) => {
      const available: ToolkitOption[] = result.data.tools ?? [];
      setToolkits(available);
      setSelectedTools(available.filter((tool) => tool.connected).map((tool) => tool.slug));
    }).catch(() => setToolkits([]));
  }, []);

  // Current avatar seed
  const avatarSeed = avatars[avatarIndex];

  // Current avatar URL
  const avatarImage = `https://api.dicebear.com/10.x/bottts-neutral/svg?seed=${encodeURIComponent(
    avatarSeed,
  )}&backgroundColor=4a4d52,6b6f75,8d9197,b2b6bc&eyesVariant=dizzy,glow,happy,robocop,round,roundFrame01,sensor&mouthVariant=bite,grill01,grill02,grill03,smile01,smile02,square01,square02`;

  function shuffleAvatar() {
    setAvatarIndex((current) => {
      let next = Math.floor(Math.random() * avatars.length);

      // Make sure the new avatar is different from the current one
      while (next === current && avatars.length > 1) {
        next = Math.floor(Math.random() * avatars.length);
      }

      return next;
    });
  }

  async function onClickCreateAgent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsLoading(true);

    const newAgentId = crypto.randomUUID();

    try {
      console.log("Creating agent...");
      console.log("Agent ID:", newAgentId);
      console.log("Avatar seed:", avatarSeed);
      console.log("Avatar URL:", avatarImage);

      const result = await axios.post("/api/agent", {
        agentId: newAgentId,
        name: name.trim(),
        description: description.trim(),
        agentImage: avatarImage,
        tools: selectedTools,
      });

      console.log("Agent created:", result.data);

      router.push(`/workspace/${newAgentId}`);
      router.refresh();
    } catch (error) {
      console.error("Agent Not Created:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-canvas min-h-screen px-5 py-8 text-[#f1f3ed] sm:px-8 sm:py-12">
      <div className="relative mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-[#d7ff63]">Workspace / Setup</p>

          <h1 className="text-3xl font-medium tracking-[-0.04em] text-[#f1f3ed]">
            Create New Agent
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9ba59d]">
            Set up an AI agent with its own instructions and selected tools.
          </p>
        </header>

        <form
          onSubmit={onClickCreateAgent}
          className="themed-scrollbar max-h-[calc(100dvh-13rem)] overflow-y-auto overscroll-contain rounded-3xl border border-white/[0.1] bg-white/[0.035] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:max-h-[calc(100dvh-14rem)] sm:p-8"
        >
          {/* Avatar */}
          <section
            className="mb-8 flex flex-col items-center border-b border-white/[0.08] pb-8"
            aria-label="Agent avatar"
          >
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.05] shadow-[0_0_35px_rgba(215,255,99,0.07)]">
              <img
                key={avatarImage}
                src={avatarImage}
                alt="Agent Avatar"
                className="size-20 rounded-full object-cover"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-[#e8ebe4]">
              Choose an agent avatar
            </p>

            {/* <p className="mt-1 text-xs text-slate-400">Avatar: {avatarSeed}</p> */}

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 gap-2 border-white/[0.12] bg-white/[0.04] text-[#dce2da] hover:bg-white/[0.08] hover:text-white"
              onClick={shuffleAvatar}
              disabled={isLoading}
            >
              <RefreshCw className="size-4" />
              Shuffle Image
            </Button>
          </section>

          {/* Form fields */}
          <div className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <label
                htmlFor="agent-name"
                className="text-sm font-medium text-[#dce2da]"
              >
                Agent Name
              </label>

              <Input
                id="agent-name"
                name="name"
                placeholder="e.g. Research Assistant"
                required
                maxLength={80}
                className="h-10"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Agent Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="agent-description"
                  className="text-sm font-medium text-[#dce2da]"
                >
                  Agent Description{" "}
                  <span className="font-normal text-[#778279]">(optional)</span>
                </label>

                <span className="text-xs tabular-nums text-[#778279]">
                  {description.length}/1000
                </span>
              </div>

              <Textarea
                id="agent-description"
                name="description"
                placeholder="Describe what this agent should do, its personality, goals, or special instructions..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                className="min-h-36 resize-y"
                disabled={isLoading}
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[#dce2da]">Agent tools <span className="font-normal text-[#778279]">(optional)</span></legend>
              <p className="text-xs leading-5 text-[#89948b]">Choose which connected apps this agent can use. These choices are separate for each agent and do not change your marketplace connections.</p>
              {toolkits.length === 0 ? (
                <p className="rounded-xl border border-white/[0.09] bg-white/[0.025] p-3 text-xs text-[#89948b]">No tools are available. Add tools to the catalog and connect them in the marketplace.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {toolkits.map((tool) => {
                    const selected = selectedTools.includes(tool.slug);
                    return (
                      <label key={tool.slug} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${selected ? "border-[#d7ff63]/30 bg-[#d7ff63]/[0.07]" : "border-white/[0.09] bg-white/[0.025] hover:bg-white/[0.05]"}`}>
                        <input type="checkbox" checked={selected} onChange={() => setSelectedTools((current) => selected ? current.filter((slug) => slug !== tool.slug) : [...current, tool.slug])} className="mt-0.5 accent-[#d7ff63]" />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium text-[#e8ebe4]">{tool.name}</span>
                          <span className={`mt-0.5 block text-[10px] ${tool.connected ? "text-[#d7ff63]" : "text-[#89948b]"}`}>{tool.connected ? "Connected in marketplace" : "Connect later from Marketplace or Tools"}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-white/[0.08] pt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="border-white/[0.12] bg-white/[0.04] text-[#dce2da] hover:bg-white/[0.08] sm:min-w-28"
              onClick={() => router.push("/workspace")}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-[#d7ff63] text-[#151a10] hover:bg-[#e2ff8a] sm:min-w-36"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Save Agent
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAgent;
