import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/shared/database";
import { createId } from "@/shared/utils/id";

export const auth = betterAuth({
  appName: "LokaRent",
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  user: {
    modelName: "authUser",
  },
  session: {
    modelName: "authSession",
  },
  account: {
    modelName: "authAccount",
  },
  verification: {
    modelName: "authVerification",
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async () => {
      // Email delivery is not configured in this phase; do not expose reset tokens.
    },
  },
  advanced: {
    database: {
      generateId: () => createId(),
    },
  },
  plugins: [nextCookies()],
});
