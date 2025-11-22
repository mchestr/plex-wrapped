"use client"

import { FormattedText } from "@/components/shared/formatted-text"
import { SectionHeader } from "@/components/wrapped/wrapped-sections/section-header"
import { BarChart } from "@/components/wrapped/wrapped-charts"
import { WrappedData, WrappedSection } from "@/types/wrapped"

interface ServerStatsSectionProps {
  section: WrappedSection
  wrappedData: WrappedData
  sectionIndex: number
}

export function ServerStatsSection({ section, wrappedData }: ServerStatsSectionProps) {
  return (
    <div className="text-center space-y-6">
      <SectionHeader title={section.title} subtitle={section.subtitle} />
      {wrappedData.statistics.serverStats && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
          <div className="relative text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">
            {wrappedData.statistics.serverStats.totalStorageFormatted}
          </div>
          <div className="relative text-base sm:text-lg text-slate-300 mb-6">
            Total Media Content
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm relative">
            {[
              { label: "Movies", value: wrappedData.statistics.serverStats.librarySize.movies },
              { label: "Shows", value: wrappedData.statistics.serverStats.librarySize.shows },
              { label: "Episodes", value: wrappedData.statistics.serverStats.librarySize.episodes },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {value.toLocaleString()}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">{label}</div>
              </div>
            ))}
          </div>
          {/* Library size bar chart */}
          <div className="mt-6">
            <BarChart
              data={[
                { label: "Movies", value: wrappedData.statistics.serverStats.librarySize.movies },
                { label: "Shows", value: wrappedData.statistics.serverStats.librarySize.shows },
                { label: "Episodes", value: wrappedData.statistics.serverStats.librarySize.episodes },
              ]}
              color="cyan"
              disableAnimations={true}
            />
          </div>
        </div>
      )}
      {section.content && (
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          <FormattedText text={section.content} />
        </p>
      )}
    </div>
  )
}

