import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <>
      <header className="flex items-baseline justify-between px-6 pb-6 pt-8 sm:px-10">
        <Link
          href="/"
          className="font-display-sm text-[20px] tracking-[-0.01em] text-ink transition-colors hover:text-wine"
        >
          Camille<span className="text-wine">.</span>
        </Link>
      </header>
      <div className="-mt-8 flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[420px]">
          <p className="mb-10 font-mono text-[10px] uppercase tracking-[0.22em] text-mute">
            № 01 &nbsp;·&nbsp; Sign in
          </p>
          <h1 className="mb-6 font-display text-[clamp(2.5rem,8vw,4rem)] leading-[0.95] tracking-[-0.02em] text-ink">
            Welcome back.
          </h1>
          <p className="mb-10 max-w-[36ch] font-display-sm text-[17px] leading-[1.55] text-ink-2 sm:text-[18px]">
            Thirty minutes of French a day, no badges, no hollow encouragement. We pick up where you
            left off.
          </p>
          <SignInForm />
          <div className="my-10 h-px bg-rule" />
          <p className="text-[13px] text-mute">
            New here?{" "}
            <Link href="/" className="editorial-link text-ink transition-colors hover:text-wine">
              Read about the method
            </Link>
            {" · "}
            <Link href="/sign-up" className="editorial-link text-ink transition-colors hover:text-wine">
              Create account
            </Link>
          </p>
        </div>
      </div>
      <footer className="mt-auto flex items-baseline justify-between px-6 pb-8 sm:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
          Paris · Brooklyn · Lisboa
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
          App build
        </span>
      </footer>
    </>
  );
}
