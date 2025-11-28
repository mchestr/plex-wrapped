import { ReactNode } from "react"

interface StatsCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: "default" | "success" | "warning" | "danger"
}

const variantClasses = {
  default: "bg-slate-800/50 border-slate-700",
  success: "bg-green-500/10 border-green-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  danger: "bg-red-500/10 border-red-500/30",
}

const iconColorClasses = {
  default: "text-cyan-400",
  success: "text-green-400",
  warning: "text-yellow-400",
  danger: "text-red-400",
}

export function StatsCard({ label, value, icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <svg
                className={`w-4 h-4 ${trend.isPositive ? "text-green-400" : "text-red-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {trend.isPositive ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"
                  />
                )}
              </svg>
              <span className={`text-xs ${trend.isPositive ? "text-green-400" : "text-red-400"}`}>
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${iconColorClasses[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
