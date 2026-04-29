"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<"password" | "magic" | null>(null);

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
    <div className="flex flex-col gap-6">
      <form onSubmit={onPasswordSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </label>
        <button
          type="submit"
          disabled={loading !== null}
          className="rounded-full bg-zinc-100 py-2.5 text-sm font-medium text-zinc-950 disabled:opacity-50"
        >
          {loading === "password" ? "Signing in…" : "Sign in with password"}
        </button>
      </form>
      <div className="relative text-center text-xs text-zinc-500">
        <span className="bg-[#0a0a0a] px-2">or</span>
      </div>
      <button
        type="button"
        disabled={loading !== null || !email}
        onClick={onMagicLink}
        className="rounded-full border border-zinc-600 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-400 disabled:opacity-50"
      >
        {loading === "magic" ? "Sending…" : "Email me a magic link"}
      </button>
      {message ? (
        <p className="text-center text-sm text-zinc-300" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
