"use client";

import { useState } from "react";
import Header from "./Header";
import PromptInput from "../PromptInput";

export default function LandingSection() {
  const [promptText, setPromptText] = useState<string>("");
  return (
    <div className="min-h-screen w-full">
      <div className="flex flex-col">
        <Header />
        <div className="relative overflow-hidden pt-28">
          <div className="max-w-6xl mx-auto flex flex-col items-center justify-center">
            <div className="space-y-3">
              <h1 className="text-center font-semibold text-4xl tracking-tight sm:text-5xl">
                Design mobile apps <br className="md:hidden" />
                <span className="text-primary">in minutes</span>
              </h1>
              <p className="mx-auto max-w-2xl text-center font-medium text-foreground leading-relaxed sm:text-lg ">
                Go from idea to beautifyl app mockups in minutes by chatting
                with AI.
              </p>
            </div>
            <div className="flex w-full max-w-3xl flex-col items-center gap-8 relative z-50">
              <div className="w-full">
                <PromptInput
                  className="ring-2 ring-primary "
                  promptText={promptText}
                  setPromptText={setPromptText}
                  isLoading={false}
                  onSubmit={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
