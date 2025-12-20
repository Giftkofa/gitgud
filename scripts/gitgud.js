#!/usr/bin/env node
/**
 * GitGud Hook
 * Every X requests, assigns a manual coding challenge related to the user's request
 */

const fs = require('fs');
const {
    COUNTER_FILE,
    PENDING_TASK_FILE,
    SKIPS_FILE,
    LAST_SKIP_DATE_FILE,
    STREAK_FILE,
    STATS_FILE,
    HISTORY_FILE,
    readFile,
    readJsonFile,
    writeFile,
    appendFile,
    readConfig,
    getToday
} = require('./paths');

// Prompts that are too short or trivial to count
const TRIVIAL_PATTERNS = /^(ok|okay|thanks|thank you|thx|ty|yes|no|sure|got it|understood|perfect|great|good|nice|cool|fine|k|y|n|yep|nope|alright|right|correct|done|next)\.?!?$/i;

// Patterns that indicate skip intent
const SKIP_PATTERNS = /^(skip|\/skip|skip this|skip task|skip it|i want to skip|let me skip|can i skip|skippa|salta)$/i;

// Task categories with English tasks
const CATEGORIES = {
    security: {
        keywords: /auth|login|logout|password|token|jwt|session|security|encrypt|hash|credential|permission|role|oauth|apikey|2fa|mfa/i,
        tasks: [
            "Write a password validation function that checks security requirements (length, complexity, special characters).",
            "Implement a function to sanitize user input and prevent injection attacks.",
            "Create a helper function to verify user permissions/roles."
        ]
    },
    api: {
        keywords: /api|endpoint|route|rest|request|response|http|fetch|axios|graphql|webhook|cors/i,
        tasks: [
            "Write a validation schema/model for the request body or response of this endpoint.",
            "Implement a middleware function or decorator to handle a cross-cutting concern (logging, timing, error handling).",
            "Create a helper function to format error responses consistently."
        ]
    },
    database: {
        keywords: /database|query|sql|model|schema|migration|table|record|repository|orm|prisma|mongoose|postgres|mysql|mongo/i,
        tasks: [
            "Write a sanitization function to prevent SQL injection or validate data before insertion.",
            "Implement a helper function for paginating query results.",
            "Create a transformation function between the database model and the DTO/response."
        ]
    },
    debug: {
        keywords: /bug|debug|error|crash|broken|issue|exception|trace|not working|fails|failing/i,
        tasks: [
            "Write a test that reproduces the described bug. The test should fail before the fix and pass after.",
            "Implement a logging/debug helper function to trace data flow at this point in the code.",
            "Create a validation function that prevents this type of error in the future."
        ]
    },
    test: {
        keywords: /test|spec|assert|pytest|jest|unittest|coverage|mock|stub|spy|vitest|mocha/i,
        tasks: [
            "Write a test for a non-obvious edge case of this functionality. Think about empty inputs, null, numeric limits.",
            "Implement an integration test that verifies the interaction between multiple components.",
            "Create a fixture or factory function to generate reusable test data."
        ]
    },
    architecture: {
        keywords: /refactor|restructure|reorganize|architect|pattern|solid|abstract|interface|decouple|modular/i,
        tasks: [
            "Extract an interface/protocol that defines the contract for this component.",
            "Implement a factory or builder pattern for creating this object.",
            "Create a base class/module that can be extended for variants of this functionality."
        ]
    },
    frontend: {
        keywords: /component|react|vue|angular|svelte|nextjs|nuxt|tailwind|css|scss|sass|styled|emotion/i,
        tasks: [
            "Write a reusable presentational component (button, input, card) that you could use in this feature.",
            "Implement a custom hook or composable to manage local state for this component.",
            "Create a form validation function for the input fields of this feature."
        ]
    },
    function: {
        keywords: /function|implement|create|add|write|build|make|develop/i,
        tasks: [
            "Write a related helper function that could be useful for this implementation. Think about input validation, output formatting, or common utilities.",
            "Implement a validation function for the main parameters of this feature. Consider edge cases and input types.",
            "Create a utility function that extracts/transforms the data needed for this operation."
        ]
    },
    general: {
        keywords: null,
        tasks: [
            "Write a utility function that could be useful in the context of this request.",
            "Implement a unit test for an existing related functionality.",
            "Create a data validation or transformation function relevant to this task."
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
        easy: "(Difficulty: EASY - basic implementation, few lines)",
        medium: "(Difficulty: MEDIUM - consider edge cases and error handling)",
        hard: "(Difficulty: HARD - robust implementation with tests, types, documentation)",
        adaptive: "(Difficulty: adapted to the context of the request)"
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

// Check if prompt is too short/trivial to count
function isTrivialPrompt(prompt) {
    const trimmed = prompt.trim();
    // Too short (less than 10 chars) or matches trivial patterns
    return trimmed.length < 10 || TRIVIAL_PATTERNS.test(trimmed);
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

    const userPromptLower = userPrompt.toLowerCase().trim();

    // Check for skip request (more flexible matching)
    if (SKIP_PATTERNS.test(userPromptLower)) {
        const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
        const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

        if (fs.existsSync(PENDING_TASK_FILE)) {
            if (remainingSkips > 0) {
                writeFile(SKIPS_FILE, String(currentSkips + 1));
                fs.unlinkSync(PENDING_TASK_FILE);

                // Update stats
                const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
                stats.skipped = (stats.skipped || 0) + 1;
                writeFile(STATS_FILE, JSON.stringify(stats));

                // Log
                appendFile(HISTORY_FILE, JSON.stringify({ timestamp: new Date().toISOString(), event: 'skipped' }));

                output(`🃏 SKIP USED!\n\nThe user chose to skip the manual task.\nSkips remaining today: ${remainingSkips - 1}/${MAX_DAILY_SKIPS}\n\nYou can proceed normally with the user's request.\nInform the user that they used a skip and how many remain.`);
                process.exit(0);
            } else {
                output(`❌ NO SKIPS REMAINING!\n\nThe user has used all ${MAX_DAILY_SKIPS} skips for today.\nThey must complete the pending task or wait until tomorrow.\n\nRemind them of the pending task and encourage them to complete it.`);
                process.exit(0);
            }
        }
        // No pending task - just exit silently, let Claude handle normally
        process.exit(0);
    }

    // If there's a pending task, inject restrictive context
    if (fs.existsSync(PENDING_TASK_FILE)) {
        const pendingTask = readFile(PENDING_TASK_FILE, '').replace(/\n/g, ' ');
        const currentSkips = parseInt(readFile(SKIPS_FILE, '0'));
        const remainingSkips = MAX_DAILY_SKIPS - currentSkips;

        output(`🎮 GITGUD ACTIVE!\n\n📋 PENDING TASK:\n${pendingTask}\n\n⛔ MANDATORY INSTRUCTIONS FOR CLAUDE:\n1. DO NOT write code for them\n2. DO NOT provide complete implementations\n3. DO NOT give copy-paste snippets\n4. You CAN ONLY:\n   - Answer conceptual questions\n   - Point to documentation to consult\n   - Confirm if an approach is correct (without code)\n   - Give high-level hints\n\n🃏 Skips available: ${remainingSkips}/${MAX_DAILY_SKIPS} (user can type 'skip')\n\n✅ When done: /gg-complete\n\nRemind the user of the task and options.`);
        process.exit(0);
    }

    // Don't count trivial prompts
    if (isTrivialPrompt(userPrompt)) {
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

        const taskMessage = `[Category: ${category}] ${selectedTask} ${diffNote}`;
        writeFile(PENDING_TASK_FILE, taskMessage);

        // Update stats
        const stats = readJsonFile(STATS_FILE, { completed: 0, skipped: 0, total_assigned: 0 });
        stats.total_assigned = (stats.total_assigned || 0) + 1;
        writeFile(STATS_FILE, JSON.stringify(stats));

        // Log
        appendFile(HISTORY_FILE, JSON.stringify({
            timestamp: new Date().toISOString(),
            event: 'assigned',
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

        output(`🎮 GITGUD - NEW CHALLENGE!\n\nRequest #${newCount} - Time to git gud!\n🔥 Current streak: ${currentStreak} days\n\n📋 YOUR TASK:\n${taskMessage}\n\n⛔ INSTRUCTIONS FOR CLAUDE:\n1. DON'T write code - the user must do it themselves\n2. Present the task clearly and motivationally\n3. Explain WHY this exercise is useful for the original request\n4. Suggest documentation/resources to consult\n5. Give high-level hints if requested (no code!)\n\n🃏 Skips available: ${remainingSkips}/${MAX_DAILY_SKIPS} (user can type 'skip')\n✅ When done: /gg-complete\n\nPresent the challenge to the user!`);
        process.exit(0);
    }

    // No output = proceed normally
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
