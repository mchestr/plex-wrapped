"use client"

/**
 * Rule Complexity Indicator
 *
 * Displays metrics about rule complexity and provides warnings for overly complex rules.
 */

interface RuleComplexityIndicatorProps {
  complexity: {
    conditionCount: number
    groupCount: number
    maxDepth: number
    complexity: 'simple' | 'moderate' | 'complex'
  }
}

export function RuleComplexityIndicator({ complexity }: RuleComplexityIndicatorProps) {
  const { conditionCount, groupCount, maxDepth, complexity: level } = complexity

  const getComplexityColor = () => {
    switch (level) {
      case 'simple':
        return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'moderate':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'complex':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
    }
  }

  const getComplexityLabel = () => {
    switch (level) {
      case 'simple':
        return 'Simple Rule'
      case 'moderate':
        return 'Moderate Complexity'
      case 'complex':
        return 'Complex Rule'
    }
  }

  const getComplexityMessage = () => {
    switch (level) {
      case 'simple':
        return 'This rule is straightforward and will evaluate quickly.'
      case 'moderate':
        return 'This rule has some complexity. Consider testing it with a small set first.'
      case 'complex':
        return 'This rule is very complex. It may be slower to evaluate and harder to debug. Consider simplifying if possible.'
    }
  }

  return (
    <div className="space-y-3">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Conditions"
          value={conditionCount}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <MetricCard
          label="Groups"
          value={groupCount}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <MetricCard
          label="Max Depth"
          value={maxDepth}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          }
        />
      </div>

      {/* Complexity Badge */}
      <div className={`border rounded-lg p-4 ${getComplexityColor()}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {level === 'simple' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {level === 'moderate' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {level === 'complex' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm mb-1">{getComplexityLabel()}</div>
            <div className="text-xs opacity-90">{getComplexityMessage()}</div>
          </div>
        </div>
      </div>

      {/* Performance Warning for Very Deep Nesting */}
      {maxDepth > 3 && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 text-red-400">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">Very Deep Nesting Detected</div>
              <div className="text-xs opacity-90">
                Rules with {maxDepth} levels of nesting may be difficult to understand and maintain.
                Consider restructuring into multiple simpler rules.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <div className="text-xs font-medium">{label}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}
