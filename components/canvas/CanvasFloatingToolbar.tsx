"use client";

import { useCanvas } from "@/context/CanvasProvider";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CameraIcon, ChevronDown, Palette, Save, Wand2 } from "lucide-react";
import PromptInput from "../PromptInput";
import { useState } from "react";
import { parseThemeColors } from "@/types/themes";
import { cn } from "@/lib/utils";
import ThemeSelector from "./ThemeSelector";
import { Separator } from "../ui/separator";
import {
  useGenerateDesignById,
  useUpdateProject,
} from "@/features/user-project-id";
import { Spinner } from "../ui/spinner";

export default function CanvasFloatingToolbar({
  projectId,
}: {
  projectId: string;
}) {
  const { themes, theme: currentTheme, setTheme } = useCanvas();
  const [promptText, setPromptText] = useState<string>("");

  const { mutate, isPending } = useGenerateDesignById(projectId);
  const update = useUpdateProject(projectId);

  const handleAIGenerate = () => {
    if (!prompt) return;
    mutate(promptText);
  };

  const handleUpdate = () => {
    if (!currentTheme) return;
    update.mutate(currentTheme.id);
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-10">
      <div className="w-full max-w-2xl bg-background dark:bg-gray-950 rounded-full shadow-xl border">
        <div className="flex flex-row items-center gap-2 px-2">
          <Popover>
            <PopoverTrigger>
              <div className="px-1.5 bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-full py-1.5 shadow-lg shadow-purple-200/50 cursor-pointer">
                <Wand2 className="size-4" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2 rounded-xl! shadow-lg border mt-1">
              <PromptInput
                promptText={promptText}
                setPromptText={setPromptText}
                className="min-h-[15px] ring-1! ring-purple-500 rounded-xl! shadow-none border-muted"
                hideSubmitButton={true}
              />
              <Button
                className="mt-2 w-full bg-linear-to-r from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-200/50 cursor-pointer"
                onClick={handleAIGenerate}
                disabled={isPending}
              >
                {isPending ? <Spinner /> : <>Design</>}
              </Button>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger>
              <div className="flex items-center gap-2 px-3 py-2">
                <Palette className="size-4" />
                <div className="flex gap-1.5">
                  {themes?.slice(0, 4)?.map((theme, index) => {
                    const colors = parseThemeColors(theme.style);
                    return (
                      <div
                        role="button"
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(theme.id);
                        }}
                        className={cn(
                          `w-6.5 h-6.5 rounded-full cursor-pointer`,
                          currentTheme?.id === theme.id &&
                            "ring-1 ring-offset-1",
                        )}
                        style={{
                          background: `linear-gradient(135deg,${colors.primary}, ${colors?.accent})`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  +{themes?.length - 4} more
                  <ChevronDown className="size-4" />
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="px-2 rounded-xl shadow-lg border">
              <ThemeSelector />
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-4! mt-3" />
          <div className="flex items-center gap-2 ">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full cursor-pointer p-1"
            >
              <CameraIcon size={4} />
            </Button>
            <Button
              variant="default"
              size="sm"
              className="rounded-full cursor-pointer"
              onClick={handleUpdate}
            >
              {update.isPending ? <Spinner /> : <Save size={4.5} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
