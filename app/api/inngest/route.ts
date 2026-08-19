import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { generateScreen } from "@/inngest/functions/generateScreen";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateScreen],
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
