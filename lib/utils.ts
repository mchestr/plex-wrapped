import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a secure random token for sharing wrapped content
 * Uses crypto.randomBytes for cryptographically secure randomness
 * Returns a URL-safe base64 string (32 bytes = 43 characters)
 */
export function generateShareToken(): string {
  // Generate 32 random bytes (256 bits) for strong security
  const bytes = randomBytes(32)
  // Convert to base64url (URL-safe base64)
  return bytes.toString("base64url")
}

/**
 * Get the base URL for the application (server-side only)
 *
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (preferred for public URLs)
 * 2. NEXTAUTH_URL (fallback, also required by NextAuth.js)
 *
 * Falls back to localhost only in development mode.
 * For client-side URL construction, use window.location.origin instead.
 *
 * @throws Error in production if neither environment variable is set
 */
export function getBaseUrl(): string {
  // Prefer NEXT_PUBLIC_APP_URL for public-facing URLs
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Fall back to NEXTAUTH_URL (required by NextAuth)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  // Only allow localhost fallback in development
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"
  }

  // In production, require at least one to be set
  throw new Error(
    "Base URL is not configured. Please set NEXT_PUBLIC_APP_URL (or NEXTAUTH_URL) environment variable to your application URL (e.g., https://yourdomain.com)."
  )
}

