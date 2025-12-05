/**
 * Script to profile maintenance rule query performance
 * Issue #39: Investigate potential N+1 query in maintenance rule fetching
 * Issue #108: Enhanced profiling tooling
 *
 * Usage:
 *   npx tsx scripts/performance/profile-maintenance-query.ts [options]
 *
 * Options:
 *   --seed          Create synthetic test data
 *   --cleanup       Remove synthetic test data after profiling
 *   --rules=N       Number of rules to seed (default: 100)
 *   --scans=N       Number of scans per rule to seed (default: 10)
 *   --export=FORMAT Export results (json, csv, or both)
 *   --output=PATH   Output directory for exports (default: ./profiling-results)
 *   --memory        Enable memory profiling alongside timing metrics
 *   --iterations=N  Number of iterations per test (default: 5)
 *   --help          Show help
 *
 * Examples:
 *   npx tsx scripts/performance/profile-maintenance-query.ts --seed --rules=200 --scans=50
 *   npx tsx scripts/performance/profile-maintenance-query.ts --seed --export=json --memory
 *   npx tsx scripts/performance/profile-maintenance-query.ts --seed --cleanup --export=both --output=./results
 */

import { PrismaClient } from "../../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as fs from "fs"
import * as path from "path"

// Parse command line arguments
function parseArgs(): {
  seed: boolean
  cleanup: boolean
  rules: number
  scans: number
  export: "json" | "csv" | "both" | null
  output: string
  memory: boolean
  iterations: number
  help: boolean
} {
  const args = process.argv.slice(2)
  const config = {
    seed: false,
    cleanup: false,
    rules: 100,
    scans: 10,
    export: null as "json" | "csv" | "both" | null,
    output: "./profiling-results",
    memory: false,
    iterations: 5,
    help: false,
  }

  for (const arg of args) {
    if (arg === "--seed") config.seed = true
    else if (arg === "--cleanup") config.cleanup = true
    else if (arg === "--memory") config.memory = true
    else if (arg === "--help" || arg === "-h") config.help = true
    else if (arg.startsWith("--rules=")) {
      const value = parseInt(arg.split("=")[1], 10)
      if (!isNaN(value) && value > 0) config.rules = value
    } else if (arg.startsWith("--scans=")) {
      const value = parseInt(arg.split("=")[1], 10)
      if (!isNaN(value) && value >= 0) config.scans = value
    } else if (arg.startsWith("--iterations=")) {
      const value = parseInt(arg.split("=")[1], 10)
      if (!isNaN(value) && value > 0) config.iterations = value
    } else if (arg.startsWith("--export=")) {
      const value = arg.split("=")[1] as "json" | "csv" | "both"
      if (["json", "csv", "both"].includes(value)) config.export = value
    } else if (arg.startsWith("--output=")) {
      config.output = arg.split("=")[1]
    }
  }

  return config
}

function showHelp() {
  console.log(`
Maintenance Query Performance Profiler

Usage:
  npx tsx scripts/performance/profile-maintenance-query.ts [options]

Options:
  --seed          Create synthetic test data
  --cleanup       Remove synthetic test data after profiling
  --rules=N       Number of rules to seed (default: 100)
  --scans=N       Number of scans per rule to seed (default: 10)
  --export=FORMAT Export results (json, csv, or both)
  --output=PATH   Output directory for exports (default: ./profiling-results)
  --memory        Enable memory profiling alongside timing metrics
  --iterations=N  Number of iterations per test (default: 5)
  --help, -h      Show this help message

Examples:
  # Basic profiling with existing data
  npx tsx scripts/performance/profile-maintenance-query.ts

  # Seed data and run profiling
  npx tsx scripts/performance/profile-maintenance-query.ts --seed

  # Custom data size with memory profiling
  npx tsx scripts/performance/profile-maintenance-query.ts --seed --rules=200 --scans=50 --memory

  # Export results to JSON
  npx tsx scripts/performance/profile-maintenance-query.ts --seed --export=json

  # Full profiling with cleanup and export
  npx tsx scripts/performance/profile-maintenance-query.ts --seed --cleanup --export=both --memory
`)
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined")
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
    { emit: "stdout", level: "error" },
  ],
})

const TEST_DATA_PREFIX = "__PERF_TEST__"

interface QueryLog {
  query: string
  params: string
  duration: number
  timestamp: Date
}

interface MemorySnapshot {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  rss: number
}

interface ProfilingResult {
  timestamp: string
  config: {
    ruleCount: number
    scanCount: number
    iterations: number
    memoryEnabled: boolean
  }
  current: {
    times: number[]
    avgDuration: number
    minDuration: number
    maxDuration: number
    queryCount: number
    memory?: MemorySnapshot
  }
  optimized: {
    times: number[]
    avgDuration: number
    minDuration: number
    maxDuration: number
    queryCount: number
    memory?: MemorySnapshot
  }
  improvement: number
  recommendation: string
}

