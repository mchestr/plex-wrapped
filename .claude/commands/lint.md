---
description: Run ESLint to check code quality and style
allowed-tools: [Bash, Read, Edit]
model: haiku
---

# Linter

Run ESLint to check code quality, style, and catch common issues.

## Usage

- `/lint` - Run ESLint on entire codebase
- `/lint [path]` - Run ESLint on specific file or directory
- `/lint fix` - Run ESLint and automatically fix issues

## Arguments

$ARGUMENTS can specify:
- `fix` - Automatically fix linting issues where possible
- A specific file path or directory to lint

## Instructions

1. Parse arguments to determine lint mode
2. Execute the appropriate command:
   - No args: `npm run lint`
   - `fix`: `npm run lint -- --fix`
   - Specific path: `npm run lint -- [path]`
   - Path with fix: `npm run lint -- --fix [path]`
3. Display linting results
4. If linting errors found:
   - Show clear descriptions of issues
   - Indicate which can be auto-fixed
   - Offer to fix issues that require manual intervention

## Error Handling

- Parse ESLint output to show errors clearly
- Group errors by file
- Prioritize errors over warnings
- Offer to fix critical issues first
