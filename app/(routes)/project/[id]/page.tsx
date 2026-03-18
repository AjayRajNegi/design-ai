"use client";

import { useGetProjectById } from "@/features/user-project-id";
import { useParams } from "next/navigation";
import Header from "./_common/Header";
import { CanvasProvider } from "@/context/CanvasProvider";
import Canvas from "@/components/canvas/Canvas";

export default function Page() {
  const params = useParams();
  const id = params.id as string;

  const { data: project, isPending } = useGetProjectById(id);
  const projectName: string = project?.name;
  const frames = project?.frames || [];
  const themeId = project?.theme || "";
  const hasInitialData = frames.length > 0;

  if (!project && !isPending) {
    return <div>Project not found.</div>;
  }
  return (
    <div className="relative h-screen w-full flex flex-col">
      <Header projectName={projectName} />
      <CanvasProvider
        initialFrames={frames}
        initialThemeId={themeId}
        hasInitialData={hasInitialData}
        projectId={project?.id}
      >
        <div className="flex w-full overflow-hidden">
          <div className="relative">
            <Canvas />
          </div>
        </div>
      </CanvasProvider>
    </div>
  );
}
