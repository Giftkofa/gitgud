#!/usr/bin/env node
/**
 * GitGud Hook
 * Every X requests, assigns a manual coding challenge related to the user's request
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
const LAST_SKIP_DATE_FILE = path.join(DATA_DIR, '.last_skip_date');
const STREAK_FILE = path.join(DATA_DIR, '.streak_data');
const STATS_FILE = path.join(DATA_DIR, '.stats');
const HISTORY_FILE = path.join(DATA_DIR, 'task_history.jsonl');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read config with defaults
function readConfig() {
    const defaults = { frequency: 10, daily_skips: 3, difficulty: 'adaptive', enabled: true };
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

// Append to file
function appendFile(filePath, content) {
    fs.appendFileSync(filePath, content + '\n');
}

// Get today's date
function getToday() {
    return new Date().toISOString().split('T')[0];
}

// Task categories
const CATEGORIES = {
    security: {
        keywords: /auth|login|logout|password|token|jwt|session|sicur|security|encrypt|hash|credential|permission|role/i,
        tasks: [
            "Scrivi una funzione di validazione password che verifica requisiti di sicurezza (lunghezza, complessita, caratteri speciali).",
            "Implementa una funzione per sanitizzare input utente e prevenire injection.",
            "Crea una funzione helper per verificare permessi/ruoli utente."
        ]
    },
    api: {
        keywords: /api|endpoint|route|rest|request|response|http|get |post |put |delete |fetch|axios/i,
        tasks: [
            "Scrivi il modello/schema di validazione per il body della request o la response di questo endpoint.",
            "Implementa una funzione middleware o decorator per gestire un aspetto cross-cutting (logging, timing, error handling).",
            "Crea una funzione helper per formattare le response di errore in modo consistente."
        ]
    },
    database: {
        keywords: /database|db|query|sql|model|schema|migration|table|record|repository|orm/i,
        tasks: [
            "Scrivi una funzione di sanitizzazione per prevenire SQL injection o validare i dati prima dell'inserimento.",
            "Implementa una funzione helper per la paginazione dei risultati.",
            "Crea una funzione di trasformazione tra il modello del database e il DTO/response."
        ]
    },
    debug: {
        keywords: /bug|fix|debug|errore|error|problema|problem|crash|broken|non funziona|doesn't work|issue/i,
        tasks: [
            "Scrivi un test che riproduce il bug descritto. Il test deve fallire prima del fix e passare dopo.",
            "Implementa una funzione di logging/debug helper che aiuti a tracciare il flusso dei dati in questo punto del codice.",
            "Crea una funzione di validazione che previene questo tipo di errore in futuro."
        ]
    },
    test: {
        keywords: /test|spec|verifica|check|assert|pytest|jest|unittest|coverage|mock/i,
        tasks: [
            "Scrivi un test per un edge case non ovvio di questa funzionalita. Pensa a input vuoti, null, limiti numerici.",
            "Implementa un test di integrazione che verifica l'interazione tra piu componenti.",
            "Crea una fixture o factory function per generare dati di test riutilizzabili."
        ]
    },
    architecture: {
        keywords: /refactor|rifattorizza|clean|pulisci|organizza|structure|architett|pattern|solid/i,
        tasks: [
            "Estrai una interfaccia/protocollo che definisce il contratto per questo componente.",
            "Implementa un factory o builder pattern per la creazione di questo oggetto.",
            "Crea una classe/modulo base che puo essere esteso per varianti di questa funzionalita."
        ]
    },
    frontend: {
        keywords: /component|componente|ui|frontend|react|vue|angular|html|css|style|button|form|page/i,
        tasks: [
            "Scrivi un componente presentazionale riutilizzabile (button, input, card) che potresti usare in questa feature.",
            "Implementa un custom hook o composable per gestire lo stato locale di questo componente.",
            "Crea una funzione di validazione form per i campi di input di questa feature."
        ]
    },
    function: {
        keywords: /funzione|function|implementa|implement|crea|create|aggiungi|add|scrivi|write/i,
        tasks: [
            "Scrivi una funzione helper correlata che potrebbe essere utile per questa implementazione. Pensa a validazione input, formattazione output, o utility comuni.",
            "Implementa una funzione di validazione per i parametri principali di questa feature. Considera edge case e tipi di input.",
            "Crea una funzione utility che estrae/trasforma i dati necessari per questa operazione."
        ]
    },
    general: {
        keywords: null,
        tasks: [
            "Scrivi una funzione utility che potrebbe essere utile nel contesto di questa richiesta.",
            "Implementa un test unitario per una funzionalita esistente correlata.",
            "Crea una funzione di validazione o trasformazione dati pertinente."
        ]
    }
};

// Detect category from prompt
function detectCategory(prompt) {
    for (const [category, data] of Object.entries(CATEGORIES)) {
        if (data.keywords && data.keywords.test(prompt)) {
            return category;
        }
    }
    return 'general';
}

// Get difficulty note
function getDifficultyNote(difficulty) {
    const notes = {
        easy: "(Difficolta: FACILE - implementazione base, poche righe)",
        medium: "(Difficolta: MEDIA - considera edge case e error handling)",
        hard: "(Difficolta: HARD - implementazione robusta con test, tipi, documentazione)",
        adaptive: "(Difficolta: adattata al contesto della richiesta)"
    };
    return notes[difficulty] || notes.adaptive;
}

// Output hook response
function output(additionalContext) {
    console.log(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "UserPromptSubmit",
            additionalContext
        }
    }));
}

// Main function
async function main() {
    const config = readConfig();

    // Exit if disabled
    if (!config.enabled) {
        process.exit(0);
    }

    const TRIGGER_EVERY = config.frequency;
    const MAX_DAILY_SKIPS = config.daily_skips;
    const DIFFICULTY = config.difficulty;

    // Initialize files if needed
    if (!fs.existsSync(COUNTER_FILE)) writeFile(COUNTER_FILE, '0');
    if (!fs.existsSync(SKIPS_FILE)) writeFile(SKIPS_FILE, '0');
    if (!fs.existsSync(STATS_FILE)) writeFile(STATS_FILE, JSON.stringify({ completed: 0, skipped: 0, total_assigned: 0 }));

    // Reset daily skips
    const today = getToday();
    const lastSkipDate = readFile(LAST_SKIP_DATE_FILE, '');
    if (lastSkipDate !== today) {
        writeFile(SKIPS_FILE, '0');
        writeFile(LAST_SKIP_DATE_FILE, today);
    }

    // Read stdin (user prompt)
    let input = '';
    for await (const chunk of process.stdin) {
        input += chunk;
    }

    let userPrompt = '';
    try {
        const data = JSON.parse(input);
        userPrompt = data.prompt || '';
    } catch (e) {}

    const userPromptLower = userPrompt.toLowerCase();

    // Check for skip/jolly request
    if (/skip|jolly|salta|passa/i.test(userPromptLower)) {
        const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
        const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

        if (remainingSkips > 0 && fs.existsSync(PENDING_TASK_FILE)) {
            writeFile(SKIPS_FILE, String(currentSkips + 1));
            fs.unlinkSync(PENDING_TASK_FILE);

            // Update stats
            const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
            stats.skipped = (stats.skipped || 0) + 1;
            writeFile(STATS_FILE, JSON.stringify(stats));

            // Log
            appendFile(HISTORY_FILE, JSON.stringify({ timestamp: new Date().toISOString(), event: 'skipped' }));

            output(`🃏 JOLLY UTILIZZATO!\n\nL'utente ha scelto di saltare il task manuale.\nJolly rimanenti oggi: ${remainingSkips - 1}/${MAX_DAILY_SKIPS}\n\nPuoi procedere normalmente con la richiesta dell'utente.\nInforma l'utente che ha usato un jolly e quanti ne restano.`);
            process.exit(0);
        }
    }

    // If there's a pending task, inject restrictive context
    if (fs.existsSync(PENDING_TASK_FILE)) {
        const pendingTask = readFile(PENDING_TASK_FILE, '').replace(/\n/g, ' ');
        const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
        const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

        output(`🎮 GITGUD ATTIVO!\n\n📋 TASK PENDENTE:\n${pendingTask}\n\n⛔ ISTRUZIONI OBBLIGATORIE PER CLAUDE:\n1. NON scrivere codice\n2. NON fornire implementazioni complete\n3. NON dare snippet da copiare\n4. Puoi SOLO:\n   - Rispondere a domande concettuali\n   - Indicare documentazione da consultare\n   - Confermare se un approccio è corretto (senza codice)\n   - Dare hint di alto livello\n\n🃏 Skip disponibili: ${remainingSkips}/${MAX_DAILY_SKIPS} (di' 'skip' per saltare)\n\n✅ Quando hai finito: /gg-complete\n\nRicorda all'utente il task e le opzioni.`);
        process.exit(0);
    }

    // Increment counter
    const currentCount = parseInt(readFile(COUNTER_FILE, '0'));
    const newCount = currentCount + 1;
    writeFile(COUNTER_FILE, String(newCount));

    // Check if it's time for a manual task
    if (newCount % TRIGGER_EVERY === 0) {
        const category = detectCategory(userPromptLower);
        const tasks = CATEGORIES[category].tasks;
        const selectedTask = tasks[Math.floor(Math.random() * tasks.length)];
        const diffNote = getDifficultyNote(DIFFICULTY);

        const taskMessage = `[Categoria: ${category}] ${selectedTask} ${diffNote}`;
        writeFile(PENDING_TASK_FILE, taskMessage);

        // Update stats
        const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
        stats.total_assigned = (stats.total_assigned || 0) + 1;
        writeFile(STATS_FILE, JSON.stringify(stats));

        // Log
        appendFile(HISTORY_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            request_number: newCount,
            category,
            difficulty: DIFFICULTY
        }));

        const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
        const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

        // Read current streak
        let currentStreak = 0;
        const streakData = readFile(STREAK_FILE, '');
        if (streakData) {
            currentStreak = parseInt(streakData.split('\n')[0]) || 0;
        }

        output(`🎮 GITGUD - NEW CHALLENGE!\n\nRequest #${newCount} - Time to git gud!\n🔥 Current streak: ${currentStreak} days\n\n📋 YOUR TASK:\n${taskMessage}\n\n⛔ INSTRUCTIONS FOR CLAUDE:\n1. DON'T write code - the user must do it\n2. Present the task clearly and motivationally\n3. Explain WHY this exercise is useful for the original request\n4. Suggest documentation/resources\n5. Give high-level hints if requested\n\n🃏 Skips available: ${remainingSkips}/${MAX_DAILY_SKIPS} (user can say 'skip')\n✅ When done: /gg-complete\n\nPresent the challenge to the user!`);
        process.exit(0);
    }

    // No output = proceed normally
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
