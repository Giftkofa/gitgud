# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-19

### Added
- Initial release of GitGud
- UserPromptSubmit hook for task assignment
- 9 task categories with smart matching (security, api, database, debug, test, architecture, frontend, function, general)
- Gamification system:
  - Daily streaks with personal records
  - 10 unlockable achievements
  - Skip system with daily limits
- Configurable settings:
  - Task frequency
  - Daily skip limit
  - Difficulty level (easy/medium/hard/adaptive)
  - Enable/disable toggle
- Slash commands:
  - `/gg-complete` - Mark task as completed
  - `/gg-stats` - View statistics dashboard
  - `/gg-reset` - Reset counter/stats/all
  - `/gg-config` - View/change configuration
- Full statistics dashboard with history
