"use client";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import { Spinner } from "./ui/spinner";
import { CornerDownLeftIcon } from "lucide-react";

interface PropsType {
  className?: string;
  promptText: string;
  isLoading: boolean;
  onSubmit?: () => void;
  hideSubmitButton?: boolean;
  setPromptText: (value: string) => void;
}

export default function PromptInput({
  className,
  promptText,
  isLoading,
  onSubmit,
  hideSubmitButton,
  setPromptText,
}: PropsType) {
  return (
    <div className="bg-background ">
      <InputGroup
        className={cn(
          "min-h-[172px] bg-background rounded-xl ",
          className && className,
        )}
      >
        <InputGroupTextarea
          className="text-base! py-2.5!!"
          placeholder="I want to design an app that..."
          value={promptText}
          onChange={(e) => {
            setPromptText(e.target.value);
          }}
        />
        <InputGroupAddon
          align="block-end"
          className="flex items-center justify-end"
        >
          {!hideSubmitButton && (
            <InputGroupButton
              variant="default"
              className=""
              size="sm"
              disabled={!promptText?.trim() || isLoading}
              onClick={() => onSubmit?.()}
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  Design <CornerDownLeftIcon className="size-4" />
                </>
              )}
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}
