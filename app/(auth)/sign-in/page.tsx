import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Use your password or request a magic link to your email.
        </p>
      </div>
      <SignInForm />
      <p className="text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/sign-up" className="text-zinc-200 underline hover:text-white">
          Sign up
        </Link>
      </p>
      <p className="text-center text-sm">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300">
          ← Home
        </Link>
      </p>
    </main>
  );
}
