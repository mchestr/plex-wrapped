import { z } from "zod"

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Application URLs
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),

  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),

  // Plex
  PLEX_CLIENT_IDENTIFIER: z.string().uuid("PLEX_CLIENT_IDENTIFIER must be a valid UUID").optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

/**
 * Validate environment variables at startup
 * Throws error if validation fails
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env)

    // Additional validation
    if (process.env.NODE_ENV === "production") {
      if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXTAUTH_URL) {
        throw new Error(
          "In production, either NEXT_PUBLIC_APP_URL or NEXTAUTH_URL must be set"
        )
      }

      if (process.env.NEXTAUTH_SECRET === "your-secret-key-here-generate-with-openssl-rand-base64-32") {
        throw new Error(
          "NEXTAUTH_SECRET must be changed from default value in production"
        )
      }
    }

    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:")
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`)
      })
    } else {
      console.error("❌ Environment validation error:", error)
    }
    process.exit(1)
  }
}

// Validate on import (only in non-test environments)
if (process.env.NODE_ENV !== "test") {
  validateEnv()
}

