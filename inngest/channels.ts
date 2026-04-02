import { realtime } from "inngest";
import { z } from "zod";

export const userChannel = realtime.channel({
  name: ({ userId }: { userId: string }) => `user:${userId}`,
  topics: {
    "generation.start": {
      schema: z.object({
        status: z.string(),
        projectId: z.string(),
      }),
    },
    "analysis.start": {
      schema: z.object({
        status: z.string(),
        projectId: z.string(),
      }),
    },
    "analysis.complete": {
      schema: z.object({
        status: z.string(),
        theme: z.string(),
        totalScreens: z.number(),
        screens: z.array(z.any()),
        projectId: z.string(),
      }),
    },
    "frame.created": {
      schema: z.object({
        frame: z.any(),
        screenId: z.string(),
        projectId: z.string(),
      }),
    },
    "generation.complete": {
      schema: z.object({
        status: z.string(),
        projectId: z.string(),
      }),
    },
  },
});
