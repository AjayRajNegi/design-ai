"use client";

import { getHTMLWrapper } from "@/lib/frameWrapper";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CodeBlock, CodeBlockCopyButton } from "../ai-elements/code-block";

type PropsType = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  html: string;
  title?: string;
  themeStyle?: string;
};
export default function HtmlDialog({
  open,
  onOpenChange,
  html,
  title,
  themeStyle,
}: PropsType) {
  const fullHtml = getHTMLWrapper(html, title, themeStyle);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-7xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>{title || "Untitled"}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full overflow-y-auto">
          <div>
            <CodeBlock
              className="w-full h-auto"
              code={fullHtml}
              language="html"
              showLineNumbers
            >
              <CodeBlockCopyButton className="fixed top-16 right-12 z-50 bg-muted!" />
            </CodeBlock>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
