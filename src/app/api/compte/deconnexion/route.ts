import { effacerSession } from "@/lib/compte";

export async function POST() {
  await effacerSession();
  return Response.json({ ok: true });
}
