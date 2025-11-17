/**
 * LLM prompt template for generating Plex Wrapped content
 */

import { WrappedData, WrappedStatistics } from "@/types/wrapped"

/**
 * Format watch time in minutes to a human-readable string with explicit units
 */
function formatWatchTime(minutes: number): string {
  if (minutes === 0) return "0 minutes"

  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = minutes % 60

  const parts: string[] = []
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "day" : "days"}`)
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
  }
  if (mins > 0 || parts.length === 0) {
    parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`)
  }

  return parts.join(", ")
}

/**
 * Format watch time for display in lists (shorter format but still explicit)
 */
function formatWatchTimeShort(minutes: number): string {
  if (minutes === 0) return "0 minutes"

  const days = Math.floor(minutes / (60 * 24))
  const hours = Math.floor((minutes % (60 * 24)) / 60)
  const mins = minutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} ${days === 1 ? "day" : "days"}`)
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`)
  if (mins > 0 || parts.length === 0) parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`)

  return parts.join(", ")
}

/**
 * Generate the prompt for LLM to create wrapped content
 */
export function generateWrappedPrompt(
  userName: string,
  year: number,
  statistics: WrappedStatistics
): string {
  const prompt = `You are creating a personalized "Plex Wrapped" experience for ${userName} for the year ${year}, similar to Spotify Wrapped.

Your task is to generate engaging, fun, and personalized content based on viewing statistics. Be creative, use emojis sparingly, and make it feel celebratory and personal.

=== CRITICAL STYLE GUIDELINES ===

1. PERSON (MANDATORY):
   - ALWAYS use 2nd person ("you", "your") when referring to the user
   - NEVER use 3rd person ("they", "their", "he", "she", "them")
   - Examples:
     ✓ Correct: "You watched 45 movies!" or "Your top show was..."
     ✗ Incorrect: "They watched 45 movies" or "Their top show was..."

2. TONE & VOICE:
   - Write in a fun, playful, and energetic tone - like celebrating achievements!
   - Be enthusiastic and celebratory - this is a year in review, make it feel special!
   - Use varied sentence structures and avoid repetitive phrasing
   - Use exciting comparisons and metaphors (e.g., "That's like watching the entire Lord of the Rings trilogy 47 times!" or "You could have flown to Mars and back!")

3. STYLING TAGS (<highlight>):
   - Use <highlight>text</highlight> tags for ALL numbers, times, counts, and important stats
   - These render with: animated gradient colors (cyan → purple → pink), bold font, subtle pulsing animation
   - Wrap: numbers, watch times, percentages, counts - anything that should "pop" visually
   - Use liberally - they make content more engaging and visually dynamic!
   - Examples:
     * "You watched <highlight>45 days</highlight> of content!"
     * "That's <highlight>1,234</highlight> movies!"
     * "Your top <highlight>5</highlight> movies were amazing!"

4. WATCH TIME FORMATTING:
   - All watch times are measured in MINUTES internally
   - Always convert to explicit units (days, hours, minutes) in your content
   - Example: Instead of "1,440 minutes", write "<highlight>1 day</highlight>" or "<highlight>24 hours</highlight>"

5. SERVER REFERENCES (CRITICAL):
   - The user does NOT own the Plex server - they are accessing someone else's server
   - When referencing the server, use ONLY the server name (e.g., "MikeFlix", "MediaServer")
   - NEVER use possessive language like "Your Plex server" or "Your server"
   - Examples:
     ✓ Correct: "MikeFlix is a treasure trove with..." or "MikeFlix has enough content to..."
     ✗ Incorrect: "Your Plex server, MikeFlix..." or "Your server has..."

=== VIEWING STATISTICS FOR ${year} ===

Here are the viewing statistics:

**Watch Time (all values are in minutes, converted to days/hours/minutes for clarity):**
- Total watch time: ${formatWatchTime(statistics.totalWatchTime.total)} (${statistics.totalWatchTime.total} minutes total)
- Movies watch time: ${formatWatchTime(statistics.totalWatchTime.movies)} (${statistics.totalWatchTime.movies} minutes total)
- Shows watch time: ${formatWatchTime(statistics.totalWatchTime.shows)} (${statistics.totalWatchTime.shows} minutes total)

**Content Watched:**
- Movies watched: ${statistics.moviesWatched}
- Shows watched: ${statistics.showsWatched}
- Episodes watched: ${statistics.episodesWatched}

