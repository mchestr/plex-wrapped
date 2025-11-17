interface UserStatusBadgeProps {
  status: string | null
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  if (!status) {
    return (
      <span className="px-1.5 py-0.5 bg-slate-700/50 text-slate-300 text-xs font-medium rounded">
        Not Generated
      </span>
    )
  }

  switch (status) {
    case "completed":
      return (
        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded">
          Completed
        </span>
      )
    case "generating":
      return (
        <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
          Generating
        </span>
      )
    case "failed":
      return (
        <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded">
          Failed
        </span>
      )
    case "pending":
      return (
        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
          Pending
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

