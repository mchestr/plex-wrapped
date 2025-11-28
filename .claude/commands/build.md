---
description: Build the Next.js application and check for errors
allowed-tools: [Bash, Read, Edit]
model: haiku
---

# Build Runner

Build the Next.js application for production and identify any build errors.

## Usage

- `/build` - Run production build
- `/build analyze` - Build with bundle analysis
- `/build check` - Quick type-check without full build

## Arguments

$ARGUMENTS can specify:
- `analyze` - Run build with bundle analysis (if configured)
- `check` - Run type checking only (faster than full build)

## Instructions

1. Parse arguments to determine build mode
2. Execute the appropriate command:
   - No args: `npm run build`
   - `check`: `npx tsc --noEmit`
   - `analyze`: `npm run build` (with ANALYZE=true if configured)
3. Monitor build process and report progress
4. If build fails:
   - Identify the specific error (type errors, import errors, etc.)
   - Show the file and line where error occurred
   - Offer to fix the issue
5. If build succeeds:
   - Report build time
   - Show bundle sizes (if available)
   - Note any warnings that should be addressed

## Common Issues to Check

- TypeScript type errors
- Missing dependencies
- Import path issues
- Environment variable issues
- Build optimization warnings

## Error Handling

- Parse build errors to identify root cause
- Check for common issues (missing modules, type errors, etc.)
- Offer specific fixes based on error type
- Suggest running `npm install` if dependency issues detected
