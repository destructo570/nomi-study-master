import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"

import { db } from "@workspace/db"

import { seedExampleNotebook } from "./seed/example-notebook"

const authSecret = process.env.BETTER_AUTH_SECRET
const authBaseUrl = process.env.BETTER_AUTH_URL
const webOrigin = process.env.WEB_ORIGIN

if (process.env.NODE_ENV === "production") {
  if (!authSecret || authSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters")
  }
  if (!authBaseUrl || !webOrigin) {
    throw new Error("BETTER_AUTH_URL and WEB_ORIGIN are required in production")
  }
}

const trustedOrigins = (() => {
  const list = [webOrigin, authBaseUrl].filter(Boolean).map((s) => String(s))
  return Array.from(new Set(list))
})()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  baseURL: authBaseUrl,
  secret: authSecret,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "free",
        input: false,
      },
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
      language: {
        type: "string",
        defaultValue: "en",
        input: false,
      },
    },
  },
  account: {
    storeStateStrategy: "cookie",
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Drop the demo notebook into every newly created account so the
        // library isn't empty on first login. Failures are swallowed so a
        // bad seed never blocks sign-up.
        after: async (user) => {
          try {
            await seedExampleNotebook(user.id)
          } catch (err) {
            console.error(
              "[seed] failed to seed example notebook for",
              user.id,
              err
            )
          }
        },
      },
    },
  },
})

export type AuthSession = typeof auth.$Infer.Session
