#!/usr/bin/env node

/**
 * Word Generator Utility for Matching Game
 * Supports generating words.json from CSV or JSON input
 * 
 * Usage:
 *   node generate-words.js --csv <path-to-csv>
 *   node generate-words.js --json <path-to-json>
 *   node generate-words.js --duolingo <path-to-duolingo-export>
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            options[key] = args[i + 1] || true;
            i++;
        }
    }
    
    return options;
}

// Parse CSV file
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Check if first line is header
    const hasHeader = lines[0].toLowerCase().includes('german') || 
                     lines[0].toLowerCase().includes('english');
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    const words = dataLines.map(line => {
        // Simple CSV parsing - handles quoted fields with commas
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim().replace(/^["']|["']$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim().replace(/^["']|["']$/g, ''));
        
        if (parts.length >= 2) {
            const word = {
                german: parts[0],
                english: parts[1]
            };
            // Add german_example if present (3rd column)
            if (parts.length >= 3 && parts[2]) {
                word.german_example = parts[2];
            }
            return word;
        }
        return null;
    }).filter(w => w !== null);
    
    return words;
}

// Parse JSON file (Duolingo export format or simple array)
function parseJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Handle different JSON formats
    if (Array.isArray(data)) {
        // Already in correct format or simple array
        if (data.length > 0 && data[0].german && data[0].english) {
            return data;
        }
        
        // Handle array of arrays [[german, english], ...]
        if (data.length > 0 && Array.isArray(data[0])) {
            return data.map(([german, english]) => ({ german, english }));
        }
    }
    
    // Handle Duolingo-style export with nested structure
    if (data.words || data.vocabulary) {
        const words = data.words || data.vocabulary;
        return words.map(item => {
            const word = {
                german: item.word || item.target || item.german,
                english: item.translation || item.source || item.english
            };
            // Add german_example if present
            if (item.german_example || item.example) {
                word.german_example = item.german_example || item.example;
            }
            return word;
        }).filter(w => w.german && w.english);
    }
    
    throw new Error('Unsupported JSON format');
}

// Generate words.json
function generateWordsFile(words, outputPath = 'words.json') {
    const output = JSON.stringify(words, null, 2);
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`✅ Generated ${outputPath} with ${words.length} word pairs`);
}

// Validate words
function validateWords(words) {
    const valid = [];
    const errors = [];
    
    words.forEach((word, index) => {
        if (!word.german || !word.english) {
            errors.push(`Line ${index + 1}: Missing german or english field`);
        } else if (typeof word.german !== 'string' || typeof word.english !== 'string') {
            errors.push(`Line ${index + 1}: german and english must be strings`);
        } else {
            valid.push(word);
        }
    });
    
    if (errors.length > 0) {
        console.warn('⚠️  Validation warnings:');
        errors.forEach(err => console.warn(`  ${err}`));
    }
    
    return valid;
}

// Main function
function main() {
    const options = parseArgs();
    
    if (!options.csv && !options.json && !options.duolingo) {
        console.log(`
Word Generator Utility for Matching Game

Usage:
  node generate-words.js --csv <path-to-csv>
  node generate-words.js --json <path-to-json>
  node generate-words.js --duolingo <path-to-duolingo-export>

CSV Format:
  german,english,german_example
  der Hund,the dog,Ich habe einen Hund.
  die Katze,the cat,Die Katze ist süß.

JSON Format:
  [
    { "german": "der Hund", "english": "the dog", "german_example": "Ich habe einen Hund." },
    { "german": "die Katze", "english": "the cat", "german_example": "Die Katze ist süß." }
  ]

Options:
  --output <path>    Output file path (default: words.json)
        `);
        return;
    }
    
    try {
        let words = [];
        
        if (options.csv) {
            console.log(`📖 Reading CSV file: ${options.csv}`);
            words = parseCSV(options.csv);
        } else if (options.json || options.duolingo) {
            const filePath = options.json || options.duolingo;
            console.log(`📖 Reading JSON file: ${filePath}`);
            words = parseJSON(filePath);
        }
        
        console.log(`📝 Found ${words.length} word pairs`);
        
        // Validate words
        words = validateWords(words);
        
        if (words.length === 0) {
            console.error('❌ No valid words found');
            process.exit(1);
        }
        
        // Generate output file
        const outputPath = options.output || 'words.json';
        generateWordsFile(words, outputPath);
        
        console.log('✨ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { parseCSV, parseJSON, generateWordsFile, validateWords };
