"use client"

import { WrappedData, WrappedSection } from "@/types/wrapped"
import { HeroSection } from "./hero-section"
import { TotalWatchTimeSection } from "./total-watch-time-section"
import { MoviesBreakdownSection } from "./movies-breakdown-section"
import { ShowsBreakdownSection } from "./shows-breakdown-section"
import { TopMoviesSection } from "./top-movies-section"
import { TopShowsSection } from "./top-shows-section"
import { ServerStatsSection } from "./server-stats-section"
import { OverseerrStatsSection } from "./overseerr-stats-section"
import { InsightsSection } from "./insights-section"
import { FunFactsSection } from "./fun-facts-section"
import { FormattedText } from "../../shared/formatted-text"

interface SectionRendererProps {
  section: WrappedSection | undefined
  wrappedData: WrappedData
  sectionIndex: number
}

export function SectionRenderer({ section, wrappedData, sectionIndex }: SectionRendererProps) {
  if (!section || !section.type) {
    return (
      <div className="text-center">
        <p className="text-lg text-slate-300">Section data unavailable</p>
      </div>
    )
  }

  switch (section.type) {
    case "hero":
      return <HeroSection section={section} sectionIndex={sectionIndex} />

    case "total-watch-time":
      return <TotalWatchTimeSection section={section} wrappedData={wrappedData} />

    case "movies-breakdown":
      return <MoviesBreakdownSection section={section} wrappedData={wrappedData} sectionIndex={sectionIndex} />

    case "shows-breakdown":
      return <ShowsBreakdownSection section={section} wrappedData={wrappedData} sectionIndex={sectionIndex} />

    case "top-movies":
      return <TopMoviesSection section={section} />

    case "top-shows":
      return <TopShowsSection section={section} />

    case "server-stats":
      return <ServerStatsSection section={section} wrappedData={wrappedData} sectionIndex={sectionIndex} />

    case "overseerr-stats":
      return <OverseerrStatsSection section={section} wrappedData={wrappedData} sectionIndex={sectionIndex} />

    case "insights":
      return <InsightsSection section={section} wrappedData={wrappedData} />

    case "fun-facts":
      return <FunFactsSection section={section} wrappedData={wrappedData} sectionIndex={sectionIndex} />

    case "service-stats":
      // Filtered out - don't render this section
      return null

    default:
      return (
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">{section.title}</h2>
          {section.content && (
            <p className="text-lg text-slate-300">
              <FormattedText text={section.content} />
            </p>
          )}
        </div>
      )
  }
}

