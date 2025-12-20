#!/usr/bin/env node
/**
 * Script to mark a task as completed
 * Handles streaks and achievements
 */

const fs = require('fs');
const {
    COUNTER_FILE,
    PENDING_TASK_FILE,
    SKIPS_FILE,
    STREAK_FILE,
    ACHIEVEMENTS_FILE,
    STATS_FILE,
    HISTORY_FILE,
    readFile,
    readJsonFile,
    writeFile,
    appendFile,
    readConfig,
    getToday,
    getYesterday
} = require('./paths');

// Achievement definitions (English)
const ACHIEVEMENT_NAMES = {
    first_task: { emoji: '🎯', name: 'First Steps' },
    five_tasks: { emoji: '✋', name: 'Getting Hands Dirty' },
    ten_tasks: { emoji: '📚', name: 'Apprentice' },
    twentyfive_tasks: { emoji: '🔨', name: 'Craftsman' },
    fifty_tasks: { emoji: '🎓', name: 'Master' },
    hundred_tasks: { emoji: '🏆', name: 'Legend' },
    streak_3: { emoji: '🔥', name: 'Three in a Row' },
    streak_7: { emoji: '📅', name: 'Perfect Week' },
    streak_14: { emoji: '💪', name: 'Two Weeks Strong' },
    streak_30: { emoji: '🥇', name: 'Golden Month' }
};

function main() {
    // Check if there's a pending task
    if (!fs.existsSync(PENDING_TASK_FILE)) {
        console.log('ℹ️  No pending task to complete.');
        console.log('');
        console.log('Tasks are assigned automatically every few requests.');
        console.log('Use /gg-stats to see when your next task will appear.');
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
    console.log('                    ✅ TASK COMPLETED!                       ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Show new achievements
    if (newAchievements.length > 0) {
        console.log('🏅 NEW ACHIEVEMENT UNLOCKED!');
        newAchievements.forEach(a => console.log(`   ${a}`));
        console.log('');
    }

    // Streak
    console.log(`🔥 Streak: ${currentStreak} days`);
    if (currentStreak === bestStreak && currentStreak > 1) {
        console.log('   ⭐ New personal record!');
    } else {
        console.log(`   📈 Best: ${bestStreak} days`);
    }
    console.log('');

    // Stats
    console.log('📊 Statistics:');
    console.log(`   Tasks completed: ${completed}`);
    console.log(`   Tasks skipped: ${skipped}`);
    if (total > 0) {
        const completionRate = Math.round((completed * 100) / total);
        console.log(`   Completion rate: ${completionRate}%`);
    }
    console.log('');

    // Next task
    const currentCount = parseInt(readFile(COUNTER_FILE, '0'));
    const nextTask = TRIGGER_EVERY - (currentCount % TRIGGER_EVERY);
    const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
    const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

    console.log(`📍 Next task in: ${nextTask} requests`);
    console.log(`🃏 Skips remaining today: ${remainingSkips}/${MAX_DAILY_SKIPS}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💪 Great job! Keep it up!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Remove pending task
    fs.unlinkSync(PENDING_TASK_FILE);

    // Log completion
    appendFile(HISTORY_FILE, JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'completed',
        streak: currentStreak
    }));
}

main();
