---
description: Pull a PR, rebase on main, address comments, and push changes
arguments: "[pr-number]"
tags:
  - project
---

You are tasked with updating a pull request by rebasing it and addressing review comments. Follow these steps:

1. **Fetch the PR details** using the `gh` CLI:
   - Use `gh pr view <pr-number> --json number,title,body,state,headRefName,reviews,comments`
   - Parse the JSON response to extract PR info and review feedback
   - Also run `gh pr diff <pr-number>` to see the changes

2. **Check for review comments**:
   - Use `gh api repos/{owner}/{repo}/pulls/<pr-number>/comments` to get inline code review comments
   - Look for any change requests or suggestions in the reviews
   - Identify specific action items that need to be addressed

3. **Checkout and update the PR branch**:
   - Run `git fetch origin` to get latest changes
   - Checkout the PR branch: `git checkout <headRefName>`
   - Verify current branch with `git branch --show-current`

4. **Rebase on main**:
   - Run `git rebase origin/main`
   - If conflicts occur, resolve them carefully:
     - Use `git status` to see conflicted files
     - Read conflicted files and resolve conflicts
     - Stage resolved files with `git add <file>`
     - Continue rebase with `git rebase --continue`
   - If rebase fails and you can't resolve it, inform the user

5. **Create implementation plan for addressing comments**:
   - Use the TodoWrite tool to track tasks for addressing review comments
   - Include specific tasks for each requested change
   - Add verification tasks (tests, build, lint)

6. **Address review comments**:
   - Implement each requested change from the review
   - Follow project conventions from CLAUDE.md
   - Mark todos as in_progress/completed as you work
   - Ensure changes align with the reviewer's feedback

7. **Verify changes**:
   - Run relevant tests: `npm test` or specific test files
   - Run build: `npm run build`
   - Run lint: `npm run lint`
   - Ensure all checks pass

8. **Push updated branch**:
   - Push with force-with-lease to preserve history safely: `git push origin <branch-name> --force-with-lease`
   - Verify push was successful

9. **Provide summary**:
   - Summarize what review comments were addressed
   - Confirm the PR is rebased on latest main
   - List any verification steps completed
   - Note if there are any remaining issues or blockers

**Important Notes**:
- If the PR number is not provided as an argument, ask the user for it
- If the PR cannot be found or is already merged, inform the user
- If there are no review comments requesting changes, note that and just rebase/push
- If review comments are unclear, ask the user for clarification
- Use `--force-with-lease` instead of `--force` to prevent accidentally overwriting remote changes
- Never skip or ignore requested changes from reviewers
- If a review comment suggests something for "future consideration" or "separate PR", you can skip it unless the user specifically asks to implement it
- Always verify the PR is in a good state after pushing (tests pass, builds successfully)
