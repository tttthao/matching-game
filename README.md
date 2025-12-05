# German-English Matching Game

An interactive drag-and-drop game for learning German vocabulary with audio pronunciation, timer, statistics tracking, and dark mode support.

## Features

- 🎯 **Drag & Drop Matching**: Match German words with their English translations
- 🔊 **Audio Pronunciation**: Click the speaker icon to hear German words pronounced
- ⏱️ **Timer & Speed Tracking**: Track your completion time and words per minute
- 💾 **Statistics**: Saves games played, high score, and best time to localStorage
- 🌙 **Dark/Light Mode**: Toggle between themes with preference saved
- 📊 **Score System**: +10 points for correct matches, -5 for incorrect attempts

## How to Play

1. Open `index.html` in your browser
2. Drag German words from the left column to their matching English translations on the right
3. Click the 🔊 icon to hear pronunciation of German words
4. Complete all matches as quickly as possible to improve your time and WPM
5. Click "New Game" to shuffle words and start again

## Word Generator Utility

Generate your own `words.json` file from CSV or JSON data sources.

### Usage

```bash
# From CSV file
node generate-words.js --csv sample-words.csv

# From JSON file
node generate-words.js --json my-words.json

# From Duolingo export
node generate-words.js --duolingo duolingo-data.json

# Specify custom output path
node generate-words.js --csv my-data.csv --output custom-words.json
```

### CSV Format

Create a CSV file with `german` and `english` columns:

```csv
german,english
der Hund,the dog
die Katze,the cat
das Haus,the house
```

### JSON Format

Create a JSON file with an array of word pairs:

```json
[
  { "german": "der Hund", "english": "the dog" },
  { "german": "die Katze", "english": "the cat" },
  { "german": "das Haus", "english": "the house" }
]
```

### Duolingo Export Format

The generator also supports Duolingo vocabulary exports with nested structures:

```json
{
  "words": [
    { "word": "der Hund", "translation": "the dog" },
    { "target": "die Katze", "source": "the cat" }
  ]
}
```

## Project Structure

```
matching-game/
├── index.html           # Main HTML file
├── style.css           # Styles with dark/light mode support
├── app.js              # Game logic, audio, timer, statistics
├── words.json          # Word pairs for the game
├── generate-words.js   # Utility to generate words.json
├── sample-words.csv    # Sample CSV file
└── README.md          # This file
```

## Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript
- Web Speech API (for text-to-speech)
- localStorage API (for persistent statistics)
- Drag and Drop API

## Browser Compatibility

- Modern browsers with Web Speech API support (Chrome, Edge, Safari)
- localStorage support required for statistics persistence
- Drag and Drop API support required

## Customization

### Adding More Words

1. Edit `words.json` directly, or
2. Create a CSV/JSON file and use the generator:
   ```bash
   node generate-words.js --csv your-words.csv
   ```

### Styling

All theme colors are defined as CSS variables in `style.css`:
- Light mode: Default `:root` variables
- Dark mode: `body[data-theme="dark"]` variables

## License

Open source - feel free to use and modify!