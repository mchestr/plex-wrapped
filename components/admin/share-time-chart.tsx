"use client"

import { ShareTimeSeriesData } from "@/actions/share-analytics"

interface ShareTimeChartProps {
  data: ShareTimeSeriesData[]
  height?: number
}

export function ShareTimeChart({ data, height = 200 }: ShareTimeChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        No data available
      </div>
    )
  }

  const maxShares = Math.max(...data.map((d) => d.shares), 1)
  const maxVisits = Math.max(...data.map((d) => d.visits), 1)
  const maxValue = Math.max(maxShares, maxVisits)

  const chartHeight = height - 60 // Leave room for labels
  const barWidth = Math.max(2, (100 / data.length) * 0.8)

  return (
    <div className="w-full">
      <div className="flex items-end gap-0.5" style={{ height: chartHeight }}>
        {data.map((point, index) => {
          const shareHeight = (point.shares / maxValue) * 100
          const visitHeight = (point.visits / maxValue) * 100

          return (
            <div
              key={point.date}
              className="flex flex-col items-center gap-0.5 flex-1 group relative"
              style={{ minWidth: `${barWidth}%` }}
            >
              <div className="flex flex-col-reverse gap-0.5 w-full items-center">
                {/* Visits bar */}
                {point.visits > 0 && (
                  <div
                    className="bg-green-500 w-full rounded-t transition-all hover:bg-green-400"
                    style={{
                      height: `${visitHeight}%`,
                      minHeight: point.visits > 0 ? "2px" : "0",
                    }}
                    title={`${point.date}: ${point.visits} visits`}
                  />
                )}
                {/* Shares bar */}
                {point.shares > 0 && (
                  <div
                    className="bg-cyan-500 w-full rounded-t transition-all hover:bg-cyan-400"
                    style={{
                      height: `${shareHeight}%`,
                      minHeight: point.shares > 0 ? "2px" : "0",
                    }}
                    title={`${point.date}: ${point.shares} shares`}
                  />
                )}
              </div>
              {/* Date label (show every Nth date) */}
              {index % Math.ceil(data.length / 7) === 0 && (
                <div className="text-[10px] text-slate-500 mt-1 transform -rotate-45 origin-left whitespace-nowrap">
                  {new Date(point.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded" />
          <span>Shares</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Visits</span>
        </div>
      </div>
    </div>
  )
}