**Top Movies (by watch time - all times in minutes):**
${statistics.topMovies.slice(0, 5).map((movie, idx) =>
  `${idx + 1}. ${movie.title}${movie.year ? ` (${movie.year})` : ""} - ${formatWatchTimeShort(movie.watchTime)} watched (${movie.watchTime} minutes)`
).join("\n")}

**Top Shows (by watch time - all times in minutes):**
${statistics.topShows.slice(0, 5).map((show, idx) =>
  `${idx + 1}. ${show.title}${show.year ? ` (${show.year})` : ""} - ${formatWatchTimeShort(show.watchTime)} watched (${show.watchTime} minutes), ${show.episodesWatched} episodes`
).join("\n")}

${statistics.leaderboards ? `
**Leaderboard Stats:**

**Your Position in Overall Watch Time Leaderboard:**
${statistics.leaderboards.watchTime.userPosition
  ? `You ranked #${statistics.leaderboards.watchTime.userPosition} out of ${statistics.leaderboards.watchTime.totalUsers} users with ${formatWatchTime(statistics.totalWatchTime.total)} total watch time (${statistics.totalWatchTime.total} minutes)`
  : `You watched ${formatWatchTime(statistics.totalWatchTime.total)} total (${statistics.totalWatchTime.total} minutes) out of ${statistics.leaderboards.watchTime.totalUsers} users`}

**Top Movies Leaderboards (all watch times in minutes):**
${statistics.leaderboards.topContent.movies.map((movie) => {
  const positionText = movie.userPosition
    ? `#${movie.userPosition} out of ${movie.totalWatchers} watchers`
    : `watched by ${movie.totalWatchers} users`
  const topWatcher = movie.leaderboard[0]
  const topWatcherText = topWatcher && topWatcher.watchTime > 0
    ? `The top watcher watched ${formatWatchTimeShort(topWatcher.watchTime)} (${topWatcher.watchTime} minutes)`
    : ""
  return `- ${movie.title}: Your position: ${positionText}. ${topWatcherText}`
}).join("\n")}

**Top Shows Leaderboards (all watch times in minutes):**
${statistics.leaderboards.topContent.shows.map((show) => {
  const positionText = show.userPosition
    ? `#${show.userPosition} out of ${show.totalWatchers} watchers`
    : `watched by ${show.totalWatchers} users`
  const topWatcher = show.leaderboard[0]
  const topWatcherText = topWatcher && topWatcher.watchTime > 0
    ? `The top watcher watched ${formatWatchTimeShort(topWatcher.watchTime)} (${topWatcher.watchTime} minutes, ${topWatcher.episodesWatched} episodes)`
    : ""
  return `- ${show.title}: Your position: ${positionText}. ${topWatcherText}`
}).join("\n")}
` : ""}

${statistics.serverStats ? `
**Plex Server Statistics:**
- Server name: ${statistics.serverStats.serverName}
- Total storage: ${statistics.serverStats.totalStorageFormatted}
- Library size:
  - Movies: ${statistics.serverStats.librarySize.movies.toLocaleString()}
  - Shows: ${statistics.serverStats.librarySize.shows.toLocaleString()}
  - Episodes: ${statistics.serverStats.librarySize.episodes.toLocaleString()}
