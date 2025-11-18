-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateIndex
CREATE INDEX "PromptTemplate_isActive_idx" ON "PromptTemplate"("isActive");

-- CreateIndex
CREATE INDEX "PromptTemplate_name_idx" ON "PromptTemplate"("name");

-- Insert default prompt template (user prompt - contains only viewing statistics data)
INSERT INTO "PromptTemplate" ("id", "name", "description", "template", "isActive", "version", "createdAt", "updatedAt")
VALUES (
  'cdefaultwrappedprompt0000',
  'Default Wrapped Prompt',
  'The original default prompt template for generating Plex Wrapped content',
  '=== VIEWING STATISTICS FOR {{year}} ===

Here are the viewing statistics for {{userName}}:

**Watch Time (all values are in minutes, converted to days/hours/minutes for clarity):**
- Total watch time: {{totalWatchTime}} ({{totalWatchTimeMinutes}} minutes total)
- Movies watch time: {{moviesWatchTime}} ({{moviesWatchTimeMinutes}} minutes total)
- Shows watch time: {{showsWatchTime}} ({{showsWatchTimeMinutes}} minutes total)

**Content Watched:**
- Movies watched: {{moviesWatched}}
- Shows watched: {{showsWatched}}
- Episodes watched: {{episodesWatched}}

**Top Movies (by watch time - all times in minutes):**
{{topMoviesList}}

**Top Shows (by watch time - all times in minutes):**
{{topShowsList}}

{{leaderboardSection}}

{{serverStatsSection}}

{{overseerrStatsSection}}

{{watchTimeByMonthSection}}

**Additional Context:**
- Server name: {{serverName}}
- Binge watcher calculation: {{bingeWatcher}} (true if any show has episodesWatched > 20)
- Discovery score: {{discoveryScore}} (calculated as min(100, max(0, floor((moviesWatched + showsWatched) / 10))))

Generate the personalized Plex Wrapped content based on these statistics.',
  true,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- AlterTable: Add temperature column to LLMProvider
ALTER TABLE "LLMProvider" ADD COLUMN "temperature" REAL;

-- AlterTable: Add maxTokens column to LLMProvider
ALTER TABLE "LLMProvider" ADD COLUMN "maxTokens" INTEGER;

