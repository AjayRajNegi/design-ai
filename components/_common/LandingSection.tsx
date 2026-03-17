"use client";

import { useState } from "react";
import Header from "./Header";
import PromptInput from "../PromptInput";
import { Suggestion, Suggestions } from "../ai-elements/suggestion";
import { useCreateProject } from "@/features/use-project";

const suggestions = [
  {
    label: "E-commerce",
    icon: "👟",
    value: `Sneaker product page. Large high-quality product image on a light gray background. Color selector swatches, size selector grid, and a sticky "Add to Cart" button at the bottom. Title and price in bold, oversized typography. Mobile app, single screen. Style: Neo-Brutalism. High contrast, thick black outlines on buttons and cards, hard shadows (no blur), unrefined geometry, bold solid colors (yellow and black). Trendy streetwear aesthetic.`,
  },
];
export default function LandingSection() {
  const [promptText, setPromptText] = useState<string>("");

  const { mutate, isPending } = useCreateProject();
  const handleSubmit = () => {
    if (!promptText) return;
    mutate(promptText);
  };
  const handleSuggestionClick = (val: string) => {
    setPromptText(val);
  };

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
            <div className="flex w-full max-w-3xl flex-col items-center gap-8 relative z-50 mt-10">
              <div className="w-full">
                <PromptInput
                  className="ring-2 ring-primary "
                  promptText={promptText}
                  setPromptText={setPromptText}
                  isLoading={isPending}
                  onSubmit={handleSubmit}
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 px-5">
                <Suggestions>
                  {suggestions.map((s) => (
                    <Suggestion
                      key={s.label}
                      suggestion={s.label}
                      className="text-xs! h-7! px-2.5! pt-1!"
                      onClick={() => handleSuggestionClick(s.value)}
                    >
                      {s.icon}
                      <span>{s.label}</span>
                    </Suggestion>
                  ))}
                </Suggestions>
              </div>
            </div>

            <div className="absolute -translate-1/2 left-1/2 w-[5000px] h-[3000px] top-[80%] -z-10">
              <div className="-translate-x-1/2 absolute bottom-[calc(100%-300px)] left-1/2 h-[2000px] w-[2000px] opacity-20 bg-radial-primary"></div>
              <div className="absolute -mt-2.5 size-full rounded-[50%] bg-primary/20 opacity-70 [box-shadow:0_-15px_24.8px_var(--primary)]"></div>
              <div
                className="absolute z-0 size-full rounded-[50%}
                bg-background"
              ></div>
            </div>
          </div>
        </div>

        <div className="w-full py-10 ">
          <div className="mx-auto max-w-3xl">
            <div>
              <h1 className="font-medium text-xl truncate-tight">
                Recent Projects
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
