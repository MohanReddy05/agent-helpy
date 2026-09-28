"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { AvailableAvatars } from "@/lib/Avatars";

function CreateAgent() {
  const router = useRouter();
  const avatars = AvailableAvatars;
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen px-5 py-10 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-indigo-600">Workspace</p>

          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Create New Agent
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Setup your AI Agent by choosing an avatar, name, and description.
            You can configure its tools and behavior later.
          </p>
        </header>

        <form
          onSubmit={onClickCreateAgent}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {/* Avatar */}
          <section
            className="mb-8 flex flex-col items-center border-b border-slate-100 pb-8"
            aria-label="Agent avatar"
          >
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              <img
                key={avatarImage}
                src={avatarImage}
                alt="Agent Avatar"
                className="size-20 rounded-full object-cover"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-800">
              Choose an agent avatar
            </p>

            {/* <p className="mt-1 text-xs text-slate-400">Avatar: {avatarSeed}</p> */}

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 gap-2"
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
                className="text-sm font-medium text-slate-800"
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
                  className="text-sm font-medium text-slate-800"
                >
                  Agent Description{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>

                <span className="text-xs tabular-nums text-slate-400">
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
          </div>

          {/* Buttons */}
          <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:min-w-28"
              onClick={() => router.push("/workspace")}
              disabled={isLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 text-white sm:min-w-36"
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