const queryLogs: QueryLog[] = []

// Log all queries for analysis
prisma.$on("query", (e) => {
  queryLogs.push({
    query: e.query,
    params: e.params,
    duration: e.duration,
    timestamp: new Date(),
  })
})

function getMemorySnapshot(): MemorySnapshot {
  const usage = process.memoryUsage()
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers,
    rss: usage.rss,
  }
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"]
  let unitIndex = 0
  let value = bytes
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`
}

async function seedTestData(ruleCount: number, scansPerRule: number) {
  console.log(`\nSeeding test data: ${ruleCount} rules with ${scansPerRule} scans each...`)

  const start = Date.now()

  // Batch create for better performance
  const batchSize = 50
  for (let batch = 0; batch < ruleCount; batch += batchSize) {
    const batchEnd = Math.min(batch + batchSize, ruleCount)

    for (let i = batch; i < batchEnd; i++) {
      const rule = await prisma.maintenanceRule.create({
        data: {
          name: `${TEST_DATA_PREFIX} Rule ${i + 1}`,
          description: `Performance test rule ${i + 1}`,
          enabled: i % 2 === 0,
          mediaType: i % 2 === 0 ? "MOVIE" : "TV_SERIES",
          criteria: {
            type: "group",
            id: `group-${i}`,
            operator: "AND",
            conditions: [
              {
                type: "condition",
                id: `cond-${i}`,
                field: "lastWatchedAt",
                operator: "olderThan",
                value: 30 + i,
                valueUnit: "days",
              },
            ],
          },
          actionType: "FLAG_FOR_REVIEW",
          schedule: "0 0 * * *",
        },
      })

      // Create scans for this rule
      if (scansPerRule > 0) {
        const scanData = Array.from({ length: scansPerRule }, (_, j) => ({
          ruleId: rule.id,
          status: "COMPLETED" as const,
          startedAt: new Date(Date.now() - (scansPerRule - j) * 86400000),
          completedAt: new Date(Date.now() - (scansPerRule - j) * 86400000 + 60000),
          itemsScanned: 100 + j * 10,
          itemsFlagged: j * 2,
        }))

        await prisma.maintenanceScan.createMany({ data: scanData })
      }
    }

    // Progress indicator
    const progress = Math.round((batchEnd / ruleCount) * 100)
    process.stdout.write(`\r  Progress: ${progress}%`)
  }

  const duration = Date.now() - start
  const totalRecords = ruleCount * (1 + scansPerRule)
  console.log(`\n  Seeded ${totalRecords} records in ${duration}ms`)
}

async function cleanupTestData() {
  console.log("\nCleaning up test data...")

  const rules = await prisma.maintenanceRule.findMany({
    where: { name: { startsWith: TEST_DATA_PREFIX } },
    select: { id: true },
  })

  // Cascading delete will handle scans
  await prisma.maintenanceRule.deleteMany({
    where: { name: { startsWith: TEST_DATA_PREFIX } },
  })

  console.log(`  Deleted ${rules.length} test rules and their scans`)
}

async function runCurrentQuery(): Promise<{ duration: number; resultCount: number }> {
  queryLogs.length = 0 // Clear previous logs

  const start = Date.now()

  const rules = await prisma.maintenanceRule.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      scans: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          status: true,
          itemsScanned: true,
          itemsFlagged: true,
          completedAt: true,
        },
      },
      _count: {
        select: {
          scans: true,
        },
      },
    },
  })

  const duration = Date.now() - start

  return { duration, resultCount: rules.length }
}

async function runOptimizedQuery(): Promise<{
  duration: number
  resultCount: number
  scanFetched: number
}> {
  queryLogs.length = 0 // Clear previous logs

  const start = Date.now()

  // Fetch rules without relations first
  const rules = await prisma.maintenanceRule.findMany({
    orderBy: { createdAt: "desc" },
  })

  const ruleIds = rules.map((r) => r.id)

  // Fetch latest scans using Prisma's distinct to avoid N+1
  const latestScans = await prisma.maintenanceScan.findMany({
    where: {
      ruleId: { in: ruleIds },
    },
    orderBy: { createdAt: "desc" },
    distinct: ["ruleId"],
    select: {
      id: true,
      ruleId: true,
      status: true,
      itemsScanned: true,
      itemsFlagged: true,
      completedAt: true,
    },
  })

  // Get scan counts per rule
  const scanCounts = await prisma.maintenanceScan.groupBy({
    by: ["ruleId"],
    where: { ruleId: { in: ruleIds } },
    _count: { id: true },
  })

  const duration = Date.now() - start

  // Create a map for easy lookup
  const scansByRuleId = new Map(latestScans.map((s) => [s.ruleId, s]))
  const countsByRuleId = new Map(scanCounts.map((c) => [c.ruleId, c._count.id]))

  // Combine results (for demonstration)
  const combinedResults = rules.map((rule) => ({
    ...rule,
    latestScan: scansByRuleId.get(rule.id) || null,
    scanCount: countsByRuleId.get(rule.id) || 0,
  }))

  return {
    duration,
    resultCount: combinedResults.length,
    scanFetched: latestScans.length,
  }
}

function getQueryCount(): number {
  return queryLogs.length
}

function printQueryAnalysis(label: string) {
  console.log(`\n--- Query Analysis: ${label} ---`)
  console.log(`  Total queries: ${queryLogs.length}`)

  const totalDuration = queryLogs.reduce((sum, q) => sum + q.duration, 0)
  console.log(`  Total query time: ${totalDuration}ms`)

  // Group queries by type
  const queryTypes = new Map<string, number>()
  for (const log of queryLogs) {
    const type = log.query.split(" ")[0]
    queryTypes.set(type, (queryTypes.get(type) || 0) + 1)
  }

  console.log("  Query breakdown:")
  for (const [type, count] of Array.from(queryTypes.entries())) {
    console.log(`    ${type}: ${count}`)
  }

  // Show slowest queries
  const slowest = [...queryLogs].sort((a, b) => b.duration - a.duration).slice(0, 3)
  if (slowest.length > 0) {
    console.log("  Slowest queries:")
    for (const q of slowest) {
      console.log(`    ${q.duration}ms: ${q.query.substring(0, 80)}...`)
    }
  }
}

function exportToJSON(result: ProfilingResult, outputPath: string) {
  const filename = `profile-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  const filepath = path.join(outputPath, filename)
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2))
  console.log(`  JSON exported to: ${filepath}`)
}

