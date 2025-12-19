#!/usr/bin/env node
/**
 * Configuration management for GitGud
 */

const fs = require('fs');
const path = require('path');

// Paths
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.dirname(__dirname);
const CONFIG_FILE = path.join(PLUGIN_ROOT, 'config.json');

// Default config
const DEFAULT_CONFIG = {
    frequency: 10,
    daily_skips: 3,
    difficulty: 'adaptive',
    enabled: true
};

// Create config if it doesn't exist
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG));
}

// Read config
function readConfig() {
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
    } catch (e) {
        return DEFAULT_CONFIG;
    }
}

// Write config
function writeConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

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
        ['daily_skips', 'Max jolly per day', String(config.daily_skips)],
        ['difficulty', 'Task difficulty', config.difficulty],
        ['enabled', 'Plugin active', String(config.enabled).toLowerCase()]
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
                console.log(`❌ Errore: ${key} deve essere un numero positivo`);
                process.exit(1);
            }
            config[key] = num;
            break;

        case 'difficulty':
            const validDifficulties = ['easy', 'medium', 'hard', 'adaptive'];
            if (!validDifficulties.includes(value)) {
                console.log('❌ Errore: difficulty deve essere: easy, medium, hard, o adaptive');
                process.exit(1);
            }
            config[key] = value;
            break;

        case 'enabled':
            if (value !== 'true' && value !== 'false') {
                console.log('❌ Errore: enabled deve essere: true o false');
                process.exit(1);
            }
            config[key] = value === 'true';
            break;

        default:
            console.log(`❌ Errore: chiave sconosciuta '${key}'`);
            console.log('');
            console.log('Chiavi valide: frequency, daily_skips, difficulty, enabled');
            process.exit(1);
    }

    writeConfig(config);
    console.log(`✅ ${key} impostato a: ${config[key]}`);
}

// Main
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showConfig();
    } else if (args.length === 1) {
        console.log('❌ Errore: specificare anche il valore');
        console.log('');
        console.log('Uso: /gg-config <setting> <value>');
        console.log(`Esempio: /gg-config ${args[0]} 10`);
        process.exit(1);
    } else if (args.length === 2) {
        setConfig(args[0], args[1]);
    } else {
        console.log('❌ Errore: troppi argomenti');
        console.log('');
        console.log('Uso: /gg-config <setting> <value>');
        process.exit(1);
    }
}

main();
