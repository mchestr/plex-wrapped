# Maintenance UI Components

Reusable UI components for the maintenance feature system.

## Components

### ScanStatusBadge

Simple badge component for displaying scan status with color coding.

**Usage:**
```tsx
import { ScanStatusBadge } from "@/components/maintenance"

<ScanStatusBadge status="COMPLETED" />
```

**Props:**
- `status`: ScanStatus - One of "PENDING", "RUNNING", "COMPLETED", "FAILED"

**Color Coding:**
- PENDING: Yellow
- RUNNING: Blue
- COMPLETED: Green
- FAILED: Red

---

### StatsCard

Displays statistics with optional icon and trend indicator.

**Usage:**
```tsx
import { StatsCard } from "@/components/maintenance"

<StatsCard
  label="Total Candidates"
  value={42}
  variant="warning"
  icon={
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  }
  trend={{ value: 15, isPositive: false }}
/>
```

**Props:**
- `label`: string - Display label
- `value`: string | number - Main value to display
- `icon?`: ReactNode - Optional icon
- `trend?`: { value: number, isPositive: boolean } - Optional trend indicator
- `variant?`: "default" | "success" | "warning" | "danger" - Color variant (default: "default")

---

### CandidateCard

Card component for displaying deletion candidate details with approve/reject actions.

**Usage:**
```tsx
import { CandidateCard } from "@/components/maintenance"

<CandidateCard
  candidate={candidateData}
  onApprove={(id) => console.log("Approved:", id)}
  onReject={(id) => console.log("Rejected:", id)}
/>
```

**Props:**
- `candidate`: CandidateWithDetails - Candidate object with scan and rule details
- `onApprove`: (candidateId: string) => void - Callback when approve button is clicked
- `onReject`: (candidateId: string) => void - Callback when reject button is clicked

**Features:**
- Displays poster image or placeholder
- Shows title, year, and media type
- Grid layout for stats (file size, play count, last watched, added date)
- File path display
- Approve/Reject action buttons

---

### RuleCriteriaBuilder

Interactive form component for building and editing rule criteria.

**Usage:**
```tsx
import { RuleCriteriaBuilder } from "@/components/maintenance"
import { useState } from "react"

const [criteria, setCriteria] = useState<RuleCriteria>({
  operator: "AND",
})

<RuleCriteriaBuilder
  value={criteria}
  onChange={setCriteria}
  libraryOptions={[
    { id: "1", name: "Movies" },
    { id: "2", name: "TV Shows" },
  ]}
/>
```

**Props:**
- `value`: RuleCriteria - Current criteria object
- `onChange`: (criteria: RuleCriteria) => void - Callback when criteria changes
- `libraryOptions?`: Array<{ id: string, name: string }> - Available library options

**Supported Criteria:**
- `neverWatched`: boolean - Match items never watched
- `lastWatchedBefore`: { value: number, unit: "days" | "months" | "years" } - Last watched timeframe
- `maxPlayCount`: number - Maximum play count
- `addedBefore`: { value: number, unit: "days" | "months" | "years" } - Added timeframe
- `minFileSize`: { value: number, unit: "MB" | "GB" | "TB" } - Minimum file size
- `maxQuality`: string - Maximum quality (e.g., "720p", "SD")
- `maxRating`: number - Maximum rating (0-10)
- `libraryIds`: string[] - Specific library IDs
- `operator`: "AND" | "OR" - Criteria matching operator

**Features:**
- AND/OR operator toggle
- Basic criteria (always visible)
- Advanced criteria (collapsible)
- Clear buttons for optional fields
- Library multi-select
- Time unit dropdowns (days/months/years)
- File size unit dropdowns (MB/GB/TB)

## Example: Complete Usage

```tsx
"use client"

import { useState } from "react"
import {
  ScanStatusBadge,
  StatsCard,
  CandidateCard,
  RuleCriteriaBuilder,
} from "@/components/maintenance"
import type { RuleCriteria } from "@/types/maintenance"

export function MaintenanceDashboard() {
  const [criteria, setCriteria] = useState<RuleCriteria>({
    operator: "AND",
  })

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard label="Total Rules" value={5} variant="default" />
        <StatsCard label="Pending Candidates" value={23} variant="warning" />
        <StatsCard label="Last Scan" value={<ScanStatusBadge status="COMPLETED" />} />
      </div>

      {/* Rule Builder */}
      <div className="bg-slate-800/30 p-6 rounded-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Create Rule</h2>
        <RuleCriteriaBuilder
          value={criteria}
          onChange={setCriteria}
          libraryOptions={[
            { id: "1", name: "Movies" },
            { id: "2", name: "TV Shows" },
          ]}
        />
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Review Candidates</h2>
        {/* Map over candidates */}
      </div>
    </div>
  )
}
```

## Styling

All components follow the project's dark theme design system:
- Background: slate-800/slate-900 tones
- Borders: slate-700/slate-600
- Text: white/slate-200/slate-400
- Accent colors: cyan for primary, red for danger, green for success, yellow for warning
- Hover states and transitions included
- Responsive design with mobile-first approach
