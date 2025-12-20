#!/usr/bin/env node
/**
 * Configuration management for GitGud
 */

const {
    USER_DATA_DIR,
    readConfig,
    writeConfig
} = require('./paths');

// Show current configuration
function showConfig() {
    const config = readConfig();

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ⚙️  GITGUD CONFIG                          ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║                                                              ║');

    const settings = [
        ['frequency', 'Requests between tasks', String(config.frequency)],
        ['daily_skips', 'Max skips per day', String(config.daily_skips)],
        ['difficulty', 'Task difficulty', config.difficulty],
        ['enabled', 'Plugin active', String(config.enabled)]
    ];

    settings.forEach(([key, desc, val]) => {
        console.log(`║  ${key.padEnd(14)} ${val.padEnd(12)} (${desc})`);
        console.log('║                                                              ║');
    });

    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  Usage: /gg-config <setting> <value>                         ║');
    console.log('║                                                              ║');
    console.log('║  Examples:                                                   ║');
    console.log('║    /gg-config frequency 15                                   ║');
    console.log('║    /gg-config daily_skips 5                                  ║');
    console.log('║    /gg-config difficulty hard                                ║');
    console.log('║    /gg-config enabled false                                  ║');
    console.log('║                                                              ║');
    console.log('║  Valid difficulty: easy, medium, hard, adaptive              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Data location: ${USER_DATA_DIR.substring(0, 40).padEnd(40)}    ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
}

// Set a configuration value
function setConfig(key, value) {
    const config = readConfig();

    // Validate key and value
    switch (key) {
        case 'frequency':
        case 'daily_skips':
            const num = parseInt(value);
            if (isNaN(num) || num < 1) {
                console.log(`❌ Error: ${key} must be a positive number`);
                process.exit(1);
            }
            config[key] = num;
            break;

        case 'difficulty':
            const validDifficulties = ['easy', 'medium', 'hard', 'adaptive'];
            if (!validDifficulties.includes(value)) {
                console.log('❌ Error: difficulty must be: easy, medium, hard, or adaptive');
                process.exit(1);
            }
            config[key] = value;
            break;

        case 'enabled':
            if (value !== 'true' && value !== 'false') {
                console.log('❌ Error: enabled must be: true or false');
                process.exit(1);
            }
            config[key] = value === 'true';
            break;

        default:
            console.log(`❌ Error: unknown setting '${key}'`);
            console.log('');
            console.log('Valid settings: frequency, daily_skips, difficulty, enabled');
            process.exit(1);
    }

    writeConfig(config);
    console.log(`✅ ${key} set to: ${config[key]}`);
}

// Main
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showConfig();
    } else if (args.length === 1) {
        console.log('❌ Error: please also specify a value');
        console.log('');
        console.log('Usage: /gg-config <setting> <value>');
        console.log(`Example: /gg-config ${args[0]} 10`);
        process.exit(1);
    } else if (args.length === 2) {
        setConfig(args[0], args[1]);
    } else {
        console.log('❌ Error: too many arguments');
        console.log('');
        console.log('Usage: /gg-config <setting> <value>');
        process.exit(1);
    }
}

main();
