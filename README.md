# Agentic Workflow

A multi-agent software development system for [opencode](https://opencode.ai), using specialized agents to orchestrate planning, implementation, review, and testing with strict approval gates.

## Structure

```
├── agents/          # Agent definitions (markdown with frontmatter)
│   ├── orchestrator.md   # Central coordinator - routes tasks, enforces workflow
│   ├── planner.md        # Creates structured implementation plans
│   ├── implementer.md    # Executes approved plans into production code
│   ├── reviewer.md       # Audits code quality and correctness
│   ├── tester.md         # Validates functionality against acceptance criteria
│   └── memory-curator.md # Evaluates architectural significance for MEMORY.md
├── commands/        # Custom slash commands
│   └── glab-mr.md    # GitLab MR creation with approval workflow
└── scripts/         # Setup utilities
    ├── link-agents.js     # Symlinks agents to ~/.config/opencode/agents
    └── link-commands.js   # Symlinks commands to ~/.config/opencode/commands
```

## Workflow

```
User Request
    ↓
Orchestrator → Explore Agent (context gathering)
    ↓
Planner (creates plan with TICKET-ID)
    ↓
User Approval (REQUIRED)
    ↓
Plan saved to docs/plans/TICKET-ID.md
    ↓
Implementer (writes code per approved plan)
    ↓
├─ Reviewer (audits quality)
└─ Memory Curator (assesses architectural impact)
    ↓
Tester (validates functionality)
    ↓
User Approval (REQUIRED)
    ↓
Merge / PR
```

## Setup

```bash
# Link agents and commands to opencode config
node scripts/link-agents.js
node scripts/link-commands.js
```

## Agent Modes

| Agent | Mode | Role |
|-------|------|------|
| Orchestrator | `primary` | Entry point, receives all requests |
| Planner | `subagent` | Analyzes requirements, creates plans |
| Implementer | `subagent` | Executes approved plans |
| Reviewer | `subagent` | Code audit and quality checks |
| Tester | `subagent` | Functional validation |
| Memory Curator | `subagent` | Architectural memory management |

## Key Principles

- **Approval gates**: No implementation without explicit user approval; no merge without final sign-off
- **Plan as source of truth**: Once approved, `docs/plans/TICKET-ID.md` is the contract for all downstream agents
- **Separation of concerns**: Orchestrator coordinates; specialists execute; no agent oversteps its role
- **Parallel execution**: Reviewer and Memory Curator run simultaneously when possible
- **Trivial change optimization**: Small fixes (typos, renames) can skip Planner and Memory Curator with single-pass approval

## Commands

- `/glab-mr` — Create a GitLab Merge Request with proper title, detailed summary, and explicit user approval before creation.
