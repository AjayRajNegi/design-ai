import { fetchRealtimeSubscriptionToken } from "@/app/action/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { FrameType } from "@/types/project";
import { THEME_LIST, ThemeType } from "@/types/themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type LoadingStatusType =
  | "idle"
  | "running"
  | "analyzing"
  | "generating"
  | "completed";

interface CanvasContextType {
  theme?: ThemeType;
  setTheme: (id: string) => void;
  themes: ThemeType[];

  frames: FrameType[];
  setFrames: (frames: FrameType[]) => void;
  updateFrame: (id: string, data: Partial<FrameType>) => void;
  addFrame: (frame: FrameType) => void;

  selectedFrameId: string | null;
  selectedFrame: FrameType | null;
  setSelectedFrameId: (id: string | null) => void;

  loadingStatus: LoadingStatusType;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({
  children,
  initialFrames,
  initialThemeId,
  hasInitialData,
  projectId,
}: {
  children: React.ReactNode;
  initialFrames: FrameType[];
  initialThemeId?: string;
  hasInitialData: boolean;
  projectId: string | null;
}) => {
  const [themeId, setThemeId] = useState<string>(
    initialThemeId || THEME_LIST[0].id,
  );

  const [frames, setFrames] = useState<FrameType[]>(initialFrames);
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<LoadingStatusType>(
    hasInitialData ? "idle" : "running",
  );
  const [prevProjectId, setPrevProjectId] = useState(projectId);

  if (projectId !== prevProjectId) {
    setPrevProjectId(projectId);
    setFrames(initialFrames);
    setThemeId(initialThemeId || THEME_LIST[0].id);
    setSelectedFrameId(null);
  }

  const theme = THEME_LIST.find((t) => t.id === themeId);
  const selectedFrame =
    selectedFrameId && frames.length !== 0
      ? frames.find((f) => f.id === selectedFrameId) || null
      : null;

  const { freshData } = useInngestSubscription({
    refreshToken: fetchRealtimeSubscriptionToken,
  });

  useEffect(() => {
    if (!freshData || freshData.length === 0) {
      return;
    }
    freshData.forEach((message) => {
      const { data, topic } = message;
      if (data.projectId !== projectId) return;

      switch (topic) {
        case "generation.start":
          setLoadingStatus("running");
          break;
        case "analysis.start":
          setLoadingStatus("analyzing");
          break;
        case "analysis.complete":
          setLoadingStatus("generating");
          if (data.theme) setThemeId(data.theme);

          if (data.screens && data.screens.length > 0) {
            const skeletonFrames: FrameType[] = data.screens.map((s: any) => ({
              id: s.id,
              title: s.name,
              htmlContent: "",
              isLoading: true,
            }));
            setFrames((prev) => [...prev, ...skeletonFrames]);
          }
          break;
        case "frame.created":
          if (data.frame) {
            setFrames((prev) => {
              const newFrames = [...prev];
              const idx = newFrames.findIndex((f) => f.id === data.screenId);
              if (idx !== -1) newFrames[idx] = data.frame;
              else newFrames.push(data.frame);
              return newFrames;
            });
          }
          break;
        case "generation.complete":
          setLoadingStatus("completed");
          setTimeout(() => {
            setLoadingStatus("idle");
          }, 1000);
          break;

        default:
          break;
      }
    });
  }, [projectId, freshData]);

  const addFrame = useCallback((frame: FrameType) => {
    setFrames((prev) => [...prev, frame]);
  }, []);
  const updateFrame = useCallback((id: string, data: Partial<FrameType>) => {
    setFrames((prev) => {
      return prev.map((f) => (f.id === id ? { ...f, ...data } : f));
    });
  }, []);

  return (
    <CanvasContext.Provider
      value={{
        theme,
        setTheme: setThemeId,
        themes: THEME_LIST,
        frames,
        setFrames,
        selectedFrame,
        selectedFrameId,
        setSelectedFrameId,
        updateFrame,
        addFrame,
        loadingStatus,
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be inside CanvasProvider.");
  return ctx;
};
