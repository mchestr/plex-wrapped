const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const PHONE_REGEX = /(?<!\d)(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\d)/g
const IP_REGEX = /\b\d{1,3}(?:\.\d{1,3}){3}\b/g
const ID_REGEX = /\b(?:plex\s*(?:user)?\s*id|user\s*id|account\s*id)\s*[:#-]?\s*[A-Za-z0-9_-]+\b/gi

const REDACT_PLACEHOLDER = "[redacted]"

function stripExcessWhitespace(value: string) {
  return value.replace(/\s{2,}/g, " ").replace(/\s+\n/g, "\n").trim()
}

export function sanitizeDiscordResponse(content: string) {
  if (!content) {
    return { content: "", redacted: false }
  }

  let sanitized = content
  let redacted = false

  const patterns = [EMAIL_REGEX, PHONE_REGEX, IP_REGEX, ID_REGEX]
  for (const pattern of patterns) {
    if (pattern.test(sanitized)) {
      redacted = true
      sanitized = sanitized.replace(pattern, REDACT_PLACEHOLDER)
    }
    pattern.lastIndex = 0
  }

  sanitized = stripExcessWhitespace(sanitized)

  return { content: sanitized, redacted }
}


