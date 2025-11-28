---
description: Run tests with optional filters and modes
allowed-tools: [Bash, Read, Edit]
model: haiku
---

# Test Runner

Run project tests with various options.

## Usage

- `/test` - Run all unit tests
- `/test watch` - Run tests in watch mode
- `/test coverage` - Run tests with coverage report
- `/test e2e` - Run Playwright E2E tests
- `/test e2e:ui` - Run E2E tests with Playwright UI
- `/test e2e:debug` - Run E2E tests in debug mode
- `/test [filename]` - Run tests for specific file

## Arguments

$ARGUMENTS can specify:
- `watch` - Run in watch mode
- `coverage` - Generate coverage report
- `e2e` - Run E2E tests
- `e2e:ui` - Run E2E tests with UI
- `e2e:debug` - Debug E2E tests
- A specific file path or pattern

## Instructions

1. Parse the arguments to determine which test mode to run
2. Execute the appropriate npm script:
   - No args or filename: `npm test` (optionally with filename)
   - `watch`: `npm run test:watch`
   - `coverage`: `npm run test:coverage`
   - `e2e`: `npm run test:e2e`
   - `e2e:ui`: `npm run test:e2e:ui`
   - `e2e:debug`: `npm run test:e2e:debug`
3. Display test results
4. If tests fail, offer to:
   - Show the failing test file
   - Help fix the failing tests
   - Run specific tests in isolation

## Error Handling

- If tests fail, show clear error messages
- Highlight which tests failed and why
- Offer actionable next steps
