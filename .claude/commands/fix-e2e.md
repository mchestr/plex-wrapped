---
description: Automatically fix failing Playwright E2E tests with screenshots and traces
allowed-tools: [Bash, Read, Edit, Write, TodoWrite]
model: sonnet
---

# Playwright Test Fixer Agent

Automated E2E test repair workflow that systematically fixes failing Playwright tests with visual debugging.

## Usage

- `/fix-e2e` - Fix all failing E2E tests
- `/fix-e2e [spec]` - Fix specific test spec file
- `/fix-e2e [browser]` - Fix tests for specific browser (chromium, firefox, webkit)

## Workflow

This command runs an automated agent that:

1. **Discovery Phase**
   - Run Playwright test suite: `npm run test:e2e`
   - Capture failures with screenshots and traces
   - Create todo list tracking all failing tests
   - Note browser-specific failures

2. **Analysis Phase**
   For each failing test:
   - Read test file to understand test flow
   - Examine error message and stack trace
   - Check for screenshots in `test-results/` directory
   - Identify failure type (selector, timing, assertion, etc.)

3. **Fix Phase** (Iterative)
   For each failing test:
   - Mark as "in_progress" in todo list
   - Apply appropriate fix based on failure type
   - Verify fix by running specific test: `npm run test:e2e -- [spec-file]`
   - If test passes:
     - Mark as "completed"
     - Move to next test
   - If test fails:
     - Try alternative fix
     - Maximum 2 retry attempts

4. **Verification Phase**
   - Run full E2E suite: `npm run test:e2e`
   - Confirm no regressions
   - Test across all browsers if needed

5. **Documentation Phase**
   - Summary of fixes applied
   - Tests requiring manual intervention
   - Browser-specific issues noted

## Fix Strategies

### Common E2E Failures

**Selector Issues** (Most Common):
- ❌ **WRONG**: Using CSS classes or text content as selectors
- ✅ **CORRECT**: Add `data-testid` attributes and use `getByTestId()`
- Example fix:
  ```typescript
  // Before (fragile)
  await page.locator('.submit-button').click()

  // After (stable)
  await page.getByTestId('submit-button').click()

  // Component update needed
  <button data-testid="submit-button">Submit</button>
  ```

**Timing Issues**:
- Element not ready when selector runs
- Network requests not completed
- Animations not finished
- Fix: Use proper waiting strategies (`waitForSelector`, `waitForLoadState`)

**Navigation Issues**:
- Page didn't navigate as expected
- URL doesn't match expected pattern
- Fix: Add explicit navigation waits

**Assertion Failures**:
- Content changed but test expectations didn't
- Element state different than expected
- Fix: Update assertions to match current behavior

**Authentication Issues**:
- Shared authentication state not loaded
- Session expired during test
- Fix: Check setup project configuration

### Approach

1. **⚠️ CRITICAL**: Always use `data-testid` selectors (follows project conventions)
2. **Read Component**: Find and read the component being tested
3. **Add Test IDs**: If missing, add `data-testid` attributes to components
4. **Update Selectors**: Replace fragile selectors with `getByTestId()`
5. **Wait Appropriately**: Add waits for dynamic content
6. **Test Immediately**: Run specific spec after each fix

## Test ID Naming Convention

When adding test IDs:
- Use descriptive, stable names: `data-testid="sonarr-series-add-button"`
- Follow pattern: `[feature]-[component]-[action]`
- Don't use dynamic values or random suffixes
- Keep them semantic and maintainable

## Browser-Specific Handling

- Note which browsers fail for each test
- Apply browser-specific fixes if needed
- Ensure cross-browser compatibility
- Use conditional logic sparingly

## Output

Maintains todo list showing:
- ✅ Tests fixed successfully
- 🔄 Test currently being fixed
- ⏳ Tests pending
- ❌ Tests needing manual review
- 🌐 Browser-specific issues

Final report:
- Total tests fixed
- Components updated (with data-testid additions)
- Browser-specific issues
- Tests requiring manual review
- Screenshots/traces location for manual debugging

## Arguments

$ARGUMENTS can specify:
- Specific spec file to fix
- Browser name (chromium, firefox, webkit)
- If not specified, fixes all failing tests

## Debugging Assets

The agent can:
- Read screenshots from `test-results/`
- Reference Playwright traces
- Suggest running with `--debug` for complex failures

## Error Handling

- If test can't be fixed after 2 attempts, mark for manual review
- Preserve screenshots and traces for manual debugging
- Note if issue is environment-specific (needs different configuration)

## Safety

- Ensures `data-testid` attributes follow project conventions
- Doesn't modify test logic unnecessarily
- Creates clear audit trail of selector changes
- Runs full suite to catch regressions
