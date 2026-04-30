import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
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
            № 01 &nbsp;·&nbsp; Create account
          </p>
          <h1 className="mb-6 font-display text-[clamp(2.25rem,7vw,3.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
            Join Camille.
          </h1>
          <p className="mb-10 max-w-[36ch] font-display-sm text-[17px] leading-[1.55] text-ink-2">
            Choose a password, then we&apos;ll set your level and voice on the next screen. Magic link
            sign-in lives on the sign-in page.
          </p>
          <SignUpForm />
          <div className="my-10 h-px bg-rule" />
          <p className="text-center text-[13px] text-mute">
            Already have an account?{" "}
            <Link href="/sign-in" className="editorial-link text-ink transition-colors hover:text-wine">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <footer className="mt-auto flex items-baseline justify-between px-6 pb-8 sm:px-10">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
          Paris · Brooklyn · Lisboa
        </span>
        <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          ← Home
        </Link>
      </footer>
    </>
  );
}
