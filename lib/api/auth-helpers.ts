import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export type AuthedSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export async function requireUserSession(): Promise<
  | { session: AuthedSession; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
