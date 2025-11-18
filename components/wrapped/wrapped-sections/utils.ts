export function formatWatchTime(minutes: number): string {
  if (!minutes || minutes === 0) return "0 minutes"
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  const remainingMinutes = minutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`)
  if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? "s" : ""}`)
  if (remainingMinutes > 0 && days === 0) {
    parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`)
  }

  return parts.join(", ") || "0 minutes"
}

