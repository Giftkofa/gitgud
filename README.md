# GitGud

Keep your coding skills sharp while using AI. A Claude Code plugin that periodically assigns manual coding challenges with gamification features.

## Why GitGud?

AI assistants like Claude Code make us incredibly productive, but there's a risk: if we never write code ourselves, our skills atrophy. GitGud ensures you practice regularly while still benefiting from AI assistance.

## Features

- **Periodic Challenges**: Every N requests, you'll get a coding task related to your current work
- **Smart Categorization**: Tasks match your context (API, auth, testing, database, etc.)
- **Gamification**:
  - **Streaks**: Track consecutive days of completed tasks
  - **Achievements**: Unlock badges as you progress
  - **Skip System**: Skip tasks when you're in a hurry (limited per day)
- **Persistent Progress**: Your data is stored in `~/.gitgud/` and persists across plugin updates
- **Fully Configurable**: Adjust frequency, difficulty, and daily skips

## Installation

### From GitHub (recommended)

```bash
/plugin marketplace add MissingPackage/gitgud
/plugin install gitgud
```

### From local folder (for development)

```bash
claude --plugin-dir /path/to/gitgud
```

## Commands

| Command | Description |
|---------|-------------|
| `/gg-complete` | Mark current task as completed |
| `/gg-stats` | View statistics, achievements, and streak |
| `/gg-reset [counter\|stats\|all]` | Reset data |
| `/gg-config` | View current configuration |
| `/gg-config <setting> <value>` | Change a setting |

## How It Works

1. Every N requests (default: 10), you'll receive a coding challenge
2. The task is **related but not identical** to your request
3. Claude guides you but won't write the code for you
4. Complete the task and run `/gg-complete` to update your stats
5. Or type "skip" to use a skip (limited per day)

## Task Categories

Tasks are automatically matched to your work context:

| Category | Triggered by |
|----------|--------------|
| Security | auth, login, password, jwt, token, oauth |
| API | endpoint, route, request, response, http, graphql |
| Database | query, sql, model, schema, migration, orm |
| Debug | bug, fix, error, problem, crash, issue |
| Test | test, spec, assert, pytest, jest, mock |
| Architecture | refactor, pattern, structure, interface |
| Frontend | component, react, vue, css, form, modal |
| Function | implement, create, add, write, build |

## Configuration

```bash
/gg-config                      # View current configuration
/gg-config frequency 15         # Set task frequency to every 15 requests
/gg-config daily_skips 5        # Allow 5 skips per day
/gg-config difficulty hard      # Set difficulty to hard
/gg-config enabled false        # Disable the plugin
```

### Settings

| Setting | Description | Options | Default |
|---------|-------------|---------|---------|
| `frequency` | Requests between tasks | Any number | 10 |
| `daily_skips` | Max skips per day | Any number | 3 |
| `difficulty` | Task complexity | easy, medium, hard, adaptive | adaptive |
| `enabled` | Plugin active | true, false | true |

## Data Storage

Your progress is stored in `~/.gitgud/` (cross-platform):
- **Windows**: `C:\Users\<username>\.gitgud\`
- **macOS**: `/Users/<username>/.gitgud/`
- **Linux**: `/home/<username>/.gitgud/`

This ensures your achievements and streaks persist even when updating the plugin.

## Achievements

### Task Milestones
- 🎯 **First Steps** - Complete your first task
- ✋ **Getting Hands Dirty** - Complete 5 tasks
- 📚 **Apprentice** - Complete 10 tasks
- 🔨 **Craftsman** - Complete 25 tasks
- 🎓 **Master** - Complete 50 tasks
- 🏆 **Legend** - Complete 100 tasks

### Streak Achievements
- 🔥 **Three in a Row** - 3 day streak
- 📅 **Perfect Week** - 7 day streak
- 💪 **Two Weeks Strong** - 14 day streak
- 🥇 **Golden Month** - 30 day streak

## Tips for Success

1. **Don't skip too often** - The challenges are designed to keep your skills sharp
2. **Take your time** - Quality practice beats rushing through tasks
3. **Use hints wisely** - Ask Claude for conceptual help, but write the code yourself
4. **Build a streak** - Consistency is key to maintaining skills

## License

MIT
