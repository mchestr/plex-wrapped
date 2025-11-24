import { getSonarrCalendar, getSonarrDiskSpace, getSonarrHealth, getSonarrHistory, getSonarrQualityProfiles, getSonarrQueue, getSonarrRootFolders, getSonarrSeries, getSonarrSeriesById, getSonarrSystemStatus, getSonarrWantedMissing, searchSonarrSeries } from "@/lib/connections/sonarr"
import { prisma } from "@/lib/prisma"

export async function executeSonarrTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  const server = await prisma.sonarr.findFirst({ where: { isActive: true } })
  if (!server) return "Error: No active Sonarr server configured."

  const config = {
    name: server.name,
    url: server.url,
    apiKey: server.apiKey,
    publicUrl: server.publicUrl || undefined,
  }

  switch (toolName) {
    case "get_sonarr_status": {
      const [status, queue, health, disk] = await Promise.all([
        getSonarrSystemStatus(config),
        getSonarrQueue(config),
        getSonarrHealth(config),
        getSonarrDiskSpace(config),
      ])
      return JSON.stringify({ status, queue, health, disk })
    }
    case "search_sonarr_series": {
      if (typeof args.term !== "string") {
        return "Error: 'term' parameter is required and must be a string"
      }
      const results = await searchSonarrSeries(config, args.term)
      return JSON.stringify(results)
    }
    case "get_sonarr_history": {
      const pageSize = typeof args.pageSize === "number" ? args.pageSize : 20
      const history = await getSonarrHistory(config, pageSize)
      return JSON.stringify(history)
    }
    case "get_sonarr_queue": {
      const queue = await getSonarrQueue(config)
      return JSON.stringify(queue)
    }
    case "get_sonarr_series": {
      const series = await getSonarrSeries(config)
      return JSON.stringify(series)
    }
    case "get_sonarr_series_details": {
      if (typeof args.seriesId !== "number") {
        return "Error: 'seriesId' parameter is required and must be a number"
      }
      const series = await getSonarrSeriesById(config, args.seriesId)
      return JSON.stringify(series)
    }
    case "get_sonarr_calendar": {
      const startDate = typeof args.startDate === "string" ? args.startDate : undefined
      const endDate = typeof args.endDate === "string" ? args.endDate : undefined
      const calendar = await getSonarrCalendar(config, startDate, endDate)
      return JSON.stringify(calendar)
    }
    case "get_sonarr_wanted_missing": {
      const pageSize = typeof args.pageSize === "number" ? args.pageSize : 20
      const missing = await getSonarrWantedMissing(config, pageSize)
      return JSON.stringify(missing)
    }
    case "get_sonarr_root_folders": {
      const folders = await getSonarrRootFolders(config)
      return JSON.stringify(folders)
    }
    case "get_sonarr_quality_profiles": {
      const profiles = await getSonarrQualityProfiles(config)
      return JSON.stringify(profiles)
    }
    default:
      return "Error: Unknown Sonarr tool"
  }
}

