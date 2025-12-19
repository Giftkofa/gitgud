#!/usr/bin/env node
/**
 * Reset tool for GitGud
 */

const fs = require('fs');
const path = require('path');

// Paths
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.dirname(__dirname);
const DATA_DIR = path.join(PLUGIN_ROOT, 'data');

// State files
const COUNTER_FILE = path.join(DATA_DIR, '.request_counter');
const PENDING_TASK_FILE = path.join(DATA_DIR, '.pending_task');
const SKIPS_FILE = path.join(DATA_DIR, '.daily_skips');
const STREAK_FILE = path.join(DATA_DIR, '.streak_data');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, '.achievements');
const STATS_FILE = path.join(DATA_DIR, '.stats');
const HISTORY_FILE = path.join(DATA_DIR, 'task_history.jsonl');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function showHelp() {
    console.log('GitGud - Reset Tool');
    console.log('');
    console.log('Uso: /gg-reset [opzione]');
    console.log('');
    console.log('Opzioni:');
    console.log('  counter    Resetta solo il contatore richieste');
    console.log('  stats      Resetta le statistiche (mantiene achievements)');
    console.log('  all        Resetta tutto (counter, stats, achievements, streak)');
    console.log('  help       Mostra questo messaggio');
    console.log('');
}

function resetCounter() {
    fs.writeFileSync(COUNTER_FILE, '0');
    if (fs.existsSync(PENDING_TASK_FILE)) {
        fs.unlinkSync(PENDING_TASK_FILE);
    }
    console.log('✅ Contatore resettato a 0');
}

function resetStats() {
    fs.writeFileSync(STATS_FILE, JSON.stringify({ completed: 0, skipped: 0, total_assigned: 0 }));
    fs.writeFileSync(SKIPS_FILE, '0');
    console.log('✅ Statistiche resettate');
}

function resetAll() {
    resetCounter();
    resetStats();
    fs.writeFileSync(ACHIEVEMENTS_FILE, '[]');
    console.log('✅ Achievements resettati');

    if (fs.existsSync(STREAK_FILE)) {
        fs.unlinkSync(STREAK_FILE);
    }
    console.log('✅ Streak resettato');

    if (fs.existsSync(HISTORY_FILE)) {
        fs.unlinkSync(HISTORY_FILE);
    }
    console.log('✅ History cancellata');
    console.log('');
    console.log('🔄 Reset completo eseguito!');
}

function main() {
    const args = process.argv.slice(2);
    const option = args[0] || 'help';

    switch (option) {
        case 'counter':
            resetCounter();
            break;
        case 'stats':
            resetStats();
            break;
        case 'all':
            resetAll();
            break;
        case 'help':
        default:
            showHelp();
            break;
    }
}

main();
