import { WrappedSection } from "@/types/wrapped"

/**
 * Filter and validate sections for the wrapped viewer
 */
export function filterSections(sections: WrappedSection[]): WrappedSection[] {
  return sections.filter((section: WrappedSection) => {
    // Filter out null/undefined sections
    if (!section) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WrappedViewer] Filtered out null/undefined section')
      }
      return false
    }

    // Filter out service-stats sections (these are handled separately)
    if (section.type === "service-stats") {
      return false
    }

    // Warn but don't filter out sections with missing/invalid type
    // This allows the component to attempt rendering and show an error state
    if (!section.type || typeof section.type !== 'string' || section.type.trim() === '') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[WrappedViewer] Section missing valid type:', {
          id: section.id,
          type: section.type,
          section: section,
        })
      }
      // Still include it - renderSection will handle the error gracefully
      return true
    }

    return true
  })
}

