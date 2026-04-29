import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/mail";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const resolvedSecret =
  secret && secret.length >= 32
    ? secret
    : process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("BETTER_AUTH_SECRET must be set (≥32 characters) in production.");
        })()
      : "development-only-secret-change-me-32chars!!";

if ((!secret || secret.length < 32) && process.env.NODE_ENV !== "production") {
  console.warn(
    "[auth] BETTER_AUTH_SECRET should be set to a random string of at least 32 characters.",
  );
}

export const auth = betterAuth({
  secret: resolvedSecret,
  baseURL,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({
          to: email,
          subject: "Sign in to Camille",
          html: `<p>Click the link below to sign in. It expires in 10 minutes.</p><p><a href="${url}">Sign in</a></p>`,
        });
      },
    }),
    nextCookies(),
  ],
});
