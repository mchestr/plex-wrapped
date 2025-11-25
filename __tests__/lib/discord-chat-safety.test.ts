import { sanitizeDiscordResponse } from "@/lib/discord/chat-safety"

describe("sanitizeDiscordResponse", () => {
  it("redacts email addresses", () => {
    const { content, redacted } = sanitizeDiscordResponse("Contact john@example.com for help")
    expect(redacted).toBe(true)
    expect(content).toContain("[redacted]")
    expect(content).not.toContain("john@example.com")
  })

  it("redacts phone numbers", () => {
    const { content, redacted } = sanitizeDiscordResponse("Call me at 555-123-4567")
    expect(redacted).toBe(true)
    expect(content).toBe("Call me at [redacted]")
  })

  it("redacts IP addresses and trims whitespace", () => {
    const { content, redacted } = sanitizeDiscordResponse("Server IP 10.0.0.5  ")
    expect(redacted).toBe(true)
    expect(content).toBe("Server IP [redacted]")
  })

  it("returns original text when nothing was redacted", () => {
    const text = "Plex status looks good."
    const { content, redacted } = sanitizeDiscordResponse(text)
    expect(redacted).toBe(false)
    expect(content).toBe(text)
  })
})


