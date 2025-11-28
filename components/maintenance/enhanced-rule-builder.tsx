"use client"

/**
 * Enhanced Hierarchical Rule Builder
 *
 * Powerful, intuitive UI for building complex maintenance rules with nested AND/OR groups.
 * Supports all field types from Plex, Tautulli, Radarr, and Sonarr.
 */

import type { RuleCriteria, MediaType } from "@/lib/validations/maintenance"
import { getFieldsForMediaType, generateId } from "@/lib/maintenance/field-registry"
import { calculateComplexity } from "@/lib/maintenance/rule-evaluator"
import { ConditionGroupBuilder } from "./condition-group-builder"
import { RuleComplexityIndicator } from "./rule-complexity-indicator"

interface EnhancedRuleBuilderProps {
  value: RuleCriteria
  onChange: (criteria: RuleCriteria) => void
  mediaType: MediaType
}

export function EnhancedRuleBuilder({ value, onChange, mediaType }: EnhancedRuleBuilderProps) {
  const availableFields = getFieldsForMediaType(mediaType)
  const complexity = calculateComplexity(value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Rule Criteria</h3>
          <p className="text-sm text-slate-400 mt-1">
            Define conditions that media must match. Combine conditions with AND/OR groups for complex logic.
          </p>
        </div>
      </div>

      {/* Rule Tree */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
        <ConditionGroupBuilder
          group={value}
          onChange={onChange}
          availableFields={availableFields}
          depth={0}
          mediaType={mediaType}
        />
      </div>

      {/* Complexity Indicator */}
      <RuleComplexityIndicator complexity={complexity} />

      {/* Help Text */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-2">How to use</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Click <span className="text-cyan-400 font-medium">+ Add Condition</span> to add a new field comparison</li>
          <li>• Click <span className="text-purple-400 font-medium">+ Add Group</span> to create a nested AND/OR group</li>
          <li>• Use the <span className="font-medium">AND/OR</span> toggle to change how conditions are combined</li>
          <li>• <span className="font-medium">AND</span> = all conditions must match</li>
          <li>• <span className="font-medium">OR</span> = any condition can match</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Create a default empty rule criteria
 */
export function createDefaultCriteria(mediaType: MediaType): RuleCriteria {
  const availableFields = getFieldsForMediaType(mediaType)
  const firstField = availableFields[0]

  return {
    type: 'group',
    id: generateId(),
    operator: 'AND',
    conditions: [
      {
        type: 'condition',
        id: generateId(),
        field: firstField.key,
        operator: firstField.allowedOperators[0],
        value: null,
      }
    ],
  }
}
