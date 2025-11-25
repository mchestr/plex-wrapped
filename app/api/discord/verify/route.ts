import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function extractSecret(request: Request): string | null {
  const headerKey = request.headers.get("x-plexwrapped-bot-key")
  if (headerKey) return headerKey

  const authHeader = request.headers.get("authorization")
  if (!authHeader) return null

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim()
  }

  return authHeader.trim()
}

export async function POST(request: Request) {
  const integration = await prisma.discordIntegration.findUnique({ where: { id: "discord" } })
  if (!integration?.botSharedSecret) {
    return NextResponse.json({ error: "Bot verification is not configured" }, { status: 503 })
  }

  const providedSecret = extractSecret(request)
  if (!providedSecret || providedSecret !== integration.botSharedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { discordUserId?: string }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const discordUserId = payload.discordUserId?.trim()
  if (!discordUserId) {
    return NextResponse.json({ error: "discordUserId is required" }, { status: 400 })
  }

  const connection = await prisma.discordConnection.findUnique({
    where: { discordUserId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          plexUserId: true,
          isAdmin: true,
        },
      },
    },
  })

  if (!connection || connection.revokedAt) {
    return NextResponse.json({ linked: false })
  }

  return NextResponse.json({
    linked: true,
    user: {
      id: connection.userId,
      name: connection.user.name,
      email: connection.user.email,
      plexUserId: connection.user.plexUserId,
      isAdmin: connection.user.isAdmin,
    },
    metadataSyncedAt: connection.metadataSyncedAt,
    linkedAt: connection.linkedAt,
  })
}

