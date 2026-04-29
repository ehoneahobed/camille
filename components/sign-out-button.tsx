"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      className="text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-orange-400 disabled:opacity-50"
    >
      {pending ? "…" : "Sign out"}
    </button>
  );
}