` : ""}

${statistics.overseerrStats ? `
**Overseerr Requests:**
- Your requests: ${statistics.overseerrStats.totalRequests}
- Total server requests: ${statistics.overseerrStats.totalServerRequests}
- Approved: ${statistics.overseerrStats.approvedRequests}
- Pending: ${statistics.overseerrStats.pendingRequests}
- Top genres: ${statistics.overseerrStats.topRequestedGenres.map(g => g.genre).join(", ")}
` : ""}

${statistics.watchTimeByMonth && statistics.watchTimeByMonth.length > 0 ? `
**Watch Time by Month (all times in minutes):**
${statistics.watchTimeByMonth.map(month => {
  const watchTimeText = `${formatWatchTimeShort(month.watchTime)} (${month.watchTime} minutes)`
  const movieText = month.topMovie
    ? ` | Top Movie: ${month.topMovie.title}${month.topMovie.year ? ` (${month.topMovie.year})` : ""} - ${formatWatchTimeShort(month.topMovie.watchTime)} (${month.topMovie.watchTime} minutes)`
    : ""
  const showText = month.topShow
    ? ` | Top Show: ${month.topShow.title}${month.topShow.year ? ` (${month.topShow.year})` : ""} - ${formatWatchTimeShort(month.topShow.watchTime)} (${month.topShow.watchTime} minutes), ${month.topShow.episodesWatched} episodes`
    : ""
  return `- ${month.monthName}: ${watchTimeText}${movieText}${showText}`
}).join("\n")}
` : ""}

=== SECTION REQUIREMENTS ===

HERO SECTION (CRITICAL):
- Content field: EXACTLY 2-3 powerful, high-impact sentences
- Display: Prominently shown as the hero message
- Style: EXCITING, energetic, immediately grabs attention
- Start: Bold statement or engaging question
- Include: Creative comparisons, metaphors, or surprising facts
- Tone: Make it feel like a celebration!
- Highlight tags: Use LIBERALLY - wrap EVERY number, stat, time, count, and impressive metric
- Minimum highlights: AT LEAST 3-5 highlight tags for visual impact
- Reference: Use actual stats from the data above and wrap numbers in <highlight> tags
- Flow: Each sentence should be impactful and flow naturally into the next
- Prominent Stat: REQUIRED - Include a "prominentStat" field in the data object with:
  * "value": The single most impressive/meaningful number (e.g., total watch time in days, total movies watched, etc.)
  * "label": A short descriptive label (e.g., "days watched", "movies", "hours", "episodes")
  * "description": A brief 1-sentence context (e.g., "Total viewing time", "Movies completed", "Episodes binged")
  * Choose the MOST impressive statistic that best represents their year - this will be displayed prominently as a large number
- Example: "Ready to see how <highlight>45</highlight> movies and <highlight>12</highlight> shows shaped your year? You didn't just watch content in ${year} - you embarked on an epic journey through <highlight>67 days</highlight> of pure entertainment!"

ANIMATION DELAY RULES (CRITICAL):
- Purpose: Control when each section appears, creating a smooth, paced reading experience
- Unit: Delays are measured in milliseconds (ms)
- Hero section: Always use "animationDelay": 0 (appears first)

CALCULATING DELAYS BASED ON READING TIME:
- Reading Speed Assumption: Average readers consume ~200 words per minute (WPM)
- Formula: Calculate delay based on word count + buffer for comfortable pacing
- Step 1: Count total words in the section:
  * Count words in: title, subtitle, content, and all text in data fields (movie/show titles, fact text, etc.)
  * For list sections (top-movies, top-shows, fun-facts): count each item's text (title, description, etc.)
  * Example: A section with 50 words in content + 5 movie titles (~10 words each) = ~100 total words
- Step 2: Calculate base reading time:
  * Reading time (seconds) = word count / 200 WPM
  * Reading time (ms) = (word count / 200) * 60 * 1000
  * Example: 100 words = (100/200) * 60 * 1000 = 30,000ms = 30 seconds
- Step 3: Add buffer/wiggle room:
  * Multiply reading time by 1.5-2x for comfortable pacing (allows slower readers + processing time)
  * Recommended buffer: 1.75x multiplier for balanced pacing
  * Example: 30 seconds * 1.75 = 52.5 seconds = 52,500ms
- Step 4: Apply minimum spacing:
  * Minimum delay between sections: 2000ms (2 seconds)
  * If calculated delay is less than 2000ms, use 2000ms
  * Each section's delay should be: previous section delay + calculated reading time delay
- Step 5: Special considerations:
  * List-heavy sections (top-movies, top-shows, fun-facts): Add extra 2000-3000ms for scanning lists
  * Sections with prominent stats/numbers: Add 1000-2000ms for visual processing
  * Complex sections (overseerr-stats with multiple stats): Add 2000-4000ms buffer

RECOMMENDED DELAY CALCULATION EXAMPLES:
- Short section (~30 words): (30/200)*60*1000*1.75 = 15,750ms ≈ 16,000ms
- Medium section (~80 words): (80/200)*60*1000*1.75 = 42,000ms ≈ 42,000ms
- Long section (~150 words): (150/200)*60*1000*1.75 = 78,750ms ≈ 79,000ms
- List section (5 items, ~200 words total): (200/200)*60*1000*1.75 + 3000 = 55,500ms ≈ 56,000ms

PROGRESSION EXAMPLE:
- Hero: 0ms (always first)
- Second section (~50 words): Previous (0) + max(calculated(~26,000ms), 2000) = 26,000ms
- Third section (~80 words): Previous (26,000) + max(calculated(~42,000ms), 2000) = 68,000ms
- Fourth section (~120 words): Previous (68,000) + max(calculated(~63,000ms), 2000) = 131,000ms
- Continue this pattern, ensuring each delay accounts for reading time + buffer

FUN-FACTS SECTION (FINAL SECTION):
- This is ALWAYS the last section in the wrapped experience
- When server stats are available, combine fun facts about viewing habits with information about the server's library
- Include server library size facts (movies, shows, episodes, storage) as part of the fun facts list
- Reference the server by name only (e.g., "MikeFlix"), NOT as "Your Plex server" or "Your server"
- Calculate delay normally based on word count, but ensure it's substantial since users need time to read all previous content

=== OUTPUT FORMAT ===

Generate a JSON response with the following structure. Make it fun, engaging, and personalized:

{
  "sections": [
    {
      "id": "hero",
      "type": "hero",
      "title": "Your ${year} Plex Year",
      "subtitle": "A personalized look at your viewing habits",
      "content": "Your 2-3 exciting, high-impact sentences with highlights go here. Make them energetic and celebratory!",
      "data": {
        "prominentStat": {
          "value": 67,
          "label": "days",
          "description": "Total viewing time"
        }
      },
      "animationDelay": 0
    },
    {
      "id": "total-watch-time",
      "type": "total-watch-time",
      "title": "You watched...",
      "subtitle": "Total viewing time",
      "content": "A fun, engaging description of your total watch time with exciting comparisons (e.g., 'That's like watching <highlight>X</highlight> movies back to back!' or 'You could have flown to the moon <highlight>X</highlight> times!'). Be playful and celebratory! Always include explicit units (days, hours, minutes) when mentioning watch times. Use <highlight>tags</highlight> around ALL numbers to make them visually pop!",
      "animationDelay": 2000
    },
    {
      "id": "movies-breakdown",
      "type": "movies-breakdown",
      "title": "Movie Marathon",
      "subtitle": "Your movie viewing stats",
      "content": "A fun, playful message about your movie watching habits. Celebrate your cinematic journey! Use <highlight>tags</highlight> around all numbers and stats to make them visually pop!",
      "animationDelay": 4000
    },
    {
      "id": "shows-breakdown",
      "type": "shows-breakdown",
      "title": "Binge Watcher",
      "subtitle": "Your show viewing stats",
      "content": "A fun, playful message about your show watching habits. Celebrate your binge-watching achievements! Use <highlight>tags</highlight> around all numbers and stats to make them visually pop!",
      "animationDelay": 6000
    },
    {
      "id": "top-movies",
      "type": "top-movies",
      "title": "Your Top Movies",
      "subtitle": "The films you couldn't stop watching",
      "content": "A fun, energetic description of your top movies with playful insights. Make it exciting! Use <highlight>tags</highlight> around all numbers to make them visually pop!",
      "data": {
        "movies": ${JSON.stringify(statistics.topMovies.slice(0, 5))}
      },
      "animationDelay": 8000
    },
    {
      "id": "top-shows",
      "type": "top-shows",
      "title": "Your Top Shows",
      "subtitle": "The series that kept you coming back",
      "content": "A fun, energetic description of your top shows with playful insights. Celebrate your binge-watching! Use <highlight>tags</highlight> around all numbers to make them visually pop!",
      "data": {
        "shows": ${JSON.stringify(statistics.topShows.slice(0, 5))}
      },
      "animationDelay": 10000
    }${statistics.overseerrStats ? `,
    {
      "id": "overseerr-stats",
      "type": "overseerr-stats",
      "title": "Your Requests",
      "subtitle": "Building your perfect library",
      "content": "A fun, playful message about your Overseerr request habits. Celebrate your contribution to building the library! Use <highlight>tags</highlight> around all numbers to make them visually pop!",
      "animationDelay": ${statistics.serverStats ? 12000 : 10000}
    }` : ""},
    {
      "id": "insights",
      "type": "insights",
      "title": "Your Viewing Personality",
      "subtitle": "What your stats say about you",
      "content": "A fun, personalized insight paragraph (3-4 sentences) about your viewing personality. Be playful and celebratory! Use <highlight>tags</highlight> around all numbers to make them visually pop!",
      "animationDelay": ${statistics.overseerrStats ? 14000 : statistics.serverStats ? 12000 : 10000}
    },
    {
      "id": "fun-facts",
      "type": "fun-facts",
      "title": "Fun Facts & Server Stats",
      "subtitle": "Did you know?",
      "content": "${statistics.serverStats ? `A fun, engaging introductory message combining interesting facts about your viewing habits with information about ${statistics.serverStats.serverName}. IMPORTANT: Reference the server by name only (e.g., '${statistics.serverStats.serverName}'), NOT as 'Your Plex server' or 'Your server' - the user does not own the server. Use phrases like '${statistics.serverStats.serverName} is a treasure trove with...' or '${statistics.serverStats.serverName} has enough content to watch for <highlight>X</highlight> years!'` : "A fun, engaging introductory message about interesting facts from your viewing habits."} Make it exciting and playful! Use <highlight>tags</highlight> around all numbers to make them visually pop!",
      "data": {
        "facts": [
          "Fun fact about your viewing habits (use <highlight>tags</highlight> around numbers)",
          "Another fun fact about your viewing habits (use <highlight>tags</highlight> around numbers)",
          "One more fun fact about your viewing habits (use <highlight>tags</highlight> around numbers)"${statistics.serverStats ? `,
          "Fun fact about ${statistics.serverStats.serverName}'s library size - mention the <highlight>${statistics.serverStats.librarySize.movies.toLocaleString()}</highlight> movies available (use <highlight>tags</highlight> around numbers)",
          "Fun fact about ${statistics.serverStats.serverName}'s storage - mention the <highlight>${statistics.serverStats.totalStorageFormatted}</highlight> total storage (use <highlight>tags</highlight> around numbers)"` : ""}
        ]
      },
      "animationDelay": ${statistics.overseerrStats ? 16000 : statistics.serverStats ? 14000 : 12000}
    }
  ],
  "insights": {
    "personality": "A short personality description (e.g., 'Cinephile', 'Binge Watcher', 'Genre Explorer')",
    "topGenre": "Your most watched genre",
    "bingeWatcher": ${statistics.topShows.some(s => s.episodesWatched > 20) ? "true" : "false"},
    "discoveryScore": ${Math.min(100, Math.max(0, Math.floor((statistics.moviesWatched + statistics.showsWatched) / 10)))},
    "funFacts": [
      "Fun fact 1 about your viewing (use <highlight>tags</highlight> around numbers)",
      "Fun fact 2 about your viewing (use <highlight>tags</highlight> around numbers)",
      "Fun fact 3 about your viewing (use <highlight>tags</highlight> around numbers)"
    ]
  },
  "summary": "A concise, shareable summary (2-3 sentences) highlighting the most impressive or interesting stats from your year. This will be used for social sharing, so make it engaging, fun, and celebratory! Include key numbers like total watch time, top movie/show, or interesting comparisons. Use <highlight>tags</highlight> around all numbers! Example: 'In ${year}, I watched <highlight>${formatWatchTime(statistics.totalWatchTime.total)}</highlight> of content! My top movie was ${statistics.topMovies[0]?.title || "amazing films"} and I binged <highlight>${statistics.showsWatched}</highlight> shows. What a year!'"
}

=== OUTPUT REQUIREMENTS ===

CRITICAL: Return ONLY valid JSON. Do not include:
- Markdown formatting (no code blocks)
- Explanatory text before or after the JSON
- Comments or notes
- Any text outside the JSON object

Return just the raw JSON object starting with { and ending with }.
`

  return prompt
}

