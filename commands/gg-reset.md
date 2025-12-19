---
description: Reset GitGud counter, stats, or all data
allowed_args:
  - counter
  - stats
  - all
---

# Reset Tool

Reset various GitGud data:

- `counter` - Reset only the request counter
- `stats` - Reset statistics (keeps achievements)
- `all` - Reset everything (counter, stats, achievements, streak)

$EXEC: node ${CLAUDE_PLUGIN_ROOT}/scripts/reset.js $ARGS
