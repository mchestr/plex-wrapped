---
description: Review code for quality, bugs, and best practices
allowed-tools: [Read, Grep, Glob, Bash]
model: sonnet
---

# Code Reviewer

Perform a thorough code review focusing on quality, bugs, security, and adherence to project conventions.

## Usage

- `/review` - Review recent git changes (uncommitted + last commit)
- `/review [file]` - Review specific file
- `/review [directory]` - Review all files in directory
- `/review staged` - Review only staged changes
- `/review full` - Full codebase review (use sparingly)

## Arguments

$ARGUMENTS can specify:
- A specific file path to review
- A directory to review
- `staged` - Review only staged git changes
- `full` - Review entire codebase (comprehensive, takes time)

## Review Checklist

### Code Quality
- [ ] Follows project conventions (see CLAUDE.md)
- [ ] Components follow Single Responsibility Principle
- [ ] File sizes are reasonable (<200-300 lines for components)
- [ ] No code duplication
- [ ] Proper error handling
- [ ] Meaningful variable/function names

### TypeScript
- [ ] No `any` types (use proper typing or `unknown` + guards)
- [ ] No unused variables or imports
- [ ] Strict mode compliance
- [ ] Proper type inference used

### React Best Practices
- [ ] Server Components used by default
- [ ] `'use client'` only when necessary
- [ ] Proper hooks usage (no violations of rules of hooks)
- [ ] No prop drilling (use composition or context)
- [ ] Proper key props in lists

### Security
- [ ] Input validation with Zod
- [ ] No SQL injection risks (using Prisma properly)
- [ ] No XSS vulnerabilities
- [ ] Proper authentication checks
- [ ] Sensitive data not logged or exposed

### Testing
- [ ] E2E tests use `data-testid` selectors
- [ ] Critical paths have test coverage
- [ ] Tests are clear and maintainable

### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists use pagination/virtualization
- [ ] Images optimized
- [ ] No blocking operations on main thread

### Accessibility
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

## Instructions

1. Determine scope based on arguments
2. Read relevant files
3. Check each item in the review checklist
4. Report findings in order of severity:
   - **Critical**: Security issues, bugs that break functionality
   - **Important**: Performance problems, maintainability issues
   - **Suggestions**: Improvements, optimizations, style preferences
5. For each issue found:
   - Explain the problem clearly
   - Reference the file and line number
   - Provide a specific fix or recommendation
   - Note if it violates project conventions from CLAUDE.md
6. Provide a summary:
   - Total issues found by severity
   - Overall code quality assessment
   - Priority fixes to address first

## Output Format

**Code Review Summary**

**Critical Issues** (must fix):
- [file:line] Description and recommended fix

**Important Issues** (should fix):
- [file:line] Description and recommended fix

**Suggestions** (nice to have):
- [file:line] Description and recommended fix

**Overall Assessment**: [Brief summary of code quality]

**Next Steps**: [Prioritized list of what to fix first]
