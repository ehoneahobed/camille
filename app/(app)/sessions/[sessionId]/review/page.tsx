import { redirect } from "next/navigation";

/** Plan alias: transcript + actions live on `/sessions/[id]/transcript`. */
export default async function SessionReviewRedirect({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/sessions/${sessionId}/transcript`);
}
