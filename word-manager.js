/**
 * Word Manager Module
 * Manages words from repository and user additions
 * Stores user data in localStorage
 */

class WordManager {
    constructor() {
        this.repoWords = []; // Words from words.json
        this.userWords = []; // User-added words
        this.editedWords = {}; // Edited words: key = original german, value = {german, english}
        this.deletedWords = new Set(); // Soft-deleted words (german text)
        this.storageKey = 'matchingGameUserData';
        this.loadUserData();
    }

    // Load user data from localStorage
    loadUserData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                this.userWords = parsed.userWords || [];
                this.editedWords = parsed.editedWords || {};
                this.deletedWords = new Set(parsed.deletedWords || []);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Save user data to localStorage
    saveUserData() {
        try {
            const data = {
                userWords: this.userWords,
                editedWords: this.editedWords,
                deletedWords: Array.from(this.deletedWords)
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    // Set repository words (from words.json)
    setRepoWords(words) {
        this.repoWords = words;
    }

    // Get merged word list (repo + user, with edits applied, deleted filtered out)
    getMergedWords() {
        const merged = [];
        const seen = new Set();

        // Process repo words
        this.repoWords.forEach(word => {
            const key = word.german;
            
            // Skip if deleted
            if (this.deletedWords.has(key)) {
                return;
            }

            // Apply edits if exists
            if (this.editedWords[key]) {
                merged.push({ ...this.editedWords[key] });
                seen.add(this.editedWords[key].german);
            } else {
                merged.push({ ...word });
                seen.add(word.german);
            }
        });

        // Add user words
        this.userWords.forEach(word => {
            const key = word.german;
            
            // Skip if deleted
            if (this.deletedWords.has(key)) {
                return;
            }

            // Apply edits if exists
            if (this.editedWords[key]) {
                if (!seen.has(this.editedWords[key].german)) {
                    merged.push({ ...this.editedWords[key] });
                    seen.add(this.editedWords[key].german);
                }
            } else {
                if (!seen.has(word.german)) {
                    merged.push({ ...word });
                    seen.add(word.german);
                }
            }
        });

        return merged;
    }

    // Get all words with metadata for management UI
    getAllWordsWithMetadata() {
        const words = [];
        const seen = new Set();

        // Process repo words
        this.repoWords.forEach(word => {
            const key = word.german;
            const isDeleted = this.deletedWords.has(key);
            const isEdited = !!this.editedWords[key];
            
            words.push({
                originalGerman: word.german,
                originalEnglish: word.english,
                german: isEdited ? this.editedWords[key].german : word.german,
                english: isEdited ? this.editedWords[key].english : word.english,
                source: 'repo',
                isDeleted,
                isEdited
            });
            seen.add(key);
        });

        // Process user words
        this.userWords.forEach(word => {
            const key = word.german;
            if (seen.has(key)) return;
            
            const isDeleted = this.deletedWords.has(key);
            const isEdited = !!this.editedWords[key];
            
            words.push({
                originalGerman: word.german,
                originalEnglish: word.english,
                german: isEdited ? this.editedWords[key].german : word.german,
                english: isEdited ? this.editedWords[key].english : word.english,
                source: 'user',
                isDeleted,
                isEdited
            });
        });

        return words;
    }

    // Add a new word
    addWord(german, english) {
        // Check if word already exists (in repo or user words)
        const exists = this.repoWords.some(w => w.german === german) ||
                      this.userWords.some(w => w.german === german);
        
        if (exists) {
            throw new Error('Word already exists');
        }

        this.userWords.push({ german, english });
        this.saveUserData();
        return true;
    }

    // Edit a word
    editWord(originalGerman, newGerman, newEnglish) {
        // Check if new german word conflicts with existing words (except the one being edited)
        const conflictInRepo = this.repoWords.some(w => w.german === newGerman && w.german !== originalGerman);
        const conflictInUser = this.userWords.some(w => w.german === newGerman && w.german !== originalGerman);
        
        // Also check against edited words
        const conflictInEdited = Object.entries(this.editedWords).some(([orig, edited]) => 
            edited.german === newGerman && orig !== originalGerman
        );
        
        if (conflictInRepo || conflictInUser || conflictInEdited) {
            throw new Error('German word already exists');
        }

        this.editedWords[originalGerman] = { german: newGerman, english: newEnglish };
        this.saveUserData();
        return true;
    }

    // Delete a word (soft delete)
    deleteWord(german) {
        this.deletedWords.add(german);
        this.saveUserData();
        return true;
    }

    // Restore a deleted word
    restoreWord(german) {
        this.deletedWords.delete(german);
        this.saveUserData();
        return true;
    }

    // Import words from JSON (only add new ones)
    importWords(words) {
        let added = 0;
        let skipped = 0;

        words.forEach(word => {
            if (!word.german || !word.english) {
                skipped++;
                return;
            }

            // Check if word exists (including edited versions)
            const existsInRepo = this.repoWords.some(w => w.german === word.german);
            const existsInUser = this.userWords.some(w => w.german === word.german);
            const existsInEdited = Object.values(this.editedWords).some(w => w.german === word.german);
            
            if (!existsInRepo && !existsInUser && !existsInEdited) {
                this.userWords.push({ german: word.german, english: word.english });
                added++;
            } else {
                skipped++;
            }
        });

        this.saveUserData();
        return { added, skipped };
    }

    // Export merged words as JSON
    exportWords() {
        const merged = this.getMergedWords();
        return JSON.stringify(merged, null, 2);
    }

    // Search words
    searchWords(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllWordsWithMetadata().filter(word => 
            word.german.toLowerCase().includes(lowerQuery) ||
            word.english.toLowerCase().includes(lowerQuery)
        );
    }

    // Filter words
    filterWords(filter) {
        const allWords = this.getAllWordsWithMetadata();
        
        if (filter === 'all') {
            return allWords;
        } else if (filter === 'repo') {
            return allWords.filter(w => w.source === 'repo');
        } else if (filter === 'user') {
            return allWords.filter(w => w.source === 'user');
        } else if (filter === 'edited') {
            return allWords.filter(w => w.isEdited);
        } else if (filter === 'deleted') {
            return allWords.filter(w => w.isDeleted);
        } else if (filter === 'active') {
            return allWords.filter(w => !w.isDeleted);
        }
        
        return allWords;
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WordManager;
}
