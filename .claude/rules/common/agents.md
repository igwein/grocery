# Agent Orchestration

## Available Agents

Located in `.claude/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| tdd-guide | Test-driven development | New features, bug fixes |
| code-reviewer | Code review | After writing code |
| security-reviewer | Security analysis | Before commits |
| python-reviewer | Python code review | Python-specific review |
| database-reviewer | Database review | Schema/query changes |

## Parallel Task Execution

Use parallel Task execution for independent operations when possible:

```markdown
# GOOD: Parallel execution
Launch 2 agents in parallel:
1. Agent 1: Security analysis
2. Agent 2: Code quality review

# BAD: Sequential when unnecessary
First agent 1, then agent 2
```