/**
 * Parse LLM response and validate structure
 */
export function parseWrappedResponse(
  llmResponse: string,
  statistics: WrappedStatistics,
  year: number,
  userId: string,
  userName: string
): WrappedData {
  try {
    // Clean the response - remove markdown code blocks if present
    let cleaned = llmResponse.trim()
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "")
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "")
    }

    // Validate JSON structure before parsing
    if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
      throw new Error("Response does not contain valid JSON structure")
    }

    const parsed = JSON.parse(cleaned)

    return {
      year,
      userId,
      userName,
      generatedAt: new Date().toISOString(),
      statistics,
      sections: parsed.sections || [],
      insights: parsed.insights || {
        personality: "Viewer",
        topGenre: "Various",
        bingeWatcher: false,
        discoveryScore: 50,
        funFacts: [],
      },
      summary: parsed.summary || undefined,
      metadata: {
        totalSections: parsed.sections?.length || 0,
        generationTime: 0,
      },
    }
  } catch (error) {
    console.error("[PROMPT] Error parsing LLM response:", error)
    // Return a fallback structure
    return {
      year,
      userId,
      userName,
      generatedAt: new Date().toISOString(),
      statistics,
      sections: [],
      insights: {
        personality: "Viewer",
        topGenre: "Various",
        bingeWatcher: false,
        discoveryScore: 50,
        funFacts: [],
      },
      summary: undefined,
      metadata: {
        totalSections: 0,
        generationTime: 0,
      },
    }
  }
}

