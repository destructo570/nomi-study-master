import { config as loadEnv } from "dotenv"
import { resolve } from "node:path"
import { defineConfig } from "drizzle-kit"

loadEnv({ path: resolve(__dirname, "../../apps/backend/.env") })
loadEnv()

const url = process.env.DATABASE_URL

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to apps/backend/.env before running drizzle-kit.",
  )
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
})
