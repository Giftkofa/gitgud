# GitGud

Keep your coding skills sharp while using AI. A Claude Code plugin that periodically assigns manual coding challenges with gamification features.

## Why GitGud?

AI assistants like Claude Code make us incredibly productive, but there's a risk: if we never write code ourselves, our skills atrophy. GitGud ensures you practice regularly while still benefiting from AI assistance.

## Features

- **Periodic Challenges**: Every N requests, you'll get a coding task related to your current work
- **Smart Categorization**: Tasks match your context (API, auth, testing, etc.)
- **Gamification**:
  - **Streaks**: Track consecutive days of completed tasks
  - **Achievements**: Unlock badges as you progress
  - **Skip System**: Skip tasks when you're in a hurry (limited per day)
- **Fully Configurable**: Adjust frequency, difficulty, and daily skips

## Installation

From GitHub:
```bash
/plugin install github:MissingPackage/gitgud
```

From local folder:
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
5. Or say "skip" to use a skip (limited per day)

## Task Categories

Tasks are automatically matched to your work context:

| Category | Triggered by |
|----------|--------------|
| Security | auth, login, password, jwt, token |
| API | endpoint, route, request, response, http |
| Database | query, sql, model, schema, migration |
| Debug | bug, fix, error, problem, crash |
| Test | test, spec, assert, pytest, jest |
| Architecture | refactor, pattern, structure |
| Frontend | component, react, vue, css, form |
| Function | implement, create, add, write |

## Configuration

```bash
/gg-config                      # View current configuration
/gg-config frequency 15         # Set task frequency to every 15 requests
/gg-config daily_skips 5        # Allow 5 skips per day
/gg-config difficulty hard      # Set difficulty to hard
/gg-config enabled false        # Disable the plugin
```

Or edit `config.json` directly:

```json
{
  "frequency": 10,
  "daily_skips": 3,
  "difficulty": "adaptive",
  "enabled": true
}
```

### Settings

| Setting | Description | Options | Default |
|---------|-------------|---------|---------|
| `frequency` | Requests between tasks | Any number | 10 |
| `daily_skips` | Max skips per day | Any number | 3 |
| `difficulty` | Task complexity | easy, medium, hard, adaptive | adaptive |
| `enabled` | Plugin active | true, false | true |

## Achievements

### Task Milestones
- 🎯 **Primo Passo** - Complete your first task
- ✋ **Mani in Pasta** - Complete 5 tasks
- 📚 **Praticante** - Complete 10 tasks
- 🔨 **Artigiano** - Complete 25 tasks
- 🎓 **Maestro** - Complete 50 tasks
- 🏆 **Leggenda** - Complete 100 tasks

### Streak Achievements
- 🔥 **Tre di Fila** - 3 day streak
- 📅 **Settimana Perfetta** - 7 day streak
- 💪 **Due Settimane** - 14 day streak
- 🥇 **Mese d'Oro** - 30 day streak

## License

MIT
