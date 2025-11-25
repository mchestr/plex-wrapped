import { getTautulliActivity, getTautulliHistory, getTautulliLibraryMediaInfo, getTautulliLibraryNames, getTautulliMostWatched, getTautulliRecentlyWatched, getTautulliServerInfo, getTautulliTopUsers, getTautulliUserWatchTimeStats, getTautulliUsers } from "@/lib/connections/tautulli"
import { prisma } from "@/lib/prisma"

export async function executeTautulliTool(
  toolName: string,
  args: Record<string, unknown>,
  userId?: string,
  context?: string
): Promise<string> {
  const server = await prisma.tautulli.findFirst({ where: { isActive: true } })
  if (!server) return "Error: No active Tautulli server configured."

  const config = {
    name: server.name,
    url: server.url,
    apiKey: server.apiKey,
    publicUrl: server.publicUrl || undefined,
  }

  switch (toolName) {
    case "get_tautulli_status": {
      const info = await getTautulliServerInfo(config)
      return JSON.stringify(info)
    }
    case "get_tautulli_activity": {
      const activity = await getTautulliActivity(config)

      // In Discord context, scope activity to the requesting user
      if (context === "discord" && userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { plexUserId: true },
        })

        if (user?.plexUserId) {
          // Get Tautulli users to map Plex user ID to Tautulli user ID
          const tautulliUsers = await getTautulliUsers(config)
          if (tautulliUsers?.response?.data) {
            const users = Array.isArray(tautulliUsers.response.data)
              ? tautulliUsers.response.data
              : [tautulliUsers.response.data]

            // Find Tautulli user ID matching the Plex user ID
            const tautulliUser = users.find(
              (u: any) => u.plex_id === user.plexUserId || u.user_id?.toString() === user.plexUserId
            )

            if (tautulliUser?.user_id && activity?.response?.data?.sessions) {
              // Filter activity sessions to only include those belonging to the user
              const sessions = Array.isArray(activity.response.data.sessions)
                ? activity.response.data.sessions.filter(
                    (session: any) => session.user_id === tautulliUser.user_id
                  )
                : activity.response.data.sessions.user_id === tautulliUser.user_id
                  ? [activity.response.data.sessions]
                  : []

              return JSON.stringify({
                ...activity,
                response: {
                  ...activity.response,
                  data: {
                    ...activity.response.data,
                    session_count: sessions.length,
                    sessions,
                  },
                },
              })
            } else if (tautulliUser?.user_id) {
              // No sessions found for user, return empty activity
              return JSON.stringify({
                ...activity,
                response: {
                  ...activity.response,
                  data: {
                    ...activity.response.data,
                    session_count: 0,
                    sessions: [],
                  },
                },
              })
            }
          }
        } else {
          // User doesn't have a Plex user ID, return empty activity
          return JSON.stringify({
            ...activity,
            response: {
              ...activity.response,
              data: {
                ...activity.response.data,
                session_count: 0,
                sessions: [],
              },
            },
          })
        }
      }

      return JSON.stringify(activity)
    }
    case "get_tautulli_library_stats": {
      const stats = await getTautulliLibraryMediaInfo(config)
      return JSON.stringify(stats)
    }
    case "get_tautulli_library_names": {
      const names = await getTautulliLibraryNames(config)
      return JSON.stringify(names)
    }
    case "get_tautulli_users": {
      const users = await getTautulliUsers(config)
      return JSON.stringify(users)
    }
    case "get_tautulli_watch_history": {
      const userId = typeof args.userId === "number" ? args.userId : undefined
      const limit = typeof args.limit === "number" ? args.limit : 20
      const history = await getTautulliHistory(config, userId, limit)
      return JSON.stringify(history)
    }
    case "get_tautulli_recently_watched": {
      const limit = typeof args.limit === "number" ? args.limit : 20
      const recent = await getTautulliRecentlyWatched(config, limit)
      return JSON.stringify(recent)
    }
    case "get_tautulli_most_watched": {
      const limit = typeof args.limit === "number" ? args.limit : 20
      const mostWatched = await getTautulliMostWatched(config, limit)
      return JSON.stringify(mostWatched)
    }
    case "get_tautulli_top_users": {
      const limit = typeof args.limit === "number" ? args.limit : 10
      const topUsers = await getTautulliTopUsers(config, limit)
      return JSON.stringify(topUsers)
    }
    case "get_tautulli_user_watch_stats": {
      const userId = typeof args.userId === "number" ? args.userId : undefined
      const stats = await getTautulliUserWatchTimeStats(config, userId)
      return JSON.stringify(stats)
    }
    default:
      return "Error: Unknown Tautulli tool"
  }
}

