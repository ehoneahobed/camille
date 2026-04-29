import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Choose a password. You can also use magic links from the sign-in page.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-zinc-200 underline hover:text-white">
          Sign in
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
