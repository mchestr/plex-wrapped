import { type ChatTool } from "@/lib/llm/chat"

export const TOOLS: ChatTool[] = [
  {
    type: "function",
    function: {
      name: "get_plex_status",
      description: "Get the current status and machine identifier of the Plex Media Server",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_plex_sessions",
      description: "Get current active viewing sessions on Plex (who is watching what)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_status",
      description: "Get Tautulli server version and current stream count",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_activity",
      description: "Get detailed activity and bandwidth usage from Tautulli",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_status",
      description: "Get Overseerr server version and total requests count",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_requests",
      description: "Get recent pending or processing media requests from Overseerr",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_status",
      description: "Get Sonarr server version, queue size, health warnings, and disk space",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_status",
      description: "Get Radarr server version, queue size, health warnings, and disk space",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_sonarr_series",
      description: "Search for a TV series in Sonarr to check if it exists or get its metadata. Returns results with 'sonarrId' field if the series is already in the library (use this ID for episode queries and history).",
      parameters: {
        type: "object",
        properties: {
          term: {
            type: "string",
            description: "The name of the series to search for",
          },
        },
        required: ["term"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_history",
      description: "Get recent history from Sonarr to check for download issues or successes. Can filter by series name, series ID, or episode ID. IMPORTANT: Use seriesId or episodeId from search_sonarr_series or get_sonarr_episodes results for accurate filtering.",
      parameters: {
        type: "object",
        properties: {
          pageSize: {
            type: "integer",
            description: "Number of history items to retrieve (default 20)",
          },
          seriesName: {
            type: "string",
            description: "Filter history by series name (will search for series first)",
          },
          seriesId: {
            type: "integer",
            description: "Filter history by series ID (preferred - use sonarrId from search_sonarr_series results)",
          },
          episodeId: {
            type: "integer",
            description: "Filter history by episode ID (use id from get_sonarr_episodes results)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_radarr_movies",
      description: "Search for a movie in Radarr to check if it exists or get its metadata. Returns results with 'radarrId' field if the movie is already in the library (use this ID for history queries).",
      parameters: {
        type: "object",
        properties: {
          term: {
            type: "string",
            description: "The name of the movie to search for",
          },
        },
        required: ["term"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_history",
      description: "Get recent history from Radarr to check for download issues or successes. Can filter by movie name or movie ID. IMPORTANT: Use movieId from search_radarr_movies results (radarrId field) for accurate filtering.",
      parameters: {
        type: "object",
        properties: {
          pageSize: {
            type: "integer",
            description: "Number of history items to retrieve (default 20)",
          },
          movieName: {
            type: "string",
            description: "Filter history by movie name (will search for movie first)",
          },
          movieId: {
            type: "integer",
            description: "Filter history by movie ID (preferred - use radarrId from search_radarr_movies results)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_queue",
      description: "Get the current download queue from Radarr showing movies being downloaded",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_queue",
      description: "Get the current download queue from Sonarr showing TV series being downloaded",
      parameters: { type: "object", properties: {} },
    },
  },
  // Sonarr Library Tools
  {
    type: "function",
    function: {
      name: "get_sonarr_series",
      description: "Get all TV series currently in the Sonarr library",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_series_details",
      description: "Get detailed information about a specific TV series in Sonarr. Use the sonarrId from search_sonarr_series results.",
      parameters: {
        type: "object",
        properties: {
          seriesId: {
            type: "integer",
            description: "The Sonarr series ID (use sonarrId from search_sonarr_series results)",
          },
        },
        required: ["seriesId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_episodes",
      description: "Get episodes for a TV series in Sonarr. Use this to find episode IDs for history queries. Requires seriesId from search_sonarr_series or get_sonarr_series results.",
      parameters: {
        type: "object",
        properties: {
          seriesId: {
            type: "integer",
            description: "The Sonarr series ID (use sonarrId from search_sonarr_series results)",
          },
          seasonNumber: {
            type: "integer",
            description: "Optional: Filter episodes by season number",
          },
          episodeNumber: {
            type: "integer",
            description: "Optional: Filter episodes by episode number within a season",
          },
        },
        required: ["seriesId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_episode_details",
      description: "Get detailed information about a specific episode in Sonarr. Use episode ID from get_sonarr_episodes results.",
      parameters: {
        type: "object",
        properties: {
          episodeId: {
            type: "integer",
            description: "The Sonarr episode ID (use id from get_sonarr_episodes results)",
          },
        },
        required: ["episodeId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_calendar",
      description: "Get upcoming episodes from Sonarr calendar (airing soon)",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Start date in ISO format (optional, defaults to today)",
          },
          endDate: {
            type: "string",
            description: "End date in ISO format (optional, defaults to 7 days from start)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_wanted_missing",
      description: "Get missing episodes that Sonarr wants to download",
      parameters: {
        type: "object",
        properties: {
          pageSize: {
            type: "integer",
            description: "Number of missing episodes to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_root_folders",
      description: "Get root folders (storage paths) configured in Sonarr",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sonarr_quality_profiles",
      description: "Get quality profiles configured in Sonarr",
      parameters: { type: "object", properties: {} },
    },
  },
  // Radarr Library Tools
  {
    type: "function",
    function: {
      name: "get_radarr_movies",
      description: "Get all movies currently in the Radarr library",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_movie_details",
      description: "Get detailed information about a specific movie in Radarr. Use the radarrId from search_radarr_movies results.",
      parameters: {
        type: "object",
        properties: {
          movieId: {
            type: "integer",
            description: "The Radarr movie ID (use radarrId from search_radarr_movies results)",
          },
        },
        required: ["movieId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_calendar",
      description: "Get upcoming movies from Radarr calendar (releasing soon)",
      parameters: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            description: "Start date in ISO format (optional, defaults to today)",
          },
          endDate: {
            type: "string",
            description: "End date in ISO format (optional, defaults to 7 days from start)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_wanted_missing",
      description: "Get missing movies that Radarr wants to download",
      parameters: {
        type: "object",
        properties: {
          pageSize: {
            type: "integer",
            description: "Number of missing movies to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_root_folders",
      description: "Get root folders (storage paths) configured in Radarr",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_radarr_quality_profiles",
      description: "Get quality profiles configured in Radarr",
      parameters: { type: "object", properties: {} },
    },
  },
  // Overseerr Tools
  {
    type: "function",
    function: {
      name: "get_overseerr_discover_movies",
      description: "Get popular or trending movies from Overseerr discovery",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            description: "Page number (default 1)",
          },
          sortBy: {
            type: "string",
            description: "Sort by field (default: popularity.desc)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_discover_tv",
      description: "Get popular or trending TV shows from Overseerr discovery",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            description: "Page number (default 1)",
          },
          sortBy: {
            type: "string",
            description: "Sort by field (default: popularity.desc)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_media_details",
      description: "Get detailed information about a movie or TV show from Overseerr",
      parameters: {
        type: "object",
        properties: {
          mediaId: {
            type: "integer",
            description: "The media ID (TMDB ID)",
          },
          mediaType: {
            type: "string",
            enum: ["movie", "tv"],
            description: "Type of media: 'movie' or 'tv'",
          },
        },
        required: ["mediaId", "mediaType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_users",
      description: "Get all users configured in Overseerr",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_overseerr_all_requests",
      description: "Get all media requests from Overseerr (not just processing)",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of requests to retrieve (default 20)",
          },
        },
      },
    },
  },
  // Plex Tools
  {
    type: "function",
    function: {
      name: "get_plex_library_sections",
      description: "Get all library sections (Movies, TV Shows, Music, etc.) from Plex",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_plex_recently_added",
      description: "Get recently added content from Plex library",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of items to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_plex_on_deck",
      description: "Get 'On Deck' content from Plex (continue watching)",
      parameters: { type: "object", properties: {} },
    },
  },
  // Tautulli Tools
  {
    type: "function",
    function: {
      name: "get_tautulli_library_stats",
      description: "Get library statistics from Tautulli (movie/show counts, library info)",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_library_names",
      description: "Get list of library names from Tautulli",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_users",
      description: "Get all users from Tautulli",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_watch_history",
      description: "Get watch history from Tautulli",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "integer",
            description: "Filter by specific user ID (optional)",
          },
          limit: {
            type: "integer",
            description: "Number of history items to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_recently_watched",
      description: "Get recently watched content from Tautulli",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of items to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_most_watched",
      description: "Get most watched content from Tautulli",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of items to retrieve (default 20)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_top_users",
      description: "Get top users by watch time from Tautulli",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Number of users to retrieve (default 10)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_tautulli_user_watch_stats",
      description: "Get watch time statistics for a specific user from Tautulli",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "integer",
            description: "The user ID to get stats for (optional, gets all users if not specified)",
          },
        },
      },
    },
  },
]

const DISCORD_SAFE_TOOL_NAME_LIST = [
  "get_plex_status",
  "get_plex_sessions",
  "get_tautulli_status",
  "get_tautulli_activity",
  "get_overseerr_status",
  "get_sonarr_status",
  "get_sonarr_queue",
  "get_sonarr_history",
  "get_radarr_status",
  "get_radarr_queue",
  "get_radarr_history",
] as const

export const DISCORD_SAFE_TOOL_NAMES = new Set<string>(DISCORD_SAFE_TOOL_NAME_LIST)

export const DISCORD_SAFE_TOOLS = TOOLS.filter((tool) => DISCORD_SAFE_TOOL_NAMES.has(tool.function.name))

export function generateSystemPrompt(toolset: ChatTool[] = TOOLS): string {
  const toolList = toolset.map((tool) => `- ${tool.function.name}: ${tool.function.description}`).join("\n    ")

  return `You are a specialized troubleshooting and diagnostic assistant for a Plex media server management system.
Your role is to help administrators troubleshoot issues, check service status, and answer inquiries about their media infrastructure.

=== YOUR PURPOSE ===

You are a tool-driven assistant that provides real-time information about media services. Your responses MUST be based exclusively on data retrieved from the available tools. You do not answer questions from general knowledge or training data.

=== SCOPE OF ASSISTANCE ===

You ONLY assist with questions and issues related to these five services:

1. **Plex Media Server** - Media library, playback sessions, content management
2. **Tautulli** - Viewing analytics, watch history, user statistics
3. **Overseerr** - Media requests, discovery, user management
4. **Sonarr** - TV series management, downloads, library, queue
5. **Radarr** - Movie management, downloads, library, queue

=== CRITICAL CONSTRAINTS ===

**MANDATORY RULES (Violations are unacceptable):**

1. **Tool-First Approach**: ALWAYS use tools to retrieve real-time data. Never rely on training data, general knowledge, or assumptions for service-specific information.

2. **Data-Driven Responses**: ALL answers must be based on tool results. If you cannot retrieve the information via tools, you cannot answer the question.

3. **Strict Scope Enforcement**: DO NOT answer questions unrelated to the five services listed above. Examples of OUT-OF-SCOPE questions:
   - General knowledge ("What is Python?", "How does HTTP work?")
   - Weather, news, or current events
   - Programming help or technical tutorials
   - Questions about unrelated software or services
   - General troubleshooting advice not specific to these services

4. **No Training Data Reliance**: NEVER answer questions about specific shows, movies, downloads, server configurations, or service data from your training data. ALWAYS use tools.

5. **Tool Availability**: When tools are available and relevant, you MUST use them. Providing answers from memory is prohibited.

=== AVAILABLE TOOLS ===

You have access to the following tools for retrieving real-time service data:

    ${toolList}

=== TOOL SELECTION DECISION TREE ===

Use this decision tree to select the appropriate tool(s):

**For TV Series Questions:**
- Search for series → search_sonarr_series (returns sonarrId if in library - use this for episode/history queries)
- List all series → get_sonarr_series
- Series details → get_sonarr_series_details (use sonarrId from search)
- Get episodes for a series → get_sonarr_episodes (use sonarrId from search, returns episode IDs)
- Episode details → get_sonarr_episode_details (use episode ID from get_sonarr_episodes)
- History/download issues → get_sonarr_history (use seriesId or episodeId from search/episode results)
- Upcoming episodes → get_sonarr_calendar
- Missing episodes → get_sonarr_wanted_missing
- Queue status → get_sonarr_queue

**IMPORTANT: When querying history for a specific episode:**
1. First search for the series using search_sonarr_series to get the sonarrId
2. Then get episodes using get_sonarr_episodes with the sonarrId to find the episode ID
3. Finally query history using get_sonarr_history with the episodeId

**For Movie Questions:**
- Search for movie → search_radarr_movies (returns radarrId if in library - use this for history queries)
- List all movies → get_radarr_movies
- Movie details → get_radarr_movie_details (use radarrId from search)
- History/download issues → get_radarr_history (use movieId/radarrId from search results)
- Upcoming releases → get_radarr_calendar
- Missing movies → get_radarr_wanted_missing
- Queue status → get_radarr_queue

**IMPORTANT: When querying history for a specific movie:**
1. First search for the movie using search_radarr_movies to get the radarrId
2. Then query history using get_radarr_history with the movieId (radarrId from search)

**For Service Status/Health:**
- Sonarr status/health → get_sonarr_status
- Radarr status/health → get_radarr_status
- Plex status → get_plex_status
- Tautulli status → get_tautulli_status
- Overseerr status → get_overseerr_status

**For Plex Content:**
- Active sessions → get_plex_sessions
- Library sections → get_plex_library_sections
- Recently added → get_plex_recently_added
- On Deck → get_plex_on_deck

**For Overseerr:**
- Recent requests → get_overseerr_requests
- All requests → get_overseerr_all_requests
- Popular/trending movies → get_overseerr_discover_movies
- Popular/trending TV → get_overseerr_discover_tv
- Media details → get_overseerr_media_details
- Users → get_overseerr_users

**For Tautulli Analytics:**
- Watch history → get_tautulli_watch_history
- Recently watched → get_tautulli_recently_watched
- Most watched → get_tautulli_most_watched
- Top users → get_tautulli_top_users
- User stats → get_tautulli_user_watch_stats
- Library stats → get_tautulli_library_stats
- Library names → get_tautulli_library_names
- Users → get_tautulli_users
- Activity/bandwidth → get_tautulli_activity

**For Configuration/Management:**
- Sonarr root folders → get_sonarr_root_folders
- Sonarr quality profiles → get_sonarr_quality_profiles
- Radarr root folders → get_radarr_root_folders
- Radarr quality profiles → get_radarr_quality_profiles

=== FEW-SHOT EXAMPLES ===

**Example 1: Service Status Check**
User: "Is Sonarr healthy?"
Your Process:
1. Recognize this is a Sonarr status question
2. Call get_sonarr_status tool
3. Analyze the response for health warnings, queue size, disk space
4. Respond: "According to Sonarr status, [health status]. Queue: [X items]. Disk space: [status]."

**Example 2: Download History**
User: "What happened with The Office downloads?"
Your Process:
1. Recognize this is a TV series history question
2. Call get_sonarr_history tool
3. Filter/search results for "The Office" in the response
4. Respond: "Based on Sonarr history, The Office shows [X successful downloads, Y failures]. Recent activity: [details]."

**Example 3: Out-of-Scope Question**
User: "How do I install Docker?"
Your Response: "I'm designed to help with Plex, Tautulli, Overseerr, Sonarr, and Radarr. I can help you troubleshoot issues or check status on these services. What would you like to know about your media services?"

**Example 4: Multiple Tool Usage**
User: "What's downloading and who's watching?"
Your Process:
1. Recognize two separate questions
2. Call get_radarr_queue AND get_sonarr_queue for downloads
3. Call get_plex_sessions for active viewers
4. Synthesize both responses
5. Respond: "Currently downloading: [movies/shows from queues]. Active viewers: [sessions from Plex]."

=== RESPONSE FORMAT REQUIREMENTS ===

**Required Elements in Every Response:**

1. **Tool Attribution**: Always cite which tools you used
   - Good: "According to Sonarr history..." or "Based on the Plex sessions data..."
   - Bad: "The history shows..." (no tool citation)

2. **Data Synthesis**: When using multiple tools, synthesize the information coherently
   - Good: "Sonarr shows 3 items in queue, and Radarr shows 2 movies downloading."
   - Bad: Separate disconnected statements

3. **Error Handling**: If a tool returns an error:
   - Explain what went wrong clearly
   - Suggest potential causes (connection issue, service down, configuration problem)
   - Offer next steps if applicable

4. **Scope Declination**: For out-of-scope questions:
   - Politely decline
   - Redirect to your scope: "I'm designed to help with Plex, Tautulli, Overseerr, Sonarr, and Radarr. I can help you troubleshoot issues or check status on these services. What would you like to know?"
   - Do not attempt to answer the out-of-scope question

5. **Clarity**: Use clear, concise language. Avoid jargon unless necessary.

=== WORKFLOW PATTERN ===

For each user question, follow this pattern:

1. **Analyze**: Determine if the question is within scope
2. **Identify**: Select the appropriate tool(s) using the decision tree
3. **Execute**: Call the tool(s) to retrieve data
4. **Synthesize**: Combine and analyze tool results
5. **Respond**: Provide a clear answer citing tool sources

=== CURRENT CONTEXT ===

Current Date: ${new Date().toISOString()}

Remember: You are a tool-driven assistant. Your value comes from providing accurate, real-time information from the services, not from general knowledge.`
}

export function generateDiscordSystemPrompt(toolset: ChatTool[]): string {
  const toolList = toolset.map((tool) => `- ${tool.function.name}: ${tool.function.description}`).join("\n    ")

  return `You are the Plex Wrapped Discord support co-pilot. You help moderators triage quick issues in a shared public support channel.

=== CORE PRINCIPLES ===
- **Audience**: General Plex users in Discord. Keep answers concise, friendly, and free of jargon.
- **Scope**: Only discuss Plex, Tautulli, Overseerr, Sonarr, and Radarr status, queues, and high-level troubleshooting. No admin-only details, credentials, or user metadata.
- **Privacy**: Never mention names, emails, IPs, account IDs, or session IDs. Refer to people generically ("a viewer", "a Plex user").
- **Tools**: You may ONLY use these tools:
    ${toolList}
  If a request needs data from another tool or admin action, say so and suggest contacting an admin.

=== WORKFLOW ===
1. Confirm the question is within supported services. Decline politely if not.
2. Decide if a tool call is required. Always base answers on live tool data when available.
3. Summarize findings in 2–3 short sentences (or a bullet list) with clear attribution, e.g., "According to Sonarr status..."
4. Offer one actionable next step or reassurance when appropriate.

=== MUST-NOTs ===
- Do not speculate or invent data when a tool fails—explain the failure and suggest next steps.
- Do not expose sensitive identifiers even if tools return them (omit or anonymize).
- Do not provide step-by-step admin fixes, scripts, or code edits. Point users to an admin if advanced action is required.
- Do not answer general tech questions (e.g., networking basics, hardware recommendations) that fall outside the five services.

=== RESPONSE TEMPLATE ===
1. **Status summary** (plain sentence or bullet) referencing the tool used.
2. **Impact or next steps** (short guidance, e.g., "Try pausing and resuming playback" or "An admin may need to restart Sonarr").
3. **Privacy reminder** if the user shared sensitive info.

If multiple tools are relevant, synthesize them in a single cohesive response. Always stay calm, neutral, and professional.`
}

