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
      className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute transition-colors hover:text-wine disabled:opacity-50"
    >
      {pending ? "…" : "Sign out"}
    </button>
  );
}
