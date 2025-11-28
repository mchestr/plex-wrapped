import type { ScanStatus } from "@/lib/validations/maintenance"

interface ScanStatusBadgeProps {
  status: ScanStatus
}

export function ScanStatusBadge({ status }: ScanStatusBadgeProps) {
  switch (status) {
    case "PENDING":
      return (
        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
          Pending
        </span>
      )
    case "RUNNING":
      return (
        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
          Running
        </span>
      )
    case "COMPLETED":
      return (
        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
          Completed
        </span>
      )
    case "FAILED":
      return (
        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
          Failed
        </span>
      )
    default:
      return (
        <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-medium rounded">
          Unknown
        </span>
      )
  }
}
