import { getPlexLibrarySections, getPlexOnDeck, getPlexRecentlyAdded, getPlexServerIdentity, getPlexSessions } from "@/lib/connections/plex"
import { prisma } from "@/lib/prisma"

export async function executePlexTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  const server = await prisma.plexServer.findFirst({ where: { isActive: true } })
  if (!server) return "Error: No active Plex server configured."

  const config = {
    name: server.name,
    url: server.url,
    token: server.token,
    publicUrl: server.publicUrl || undefined,
  }

  switch (toolName) {
    case "get_plex_status": {
      const identity = await getPlexServerIdentity(config)
      return JSON.stringify(identity)
    }
    case "get_plex_sessions": {
      const sessions = await getPlexSessions(config)
      return JSON.stringify(sessions)
    }
    case "get_plex_library_sections": {
      const result = await getPlexLibrarySections(config)
      if (!result.success) return result.error || "Error fetching library sections"
      return JSON.stringify(result.data)
    }
    case "get_plex_recently_added": {
      const limit = typeof args.limit === "number" ? args.limit : 20
      const result = await getPlexRecentlyAdded(config, limit)
      if (!result.success) return result.error || "Error fetching recently added"
      return JSON.stringify(result.data)
    }
    case "get_plex_on_deck": {
      const result = await getPlexOnDeck(config)
      if (!result.success) return result.error || "Error fetching on deck"
      return JSON.stringify(result.data)
    }
    default:
      return "Error: Unknown Plex tool"
  }
}

