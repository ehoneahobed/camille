"use client";

import { IconArrow } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "magic" | null>(null);

  const inputClass =
    "mt-3 w-full border-0 border-b border-rule-2 bg-transparent pb-3 font-display-sm text-[18px] text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-ink";

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading("password");
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });
    setLoading(null);
    if (error) {
      setMessage(error.message ?? "Sign in failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onMagicLink() {
    setMessage(null);
    setLoading("magic");
    const { error } = await authClient.signIn.magicLink({
      email,
      callbackURL: "/dashboard",
    });
    setLoading(null);
    if (error) {
      setMessage(error.message ?? "Could not send link");
      return;
    }
    setMessage("Check your inbox for the sign-in link.");
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={onPasswordSubmit} className="flex flex-col gap-8">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Email address
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading !== null}
            className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-[14px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading === "password" ? "Signing in…" : "Sign in with password"}
            {loading === null ? <IconArrow size={14} /> : null}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
            Or magic link below
          </span>
        </div>
      </form>
      <button
        type="button"
        disabled={loading !== null || !email}
        onClick={() => void onMagicLink()}
        className="inline-flex w-full items-center justify-center border border-rule-2 px-6 py-3 text-[14px] font-medium tracking-[0.01em] text-ink transition-colors hover:bg-canvas-2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
      >
        {loading === "magic" ? "Sending…" : "Email me a magic link"}
      </button>
      {message ? (
        <p className="text-center text-[14px] leading-relaxed text-ink-2" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
