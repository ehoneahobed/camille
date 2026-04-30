"use client";

import { IconArrow } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputClass =
    "mt-3 w-full border-0 border-b border-rule-2 bg-transparent pb-3 font-display-sm text-[18px] text-ink outline-none transition-colors placeholder:text-mute-2 focus:border-ink";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: name.trim() || email.split("@")[0] || "Learner",
      callbackURL: "/onboarding",
    });
    setLoading(false);
    if (error) {
      setMessage(error.message ?? "Sign up failed");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Name (optional)</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">Email address</span>
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
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 text-[14px] font-medium tracking-[0.01em] text-canvas transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Creating…" : "Create account"}
        {!loading ? <IconArrow size={14} /> : null}
      </button>
      {message ? (
        <p className="text-center text-[14px] text-wine-2" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
