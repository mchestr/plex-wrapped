import { getRadarrCalendar, getRadarrDiskSpace, getRadarrHealth, getRadarrHistory, getRadarrMovieById, getRadarrMovies, getRadarrQualityProfiles, getRadarrQueue, getRadarrRootFolders, getRadarrSystemStatus, getRadarrWantedMissing, searchRadarrMovies } from "@/lib/connections/radarr"
import { prisma } from "@/lib/prisma"

export async function executeRadarrTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  const server = await prisma.radarr.findFirst({ where: { isActive: true } })
  if (!server) return "Error: No active Radarr server configured."

  const config = {
    name: server.name,
    url: server.url,
    apiKey: server.apiKey,
    publicUrl: server.publicUrl || undefined,
  }

  switch (toolName) {
    case "get_radarr_status": {
      const [status, queue, health, disk] = await Promise.all([
        getRadarrSystemStatus(config),
        getRadarrQueue(config),
        getRadarrHealth(config),
        getRadarrDiskSpace(config),
      ])
      return JSON.stringify({ status, queue, health, disk })
    }
    case "search_radarr_movies": {
      if (typeof args.term !== "string") {
        return "Error: 'term' parameter is required and must be a string"
      }
      const results = await searchRadarrMovies(config, args.term)
      return JSON.stringify(results)
    }
    case "get_radarr_history": {
      const pageSize = typeof args.pageSize === "number" ? args.pageSize : 20
      const history = await getRadarrHistory(config, pageSize)
      return JSON.stringify(history)
    }
    case "get_radarr_queue": {
      const queue = await getRadarrQueue(config)
      return JSON.stringify(queue)
    }
    case "get_radarr_movies": {
      const movies = await getRadarrMovies(config)
      return JSON.stringify(movies)
    }
    case "get_radarr_movie_details": {
      if (typeof args.movieId !== "number") {
        return "Error: 'movieId' parameter is required and must be a number"
      }
      const movie = await getRadarrMovieById(config, args.movieId)
      return JSON.stringify(movie)
    }
    case "get_radarr_calendar": {
      const startDate = typeof args.startDate === "string" ? args.startDate : undefined
      const endDate = typeof args.endDate === "string" ? args.endDate : undefined
      const calendar = await getRadarrCalendar(config, startDate, endDate)
      return JSON.stringify(calendar)
    }
    case "get_radarr_wanted_missing": {
      const pageSize = typeof args.pageSize === "number" ? args.pageSize : 20
      const missing = await getRadarrWantedMissing(config, pageSize)
      return JSON.stringify(missing)
    }
    case "get_radarr_root_folders": {
      const folders = await getRadarrRootFolders(config)
      return JSON.stringify(folders)
    }
    case "get_radarr_quality_profiles": {
      const profiles = await getRadarrQualityProfiles(config)
      return JSON.stringify(profiles)
    }
    default:
      return "Error: Unknown Radarr tool"
  }
}

