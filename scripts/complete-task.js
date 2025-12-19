#!/usr/bin/env node
/**
 * Script to mark a task as completed
 * Handles streaks and achievements
 */

const fs = require('fs');
const path = require('path');

// Paths
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.dirname(__dirname);
const DATA_DIR = path.join(PLUGIN_ROOT, 'data');
const CONFIG_FILE = path.join(PLUGIN_ROOT, 'config.json');

// State files
const COUNTER_FILE = path.join(DATA_DIR, '.request_counter');
const PENDING_TASK_FILE = path.join(DATA_DIR, '.pending_task');
const SKIPS_FILE = path.join(DATA_DIR, '.daily_skips');
const STREAK_FILE = path.join(DATA_DIR, '.streak_data');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, '.achievements');
const STATS_FILE = path.join(DATA_DIR, '.stats');
const HISTORY_FILE = path.join(DATA_DIR, 'task_history.jsonl');

// Read config
function readConfig() {
    const defaults = { frequency: 10, daily_skips: 3 };
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

// Write file
function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
}

// Get today's date
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Get yesterday's date
function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// Achievement definitions
const ACHIEVEMENT_NAMES = {
    first_task: { emoji: '🎯', name: 'Primo Passo' },
    five_tasks: { emoji: '✋', name: 'Mani in Pasta' },
    ten_tasks: { emoji: '📚', name: 'Praticante' },
    twentyfive_tasks: { emoji: '🔨', name: 'Artigiano' },
    fifty_tasks: { emoji: '🎓', name: 'Maestro' },
    hundred_tasks: { emoji: '🏆', name: 'Leggenda' },
    streak_3: { emoji: '🔥', name: 'Tre di Fila' },
    streak_7: { emoji: '📅', name: 'Settimana Perfetta' },
    streak_14: { emoji: '💪', name: 'Due Settimane' },
    streak_30: { emoji: '🥇', name: "Mese d'Oro" }
};

function main() {
    // Check if there's a pending task
    if (!fs.existsSync(PENDING_TASK_FILE)) {
        console.log('ℹ️  Nessun task pendente da completare.');
        return;
    }

    const config = readConfig();
    const TRIGGER_EVERY = config.frequency;
    const MAX_DAILY_SKIPS = config.daily_skips;

    // ============================================
    // UPDATE STREAK
    // ============================================
    const today = getToday();
    const yesterday = getYesterday();

    let currentStreak = 0;
    let lastCompletionDate = '';
    let bestStreak = 0;

    const streakData = readFile(STREAK_FILE, '');
    if (streakData) {
        const lines = streakData.split('\n');
        currentStreak = parseInt(lines[0]) || 0;
        lastCompletionDate = lines[1] || '';
        bestStreak = parseInt(lines[2]) || 0;
    }

    // Calculate if streak continues
    if (lastCompletionDate === today) {
        // Already completed today, streak stays
    } else if (lastCompletionDate === yesterday) {
        currentStreak++;
    } else if (!lastCompletionDate) {
        currentStreak = 1;
    } else {
        currentStreak = 1; // Reset streak
    }

    // Update best streak
    if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
    }

    // Save streak
    writeFile(STREAK_FILE, `${currentStreak}\n${today}\n${bestStreak}`);

    // ============================================
    // UPDATE STATS
    // ============================================
    const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
    stats.completed = (stats.completed || 0) + 1;
    writeFile(STATS_FILE, JSON.stringify(stats));

    const completed = stats.completed;
    const skipped = stats.skipped || 0;
    const total = stats.total_assigned || 0;

    // ============================================
    // CHECK ACHIEVEMENTS
    // ============================================
    const achievements = readJsonFile(ACHIEVEMENTS_FILE, []);
    const newAchievements = [];

    function checkAchievement(id, condition) {
        if (condition && !achievements.includes(id)) {
            achievements.push(id);
            const ach = ACHIEVEMENT_NAMES[id];
            newAchievements.push(`${ach.emoji} ${ach.name}`);
        }
    }

    // Task milestones
    checkAchievement('first_task', completed >= 1);
    checkAchievement('five_tasks', completed >= 5);
    checkAchievement('ten_tasks', completed >= 10);
    checkAchievement('twentyfive_tasks', completed >= 25);
    checkAchievement('fifty_tasks', completed >= 50);
    checkAchievement('hundred_tasks', completed >= 100);

    // Streak achievements
    checkAchievement('streak_3', currentStreak >= 3);
    checkAchievement('streak_7', currentStreak >= 7);
    checkAchievement('streak_14', currentStreak >= 14);
    checkAchievement('streak_30', currentStreak >= 30);

    // Save achievements
    writeFile(ACHIEVEMENTS_FILE, JSON.stringify(achievements));

    // ============================================
    // OUTPUT
    // ============================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    ✅ TASK COMPLETATO!                      ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Show new achievements
    if (newAchievements.length > 0) {
        console.log('🏅 NUOVO ACHIEVEMENT SBLOCCATO!');
        newAchievements.forEach(a => console.log(`   ${a}`));
        console.log('');
    }

    // Streak
    console.log(`🔥 Streak: ${currentStreak} giorni`);
    if (currentStreak === bestStreak && currentStreak > 1) {
        console.log('   ⭐ Nuovo record personale!');
    } else {
        console.log(`   📈 Record: ${bestStreak} giorni`);
    }
    console.log('');

    // Stats
    console.log('📊 Statistiche:');
    console.log(`   Task completati: ${completed}`);
    console.log(`   Task saltati: ${skipped}`);
    if (total > 0) {
        const completionRate = Math.round((completed * 100) / total);
        console.log(`   Tasso completamento: ${completionRate}%`);
    }
    console.log('');

    // Next task
    const currentCount = parseInt(readFile(COUNTER_FILE, '0'));
    const nextTask = TRIGGER_EVERY - (currentCount % TRIGGER_EVERY);
    const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
    const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

    console.log(`📍 Prossimo task tra: ${nextTask} richieste`);
    console.log(`🃏 Jolly rimanenti oggi: ${remainingSkips}/${MAX_DAILY_SKIPS}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💪 Ottimo lavoro! Continua così!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Remove pending task
    fs.unlinkSync(PENDING_TASK_FILE);

    // Log completion
    fs.appendFileSync(HISTORY_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'completed',
        streak: currentStreak
    }) + '\n');
}

main();
