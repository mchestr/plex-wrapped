"use client"

import { WrappedData, WrappedSection } from "@/types/wrapped"
import { HeroSection } from "@/components/wrapped/wrapped-sections/hero-section"
import { TotalWatchTimeSection } from "@/components/wrapped/wrapped-sections/total-watch-time-section"
import { MoviesBreakdownSection } from "@/components/wrapped/wrapped-sections/movies-breakdown-section"
import { ShowsBreakdownSection } from "@/components/wrapped/wrapped-sections/shows-breakdown-section"
import { TopMoviesSection } from "@/components/wrapped/wrapped-sections/top-movies-section"
import { TopShowsSection } from "@/components/wrapped/wrapped-sections/top-shows-section"
import { ServerStatsSection } from "@/components/wrapped/wrapped-sections/server-stats-section"
import { OverseerrStatsSection } from "@/components/wrapped/wrapped-sections/overseerr-stats-section"
import { InsightsSection } from "@/components/wrapped/wrapped-sections/insights-section"
import { FunFactsSection } from "@/components/wrapped/wrapped-sections/fun-facts-section"
import { FormattedText } from "@/components/shared/formatted-text"

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

