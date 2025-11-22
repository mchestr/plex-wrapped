
export interface LlmUsageStats {
  totalTokens: number
  promptTokens: number
  completionTokens: number
  cost: number
  provider: string | null
  model: string | null
  count: number
}

export interface ShareStats {
  totalShares: number
  totalVisits: number
}

export interface AdminUserWithWrappedStats {
  id: string
  name: string | null
  email: string | null
  image: string | null
  plexUserId: string | null
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
  wrappedStatus: string | null
  wrappedGeneratedAt: Date | null
  totalWrappedCount: number
  totalShares: number
  totalVisits: number
  hasPlexAccess: boolean | null
  llmUsage: LlmUsageStats | null
  totalLlmUsage: LlmUsageStats | null
}

export interface WrappedSummary {
  id: string
  year: number
  status: string
  generatedAt: Date | null
  createdAt: Date
  shareToken: string | null
  shareVisits: number
}

export interface UserDetails {
  id: string
  name: string | null
  email: string | null
  image: string | null
  plexUserId: string | null
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
  hasPlexAccess: boolean | null
  wrapped: WrappedSummary[]
  totalShares: number
  totalVisits: number
  llmUsage: LlmUsageStats | null
}

export interface UserQueryOptions {
  year?: number
}
