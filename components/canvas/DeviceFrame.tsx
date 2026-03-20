"use client";
import { TOOL_MODE_ENUM, ToolModeType } from "@/constants/canvas";
import { Rnd } from "react-rnd";
import { useCanvas } from "@/context/CanvasProvider";
import { getHTMLWrapper } from "@/lib/frameWrapper";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import DeviceFrameToolbar from "./DeviceFrameToolbar";

type PropsType = {
  html: string;
  title?: string;
  width?: number;
  minHeight?: number | string;
  initialPosition?: { x: number; y: number };
  frameId: string;
  scale?: number;
  toolMode: ToolModeType;
  themeStyle?: string;
};

export default function DeviceFrame({
  html,
  title = "Undefined",
  width = 420,
  minHeight = 800,
  initialPosition = { x: 0, y: 0 },
  frameId,
  scale = 1,
  toolMode,
  themeStyle,
}: PropsType) {
  const { selectedFrameId, setSelectedFrameId } = useCanvas();
  const [frameSize, setFrameSize] = useState({
    width,
    height: minHeight,
  });
  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const isSelected = selectedFrameId === frameId;
  const fullHtml = getHTMLWrapper(html, title, themeStyle, frameId);

  return (
    <Rnd
      default={{
        x: initialPosition.x,
        y: initialPosition.y,
        width,
        height: minHeight,
      }}
      minWidth={width}
      minHeight={minHeight}
      size={{ width: frameSize.width, height: frameSize.height }}
      disableDragging={toolMode === TOOL_MODE_ENUM.HAND}
      enableResizing={isSelected && toolMode !== TOOL_MODE_ENUM.HAND}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        if (toolMode === TOOL_MODE_ENUM.SELECT) {
          setSelectedFrameId(frameId);
        }
      }}
      resizeHandleComponent={{
        topLeft: isSelected ? <Handle /> : undefined,
        topRight: isSelected ? <Handle /> : undefined,
        bottomLeft: isSelected ? <Handle /> : undefined,
        bottomRight: isSelected ? <Handle /> : undefined,
      }}
      resizeHandleStyles={{
        top: { cursor: "ns-resize" },
        bottom: { cursor: "ns-resize" },
        left: { cursor: "ew-resize" },
        right: { cursor: "ew-resize" },
      }}
      onResize={(e, direction, ref) => {
        setFrameSize({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
        });
      }}
      className={cn(
        "relative z-10",
        isSelected &&
          toolMode !== TOOL_MODE_ENUM.HAND &&
          "ring-3 ring-blue-400 ring-offset-1",
        toolMode === TOOL_MODE_ENUM.HAND
          ? "cursor-grab! active:cursor-grabbing!"
          : "cursor-move",
      )}
    >
      <div className="w-full h-full">
        <DeviceFrameToolbar
          title={title}
          isSelected={isSelected && toolMode !== TOOL_MODE_ENUM.HAND}
          disabled={false}
          isDownloading={false}
          onDownloadPng={() => {}}
          onOpenHtmlDialog={() => {}}
        />
        <div
          className={cn(
            `relative w-full h-auto shadow-sm rounded-[36px] overflow-hidden`,
            isSelected && toolMode !== TOOL_MODE_ENUM.HAND && "rounded-md",
          )}
        >
          <iframe
            ref={iFrameRef}
            srcDoc={fullHtml}
            title={title}
            sandbox="allow-scripts allows-same-origin"
            style={{
              width: "100%",
              minHeight: `${minHeight}px`,
              height: `${frameSize.height}px`,
              border: "none",
              pointerEvents: "none",
              display: "block",
              background: "white",
            }}
          />
        </div>
      </div>
    </Rnd>
  );
}

const Handle = () => (
  <div className="z-30 h-4 w-4 bg-white border-2 border-blue-500" />
);
