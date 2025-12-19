#!/usr/bin/env node
/**
 * Complete statistics for GitGud
 */

const fs = require('fs');
const path = require('path');

// Paths
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.dirname(__dirname);
const DATA_DIR = path.join(PLUGIN_ROOT, 'data');
const CONFIG_FILE = path.join(PLUGIN_ROOT, 'config.json');

// State files
const COUNTER_FILE = path.join(DATA_DIR, '.request_counter');
const HISTORY_FILE = path.join(DATA_DIR, 'task_history.jsonl');
const STREAK_FILE = path.join(DATA_DIR, '.streak_data');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, '.achievements');
const STATS_FILE = path.join(DATA_DIR, '.stats');
const SKIPS_FILE = path.join(DATA_DIR, '.daily_skips');

// Read config
function readConfig() {
    const defaults = { frequency: 10, daily_skips: 3, difficulty: 'adaptive' };
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return { ...defaults, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
        }
    } catch (e) {}
    return defaults;
}

// Read file safely
function readFile(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8').trim();
        }
    } catch (e) {}
    return defaultValue;
}

// Read JSON file safely
function readJsonFile(filePath, defaultValue) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {}
    return defaultValue;
}

// Achievement names
const ACHIEVEMENT_NAMES = {
    first_task: '🎯 Primo Passo',
    five_tasks: '✋ Mani in Pasta',
    ten_tasks: '📚 Praticante',
    twentyfive_tasks: '🔨 Artigiano',
    fifty_tasks: '🎓 Maestro',
    hundred_tasks: '🏆 Leggenda',
    streak_3: '🔥 Tre di Fila',
    streak_7: '📅 Settimana Perfetta',
    streak_14: '💪 Due Settimane',
    streak_30: "🥇 Mese d'Oro"
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
    console.log('║                              🎮 GITGUD STATS                                  ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                              ║');
    console.log('║  📈 ATTIVITÀ                                                                 ║');
    console.log(`║     Richieste totali:      ${String(currentCount).padEnd(10)}                                       ║`);
    console.log(`║     Prossimo task tra:     ${(nextTask + ' richieste').padEnd(10)}                                       ║`);
    console.log(`║     Frequenza task:        ogni ${String(TRIGGER_EVERY).padEnd(5)} richieste                            ║`);
    console.log('║                                                                              ║');
    console.log('║  🔥 STREAK                                                                   ║');
    console.log(`║     Streak attuale:        ${(currentStreak + ' giorni').padEnd(10)}                                       ║`);
    console.log(`║     Record personale:      ${(bestStreak + ' giorni').padEnd(10)}                                       ║`);
    console.log('║                                                                              ║');
    console.log('║  📊 TASK                                                                     ║');
    console.log(`║     Completati:            ${String(completed).padEnd(10)}                                       ║`);
    console.log(`║     Saltati:               ${String(skipped).padEnd(10)}                                       ║`);
    console.log(`║     Tasso completamento:   ${(completionRate + '%').padEnd(10)}                                       ║`);
    console.log('║                                                                              ║');
    console.log('║  ⚙️  CONFIG                                                                   ║');
    console.log(`║     Difficoltà:            ${DIFFICULTY.padEnd(10)}                                       ║`);
    console.log(`║     Jolly oggi:            ${(remainingSkips + '/' + MAX_DAILY_SKIPS).padEnd(10)}                                       ║`);
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
        console.log('║     Nessun achievement ancora... continua così!                              ║');
    }

    console.log('║                                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════════════════════╣');

    // Last tasks
    console.log('║  📋 ULTIMI 5 TASK                                                            ║');
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
                    const category = (entry.category || '?').padEnd(12);
                    const timestamp = (entry.timestamp || '?').substring(0, 10);
                    const info = `${event} | ${category} | ${timestamp}`;
                    console.log(`║     ${info.padEnd(60)}             ║`);
                } catch (e) {}
            });
        } else {
            console.log('║     Nessun task ancora...                                                    ║');
        }
    } else {
        console.log('║     Nessun task ancora...                                                    ║');
    }

    console.log('║                                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
}

main();
