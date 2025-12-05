# German-English Matching Game

An interactive drag-and-drop game for learning German vocabulary with audio pronunciation, timer, statistics tracking, and dark mode support.

## Features

- 🎯 **Drag & Drop Matching**: Match German words with their English translations
- 🔊 **Audio Pronunciation**: Click the speaker icon to hear German words pronounced
- ⏱️ **Timer & Speed Tracking**: Track your completion time and words per minute
- 💾 **Statistics**: Saves games played, high score, and best time to localStorage
- 🌙 **Dark/Light Mode**: Toggle between themes with preference saved
- 📊 **Score System**: +10 points for correct matches, -5 for incorrect attempts
- 📚 **Word Management**: Full CRUD functionality for managing vocabulary
  - View all words in table format (repository + user-added)
  - Search and filter words by source, status, or text
  - Add new custom words
  - Edit existing words (both repository and user-added)
  - Delete words with soft-delete (restorable)
  - Import words from JSON files (deduplicates automatically)
  - Export merged word list as JSON for GitHub commits

## How to Play

1. Open `index.html` in your browser
2. Drag German words from the left column to their matching English translations on the right
3. Click the 🔊 icon to hear pronunciation of German words
4. Complete all matches as quickly as possible to improve your time and WPM
5. Click "New Game" to shuffle words and start again
6. Click "📚 Manage Words" to add, edit, or manage your vocabulary

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
├── style.css            # Styles with dark/light mode support
├── app.js               # Game logic, audio, timer, statistics
├── word-manager.js      # Word management module (CRUD operations)
├── word-manager.css     # Word manager UI styles
├── words.json           # Word pairs for the game
├── generate-words.js    # Utility to generate words.json
├── sample-words.csv     # Sample CSV file
└── README.md            # This file
```

## Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript
- Web Speech API (for text-to-speech)
- localStorage API (for persistent statistics)
- Drag and Drop API

## Data Persistence

The application stores the following data in your browser's localStorage:
- **Statistics**: Games played, high score, and best time
- **Theme preference**: Light or dark mode
- **User words**: Custom words you've added
- **Word modifications**: Edits and deletions you've made

All data is stored locally in your browser and persists across sessions. The exported JSON file contains the merged word list (repository words + user words, with edits applied and deletions removed) that can be committed to GitHub.

## Browser Compatibility

- Modern browsers with Web Speech API support (Chrome, Edge, Safari)
- localStorage support required for statistics and word management
- Drag and Drop API support required

## Word Management

### Managing Words in the UI

Click the "📚 Manage Words" button to access the word management interface:

1. **View Words**: See all repository and user-added words in a table
2. **Search**: Use the search box to find specific words in German or English
3. **Filter**: Use the dropdown to filter by:
   - Active Words (default)
   - All Words
   - Repository Only
   - User Added
   - Edited Words
   - Deleted Words
4. **Add Words**: Click "➕ Add Word" to add custom vocabulary
5. **Edit Words**: Click the ✏️ icon to modify any word (repo or user-added)
6. **Delete Words**: Click the 🗑️ icon to soft-delete words (can be restored)
7. **Import**: Click "📥 Import JSON" to bulk-import words from a JSON file
8. **Export**: Click "📤 Export JSON" to download the merged word list

All user modifications are stored in your browser's localStorage and are automatically applied to the game.

### Adding More Words (Advanced)

1. Use the "📚 Manage Words" UI (recommended), or
2. Edit `words.json` directly, or
3. Create a CSV/JSON file and use the generator:
   ```bash
   node generate-words.js --csv your-words.csv
   ```

### Styling

All theme colors are defined as CSS variables in `style.css`:
- Light mode: Default `:root` variables
- Dark mode: `body[data-theme="dark"]` variables

## License

Open source - feel free to use and modify!