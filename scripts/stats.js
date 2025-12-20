#!/usr/bin/env node
/**
 * Statistics display for GitGud
 */

const fs = require('fs');
const {
    COUNTER_FILE,
    STREAK_FILE,
    ACHIEVEMENTS_FILE,
    STATS_FILE,
    SKIPS_FILE,
    HISTORY_FILE,
    readFile,
    readJsonFile,
    readConfig
} = require('./paths');

// Achievement names (English)
const ACHIEVEMENT_NAMES = {
    first_task: '🎯 First Steps',
    five_tasks: '✋ Getting Hands Dirty',
    ten_tasks: '📚 Apprentice',
    twentyfive_tasks: '🔨 Craftsman',
    fifty_tasks: '🎓 Master',
    hundred_tasks: '🏆 Legend',
    streak_3: '🔥 Three in a Row',
    streak_7: '📅 Perfect Week',
    streak_14: '💪 Two Weeks Strong',
    streak_30: '🥇 Golden Month'
};

function main() {
    const config = readConfig();
    const TRIGGER_EVERY = config.frequency;
    const MAX_DAILY_SKIPS = config.daily_skips;
    const DIFFICULTY = config.difficulty;

    const currentCount = parseInt(readFile(COUNTER_FILE, '0'));
    const nextTask = TRIGGER_EVERY - (currentCount % TRIGGER_EVERY);
    const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
    const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

    // Streak
    let currentStreak = 0;
    let bestStreak = 0;
    const streakData = readFile(STREAK_FILE, '');
    if (streakData) {
        const lines = streakData.split('\n');
        currentStreak = parseInt(lines[0]) || 0;
        bestStreak = parseInt(lines[2]) || 0;
    }

    // Stats
    const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
    const completed = stats.completed || 0;
    const skipped = stats.skipped || 0;
    const total = stats.total_assigned || 0;
    const completionRate = total > 0 ? Math.round((completed * 100) / total) : 0;

    // Output
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              🎮 GITGUD STATS                                 ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                              ║');
    console.log('║  📈 ACTIVITY                                                                 ║');
    console.log(`║     Total requests:        ${String(currentCount).padEnd(10)}                                       ║`);
    console.log(`║     Next task in:          ${(nextTask + ' requests').padEnd(15)}                                  ║`);
    console.log(`║     Task frequency:        every ${String(TRIGGER_EVERY).padEnd(5)} requests                            ║`);
    console.log('║                                                                              ║');
    console.log('║  🔥 STREAK                                                                   ║');
    console.log(`║     Current streak:        ${(currentStreak + ' days').padEnd(10)}                                       ║`);
    console.log(`║     Personal best:         ${(bestStreak + ' days').padEnd(10)}                                       ║`);
    console.log('║                                                                              ║');
    console.log('║  📊 TASKS                                                                    ║');
    console.log(`║     Completed:             ${String(completed).padEnd(10)}                                       ║`);
    console.log(`║     Skipped:               ${String(skipped).padEnd(10)}                                       ║`);
    console.log(`║     Completion rate:       ${(completionRate + '%').padEnd(10)}                                       ║`);
    console.log('║                                                                              ║');
    console.log('║  ⚙️  CONFIG                                                                   ║');
    console.log(`║     Difficulty:            ${DIFFICULTY.padEnd(10)}                                       ║`);
    console.log(`║     Skips today:           ${(remainingSkips + '/' + MAX_DAILY_SKIPS + ' remaining').padEnd(15)}                                  ║`);
    console.log('║                                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

    // Achievements
    console.log('║  🏆 ACHIEVEMENTS                                                             ║');
    console.log('║                                                                              ║');

    const achievements = readJsonFile(ACHIEVEMENTS_FILE, []);
    if (achievements.length > 0) {
        achievements.forEach(id => {
            const name = ACHIEVEMENT_NAMES[id] || id;
            console.log(`║     ${name.padEnd(50)}                   ║`);
        });
    } else {
        console.log('║     No achievements yet... keep going!                                       ║');
    }

    console.log('║                                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

    // Last tasks
    console.log('║  📋 LAST 5 TASKS                                                             ║');
    console.log('║                                                                              ║');

    if (fs.existsSync(HISTORY_FILE)) {
        const historyContent = readFile(HISTORY_FILE, '');
        if (historyContent) {
            const lines = historyContent.split('\n').filter(l => l.trim());
            const lastFive = lines.slice(-5);

            lastFive.forEach(line => {
                try {
                    const entry = JSON.parse(line);
                    const event = (entry.event || 'assigned').padEnd(10);
                    const category = (entry.category || '-').padEnd(12);
                    const timestamp = (entry.timestamp || '?').substring(0, 10);
                    const info = `${event} | ${category} | ${timestamp}`;
                    console.log(`║     ${info.padEnd(60)}             ║`);
                } catch (e) {}
            });
        } else {
            console.log('║     No tasks yet...                                                          ║');
        }
    } else {
        console.log('║     No tasks yet...                                                          ║');
    }

    console.log('║                                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
}

main();
