import { LoadingStatusType, useCanvas } from "@/context/CanvasProvider";
import { cn } from "@/lib/utils";
import { Spinner } from "../ui/spinner";
import CanvasFloatingToolbar from "./CanvasFloatingToolbar";

export default function Canvas({
  projectId,
  isPending,
  projectName,
}: {
  projectId: string;
  isPending: boolean;
  projectName: string | null;
}) {
  const { theme, frames, selectedFrame, setSelectedFrameId, loadingStatus } =
    useCanvas();

  const currentStatus = isPending
    ? "fetching"
    : loadingStatus !== "idle" && loadingStatus !== "completed"
      ? loadingStatus
      : null;
  return (
    <>
      <div className="relative w-full h-full overflow-hidden ">
        <CanvasFloatingToolbar />
        {currentStatus && <CanvasLoader status={currentStatus} />}
        <div
          className={cn(
            `absolute inset-0 w-full h-full bg-[#eee] dark:bg-[#242423] p-3`,
          )}
          style={{
            backgroundImage:
              "radial-gradient(circle,var(--primary)) 1px, transparent 1px",
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>
    </>
  );
}

function CanvasLoader({}: { status?: LoadingStatusType | "fetching" }) {
  return (
    <div
      className={cn(
        `absolute top-4 left-1/2 -translate-x-1/2 min-w-40 max-w-full px-4 pt-1.5 pb-2 rounded-br-xl rounded-bl-xl shadow-md flex items-center space-x-2 z-50`,
        status === "fetching" && "bg-gray-500 text-white",
        status === "running" && "bg-amber-500 text-white",
        status === "analyzing" && "bg-blue-500 text-white",
        status === "generating" && "bg-purple-500 text-white",
      )}
    >
      <Spinner className="w-4 h-4 stroke-3!" />
      <span className="text-sm font-semibold capitalize">
        {status === "fetching" ? "Loading Project" : status}
      </span>
    </div>
  );
}
