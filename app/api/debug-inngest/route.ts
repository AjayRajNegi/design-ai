// app/api/debug-inngest/route.ts
export async function GET() {
  const key = process.env.INNGEST_SIGNING_KEY;

  return Response.json({
    hasKey: Boolean(key),
    prefix: key ? key.slice(0, 12) : null,
  });
}
