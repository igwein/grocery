# Git Workflow

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Pull Request Workflow

When creating PRs:
1. Analyze full commit history (not just latest commit)
2. Use `git diff [base-branch]...HEAD` to see all changes
3. Draft comprehensive PR summary
4. Push with `-u` flag if new branch

## Feature Implementation Workflow

1. **Plan First**
   - Identify dependencies and risks
   - Break down into phases

2. **Implement**
   - Write clean, well-structured code
   - Follow project conventions from CLAUDE.md

3. **Code Review**
   - Use **code-reviewer** agent after writing code
   - Address CRITICAL and HIGH issues

4. **Commit & Push**
   - Detailed commit messages
   - Follow conventional commits format
