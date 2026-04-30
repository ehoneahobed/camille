import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Full-bleed experiences (e.g. live call) without the main app chrome so the UI can match the prototype.
 */
export default async function ImmersiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
