# Performance Testing Guide

This document describes the performance testing tools available in Plex Manager and recommended workflows for investigating performance issues.

## Maintenance Query Profiler

Located at: `scripts/performance/profile-maintenance-query.ts`

This script profiles the maintenance rule query performance to detect and prevent N+1 query issues.

### Quick Start

```bash
# Basic profiling with existing data
npx tsx scripts/performance/profile-maintenance-query.ts

# Seed test data and run profiling
npx tsx scripts/performance/profile-maintenance-query.ts --seed

# Full profiling with custom sizes
npx tsx scripts/performance/profile-maintenance-query.ts --seed --rules=200 --scans=50 --memory

# Export results for tracking
npx tsx scripts/performance/profile-maintenance-query.ts --seed --export=json
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--seed` | Create synthetic test data | false |
| `--cleanup` | Remove test data after profiling | false |
| `--rules=N` | Number of rules to seed | 100 |
| `--scans=N` | Number of scans per rule | 10 |
| `--export=FORMAT` | Export format: json, csv, or both | none |
| `--output=PATH` | Output directory for exports | ./profiling-results |
| `--memory` | Enable memory profiling | false |
| `--iterations=N` | Number of test iterations | 5 |
| `--help` | Show help message | - |

### Example Output

```
=== Maintenance Query Performance Profiling ===
Issue #39: Investigate potential N+1 query
Issue #108: Enhanced profiling tooling

Configuration:
  Rules to seed: 100
  Scans per rule: 10
  Iterations: 5
  Memory profiling: enabled
  Export format: json

Seeding test data: 100 rules with 10 scans each...
  Seeded 1100 records in 3245ms

Data for profiling: 100 rules, 1000 scans

========================================
CURRENT IMPLEMENTATION (with include)
========================================
  Memory before: 45.23 MB heap used
  Run 1: 12ms (100 rules)
  Run 2: 8ms (100 rules)
  Run 3: 7ms (100 rules)
  Run 4: 7ms (100 rules)
  Run 5: 6ms (100 rules)
  Memory after: 52.18 MB heap used
  Memory delta: 6.95 MB

--- Query Analysis: Current Implementation ---
  Total queries: 2
  Total query time: 6ms
  Query breakdown:
    SELECT: 2

  Average: 8.00ms
  Min: 6ms
  Max: 12ms

========================================
PERFORMANCE SUMMARY
========================================
  Current implementation: 8.00ms avg
  Optimized implementation: 12.40ms avg
  Change: 55.0% slower (optimization not needed)

  Threshold: 1000ms
  RECOMMENDATION: Current query is within acceptable limits (< 1000ms)
```

### Interpreting Results

#### Query Count

- **2 queries** is optimal for the current implementation
- Prisma optimizes `include` with nested relations into 2 queries:
  1. Fetch all rules
  2. Fetch related scans and counts in a single batched query

If you see more than 2 queries, there may be an N+1 issue.

#### Timing Thresholds

- **< 100ms**: Excellent performance
- **100-500ms**: Acceptable for most use cases
- **500-1000ms**: May need optimization for high-traffic scenarios
- **> 1000ms**: Optimization recommended

#### Memory Usage

Memory profiling shows heap usage before and after queries. Large deltas may indicate:
- Excessive data being loaded
- Memory leaks in result processing
- Need for pagination

### Recommended Profiling Workflow

1. **Baseline**: Run profiling with current production-like data
2. **Scale Test**: Increase data volume to simulate growth
3. **Compare**: Test alternative query implementations
4. **Track**: Export results to track performance over time

```bash
# Step 1: Baseline
npx tsx scripts/performance/profile-maintenance-query.ts --export=json

# Step 2: Scale test (5x data)
npx tsx scripts/performance/profile-maintenance-query.ts --seed --rules=500 --scans=50 --export=json --cleanup

# Step 3: Historical tracking
npx tsx scripts/performance/profile-maintenance-query.ts --seed --export=both --output=./perf-history/$(date +%Y-%m-%d)
```

### Exporting Results

#### JSON Export

Contains full profiling data including:
- Configuration used
- All timing measurements
- Query counts
- Memory snapshots (if enabled)
- Computed statistics

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "config": {
    "ruleCount": 100,
    "scanCount": 1000,
    "iterations": 5,
    "memoryEnabled": true
  },
  "current": {
    "times": [12, 8, 7, 7, 6],
    "avgDuration": 8.0,
    "minDuration": 6,
    "maxDuration": 12,
    "queryCount": 2,
    "memory": {
      "heapUsed": 47185920,
      "heapTotal": 65536000,
      "external": 1024000,
      "rss": 98304000
    }
  },
  "improvement": -55.0,
  "recommendation": "Current query is within acceptable limits (< 1000ms)"
}
```

#### CSV Export

Flat format suitable for spreadsheets and trend analysis:

```csv
timestamp,rule_count,scan_count,iterations,current_avg_ms,current_min_ms,current_max_ms,current_queries,optimized_avg_ms,optimized_min_ms,optimized_max_ms,optimized_queries,improvement_pct,recommendation
2024-01-15T10:30:00.000Z,100,1000,5,8.00,6,12,2,12.40,10,15,3,-55.0,"Current query is within acceptable limits (< 1000ms)"
```

## Adding New Performance Tests

When adding new performance-critical queries:

1. Create a profiling function in the script or a new script in `scripts/performance/`
2. Include query event logging to count database queries
3. Test with various data volumes
4. Document expected query counts and timing thresholds
5. Consider adding to CI for regression detection

## Related Files

- `scripts/performance/profile-maintenance-query.ts` - Main profiling script
- `actions/maintenance/rules.ts` - Maintenance rule queries (lines 27-51)
- `actions/__tests__/maintenance.test.ts` - Unit tests including N+1 prevention test