function exportToCSV(result: ProfilingResult, outputPath: string) {
  const filename = `profile-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`
  const filepath = path.join(outputPath, filename)

  const headers = [
    "timestamp",
    "rule_count",
    "scan_count",
    "iterations",
    "current_avg_ms",
    "current_min_ms",
    "current_max_ms",
    "current_queries",
    "optimized_avg_ms",
    "optimized_min_ms",
    "optimized_max_ms",
    "optimized_queries",
    "improvement_pct",
    "recommendation",
  ]

  const values = [
    result.timestamp,
    result.config.ruleCount,
    result.config.scanCount,
    result.config.iterations,
    result.current.avgDuration.toFixed(2),
    result.current.minDuration,
    result.current.maxDuration,
    result.current.queryCount,
    result.optimized.avgDuration.toFixed(2),
    result.optimized.minDuration,
    result.optimized.maxDuration,
    result.optimized.queryCount,
    result.improvement.toFixed(1),
    `"${result.recommendation}"`,
  ]

  const csvContent = headers.join(",") + "\n" + values.join(",")
  fs.writeFileSync(filepath, csvContent)
  console.log(`  CSV exported to: ${filepath}`)
}

async function main() {
  const config = parseArgs()

  if (config.help) {
    showHelp()
    return
  }

  console.log("=== Maintenance Query Performance Profiling ===")
  console.log(`Issue #39: Investigate potential N+1 query`)
  console.log(`Issue #108: Enhanced profiling tooling\n`)
  console.log(`Configuration:`)
  console.log(`  Rules to seed: ${config.rules}`)
  console.log(`  Scans per rule: ${config.scans}`)
  console.log(`  Iterations: ${config.iterations}`)
  console.log(`  Memory profiling: ${config.memory ? "enabled" : "disabled"}`)
  console.log(`  Export format: ${config.export || "none"}`)

  try {
    if (config.seed) {
      await seedTestData(config.rules, config.scans)
    }

    // Get data counts for profiling
    const [ruleCount, scanCount] = await Promise.all([
      prisma.maintenanceRule.count(),
      prisma.maintenanceScan.count(),
    ])

    console.log(`\nData for profiling: ${ruleCount} rules, ${scanCount} scans`)

    // Force garbage collection before memory profiling if available
    if (config.memory && global.gc) {
      global.gc()
    }

    // Profile current implementation
    console.log("\n========================================")
    console.log("CURRENT IMPLEMENTATION (with include)")
    console.log("========================================")

    const currentTimes: number[] = []
    let currentMemory: MemorySnapshot | undefined
    let currentQueryCount = 0

    if (config.memory) {
      currentMemory = getMemorySnapshot()
      console.log(`  Memory before: ${formatBytes(currentMemory.heapUsed)} heap used`)
    }

    for (let i = 0; i < config.iterations; i++) {
      const result = await runCurrentQuery()
      currentTimes.push(result.duration)
      console.log(`  Run ${i + 1}: ${result.duration}ms (${result.resultCount} rules)`)
    }

    currentQueryCount = getQueryCount()

    if (config.memory) {
      const afterMemory = getMemorySnapshot()
      console.log(`  Memory after: ${formatBytes(afterMemory.heapUsed)} heap used`)
      console.log(`  Memory delta: ${formatBytes(afterMemory.heapUsed - currentMemory!.heapUsed)}`)
    }

    printQueryAnalysis("Current Implementation")

    const avgCurrent = currentTimes.reduce((a, b) => a + b, 0) / currentTimes.length
    console.log(`\n  Average: ${avgCurrent.toFixed(2)}ms`)
    console.log(`  Min: ${Math.min(...currentTimes)}ms`)
    console.log(`  Max: ${Math.max(...currentTimes)}ms`)

    // Profile optimized implementation
    console.log("\n========================================")
    console.log("OPTIMIZED IMPLEMENTATION (separate queries)")
    console.log("========================================")

    const optimizedTimes: number[] = []
    let optimizedMemory: MemorySnapshot | undefined
    let optimizedQueryCount = 0

    if (config.memory) {
      if (global.gc) global.gc()
      optimizedMemory = getMemorySnapshot()
      console.log(`  Memory before: ${formatBytes(optimizedMemory.heapUsed)} heap used`)
    }

    for (let i = 0; i < config.iterations; i++) {
      const result = await runOptimizedQuery()
      optimizedTimes.push(result.duration)
      console.log(
        `  Run ${i + 1}: ${result.duration}ms (${result.resultCount} rules, ${result.scanFetched} scans)`
      )
    }

    optimizedQueryCount = getQueryCount()

    if (config.memory) {
      const afterMemory = getMemorySnapshot()
      console.log(`  Memory after: ${formatBytes(afterMemory.heapUsed)} heap used`)
      console.log(`  Memory delta: ${formatBytes(afterMemory.heapUsed - optimizedMemory!.heapUsed)}`)
    }

    printQueryAnalysis("Optimized Implementation")

    const avgOptimized = optimizedTimes.reduce((a, b) => a + b, 0) / optimizedTimes.length
    console.log(`\n  Average: ${avgOptimized.toFixed(2)}ms`)
    console.log(`  Min: ${Math.min(...optimizedTimes)}ms`)
    console.log(`  Max: ${Math.max(...optimizedTimes)}ms`)

    // Summary
    console.log("\n========================================")
    console.log("PERFORMANCE SUMMARY")
    console.log("========================================")
    console.log(`  Current implementation: ${avgCurrent.toFixed(2)}ms avg`)
    console.log(`  Optimized implementation: ${avgOptimized.toFixed(2)}ms avg`)

    const improvement = ((avgCurrent - avgOptimized) / avgCurrent) * 100
    if (improvement > 0) {
      console.log(`  Improvement: ${improvement.toFixed(1)}% faster`)
    } else {
      console.log(`  Change: ${Math.abs(improvement).toFixed(1)}% slower (optimization not needed)`)
    }

    const threshold = 1000 // 1 second
    console.log(`\n  Threshold: ${threshold}ms`)

    let recommendation: string
    if (avgCurrent > threshold) {
      recommendation = `Current query exceeds threshold, optimization recommended`
      console.log(`  RECOMMENDATION: ${recommendation}`)
    } else {
      recommendation = `Current query is within acceptable limits (< ${threshold}ms)`
      console.log(`  RECOMMENDATION: ${recommendation}`)
    }

    // Export results if requested
    if (config.export) {
      console.log("\n========================================")
      console.log("EXPORTING RESULTS")
      console.log("========================================")

      // Ensure output directory exists
      if (!fs.existsSync(config.output)) {
        fs.mkdirSync(config.output, { recursive: true })
      }

      const result: ProfilingResult = {
        timestamp: new Date().toISOString(),
        config: {
          ruleCount,
          scanCount,
          iterations: config.iterations,
          memoryEnabled: config.memory,
        },
        current: {
          times: currentTimes,
          avgDuration: avgCurrent,
          minDuration: Math.min(...currentTimes),
          maxDuration: Math.max(...currentTimes),
          queryCount: currentQueryCount,
          memory: currentMemory,
        },
        optimized: {
          times: optimizedTimes,
          avgDuration: avgOptimized,
          minDuration: Math.min(...optimizedTimes),
          maxDuration: Math.max(...optimizedTimes),
          queryCount: optimizedQueryCount,
          memory: optimizedMemory,
        },
        improvement,
        recommendation,
      }

      if (config.export === "json" || config.export === "both") {
        exportToJSON(result, config.output)
      }

      if (config.export === "csv" || config.export === "both") {
        exportToCSV(result, config.output)
      }
    }

    if (config.cleanup) {
      await cleanupTestData()
    }
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
