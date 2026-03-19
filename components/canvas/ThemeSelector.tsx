"use client";

import { useCanvas } from "@/context/CanvasProvider";
import { cn } from "@/lib/utils";
import { parseThemeColors, ThemeType } from "@/types/themes";
import { CheckIcon } from "lucide-react";

export default function ThemeSelector() {
  const { themes, theme: currentTheme, setTheme } = useCanvas();

  return (
    <div className="flex flex-col max-h-96">
      <div className="flex-1 pb-2 px-4 overflow-y-auto">
        <h3 className="font-semibold text-sm mb-2">Choose a theme</h3>
        <div className="py-2 space-y-3">
          {themes?.map((theme) => (
            <ThemeItem
              key={theme.id}
              theme={theme}
              isSelected={currentTheme?.id === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeItem({
  theme,
  isSelected,
  onSelect,
}: {
  theme: ThemeType;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const colors = parseThemeColors(theme.style);
  return (
    <button
      onClick={onSelect}
      className={cn(
        `flex items-center justify-between w-full p-1 rounded-xl border gap-4 bg-background`,
        isSelected ? "border-2" : "",
      )}
      style={{ borderColor: isSelected ? colors.primary : undefined }}
    >
      <div className="flex gap-2 ">
        {["primary", "secondary", "accent", "muted"].map((key) => (
          <div
            className="w-4 h-4 rounded-full border"
            key={key}
            style={{
              backgroundColor: colors[key as keyof typeof colors],
              borderColor: "#ccc",
              width: "16px",
              height: "16px",
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 flex-[0.9]">
        <span className="text-sm">{theme.name}</span>
        {isSelected && <CheckIcon size={16} color={colors.primary} />}
      </div>
    </button>
  );
}
