"use client"

import { FormattedText } from "../formatted-text"
import { SectionHeader } from "./section-header"
import { BarChart } from "../wrapped-charts"
import { WrappedData, WrappedSection } from "@/types/wrapped"

interface FunFactsSectionProps {
  section: WrappedSection
  wrappedData: WrappedData
  sectionIndex: number
}

export function FunFactsSection({ section, wrappedData, sectionIndex }: FunFactsSectionProps) {
  const factsCount = section.data?.facts?.length || 0

  return (
    <div className="text-center space-y-6">
      <SectionHeader title={section.title} subtitle={section.subtitle} />
      {section.content && (
        <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
          <FormattedText text={section.content} />
        </p>
      )}
      <div className="space-y-4 max-w-2xl mx-auto">
        {section.data?.facts?.map((fact: string, idx: number) => (
          <div
            key={idx}
            className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400" />
            <div className="flex items-start gap-4 relative">
              <div className="text-2xl">
                ✨
              </div>
              <p className="text-lg text-slate-300">
                <FormattedText text={fact} />
              </p>
            </div>
          </div>
        ))}
      </div>
      {wrappedData.statistics.serverStats && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-8 max-w-2xl mx-auto relative overflow-hidden mt-8">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
          <div className="relative text-4xl font-bold text-cyan-400 mb-4">
            {wrappedData.statistics.serverStats.totalStorageFormatted}
          </div>
          <div className="relative text-lg text-slate-300 mb-6">
            Total media content on {wrappedData.statistics.serverStats.serverName}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm relative">
            {[
              { label: "Movies", value: wrappedData.statistics.serverStats.librarySize.movies },
              { label: "Shows", value: wrappedData.statistics.serverStats.librarySize.shows },
              { label: "Episodes", value: wrappedData.statistics.serverStats.librarySize.episodes },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">
                  {value.toLocaleString()}
                </div>
                <div className="text-slate-400">{label}</div>
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
    </div>
  )
}

