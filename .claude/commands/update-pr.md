---
description: Pull a PR, rebase on main, address comments, and push changes
arguments: "[pr-number]"
tags:
  - project
---

You are tasked with updating a pull request by rebasing it and addressing review comments. Follow these steps:

1. **Start from a clean main branch**:
   - Stash any local changes: `git stash --include-untracked` (if there are changes)
   - Checkout main branch: `git checkout main`
   - Fetch latest from origin: `git fetch origin`
   - Reset main to match origin: `git reset --hard origin/main`
   - Verify main is up to date: `git log -1 --oneline` and compare with `git log -1 --oneline origin/main`

2. **Fetch the PR details** using the `gh` CLI:
   - Use `gh pr view <pr-number> --json number,title,body,state,headRefName,reviews,comments`
   - Parse the JSON response to extract PR info and review feedback
   - Also run `gh pr diff <pr-number>` to see the changes

3. **Check for review comments**:
   - Use `gh api repos/{owner}/{repo}/pulls/<pr-number>/comments` to get inline code review comments
   - Look for any change requests or suggestions in the reviews
   - Identify specific action items that need to be addressed

4. **Checkout and update the PR branch**:
   - Checkout the PR branch: `git checkout <headRefName>`
   - Verify current branch with `git branch --show-current`

5. **Rebase on main**:
   - Run `git rebase origin/main`
   - If conflicts occur, resolve them carefully:
     - Use `git status` to see conflicted files
     - Read conflicted files and resolve conflicts
     - Stage resolved files with `git add <file>`
     - Continue rebase with `git rebase --continue`
   - If rebase fails and you can't resolve it, inform the user

6. **Create implementation plan for addressing comments**:
   - Use the TodoWrite tool to track tasks for addressing review comments
   - Include specific tasks for each requested change
   - Add verification tasks (tests, build, lint)

7. **Address review comments**:
   - Implement each requested change from the review
   - Follow project conventions from CLAUDE.md
   - Mark todos as in_progress/completed as you work
   - Ensure changes align with the reviewer's feedback

8. **Verify changes**:
   - Run relevant tests: `npm test` or specific test files
   - Run build: `npm run build`
   - Run lint: `npm run lint`
   - Ensure all checks pass

9. **Commit and push updated branch**:
   - Stage all changes: `git add -A`
   - Create a descriptive commit message summarizing the review feedback addressed
   - Commit changes: `git commit -m "address PR review feedback: <summary of changes>"`
   - Push with force-with-lease to preserve history safely: `git push origin <branch-name> --force-with-lease`
   - Verify push was successful

10. **Create GitHub issue for follow-up tasks** (if applicable):
   - Review all comments from the code review
   - Identify any items marked as:
     - "Optional but recommended"
     - "Future consideration"
     - "Separate PR"
     - "Out of scope for this PR"
     - Or any suggestions that weren't implemented in this update
   - If there are follow-up tasks, create a GitHub issue using `gh issue create`:
     - Title format: "Follow-up: [Brief description] (from PR #<number>)"
     - Body should include:
       - Reference to the original PR: "Follow-up tasks from PR #<number>"
       - List of specific tasks to be addressed
       - Context from the review comments (quote relevant parts)
       - Link back to the PR for context
     - Use appropriate labels (e.g., "enhancement", "refactor", "technical-debt")
     - Example command:
       ```bash
       gh issue create --title "Follow-up: Extract duplicate utilities (from PR #47)" --body "$(cat <<'EOF'
       Follow-up tasks from PR #47

       ## Tasks
       - [ ] Extract duplicate formatting functions (formatFileSize, formatDate, getMediaTypeLabel) to lib/utils/formatters.ts
       - [ ] Create shared Icon component library or use lucide-react/heroicons
       - [ ] Move MaintenanceCandidate type to types/maintenance.ts
       - [ ] Add unit tests for extracted components

       ## Context
       From code review on PR #47:
       > Functions like formatFileSize, formatDate, getMediaTypeLabel appear in multiple files. Consider extracting to lib/utils/formatters.ts for reuse.

       See PR #47 for full context: #47
       EOF
       )" --label enhancement,technical-debt
       ```
   - Report the issue number to the user after creation

11. **Provide summary**:
   - Summarize what review comments were addressed
   - Confirm the PR is rebased on latest main
   - List any verification steps completed
   - Note if there are any remaining issues or blockers
   - Include link to follow-up issue if one was created

**Important Notes**:
- If the PR number is not provided as an argument, ask the user for it
- If the PR cannot be found or is already merged, inform the user
- If there are no review comments requesting changes, note that and just rebase/push
- If review comments are unclear, ask the user for clarification
- Use `--force-with-lease` instead of `--force` to prevent accidentally overwriting remote changes
- Never skip or ignore requested changes from reviewers
- If a review comment suggests something for "future consideration" or "separate PR", you can skip it unless the user specifically asks to implement it
- Always verify the PR is in a good state after pushing (tests pass, builds successfully)
- Only create a follow-up issue if there are actual follow-up tasks identified from the review
