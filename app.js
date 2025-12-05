// Game state
let words = [];
let currentGameWords = []; // Words selected for the current round
let score = 0;
let matches = {};
let startTime = null;
let timerInterval = null;

// Word Manager instance
let wordManager = null;

// Constants
const WORDS_PER_ROUND = 5;

// Statistics
let stats = {
    gamesPlayed: 0,
    highScore: 0,
    bestTime: null
};

// DOM elements
const germanWordsContainer = document.getElementById('german-words');
const englishWordsContainer = document.getElementById('english-words');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const resetButton = document.getElementById('reset-btn');
const timerElement = document.getElementById('timer');
const gamesPlayedElement = document.getElementById('games-played');
const highScoreElement = document.getElementById('high-score');
const bestTimeElement = document.getElementById('best-time');
const themeToggle = document.getElementById('theme-toggle');

// Shuffle array helper
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Word history management
function getToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function loadWordHistory() {
    try {
        const saved = localStorage.getItem('matchingGameWordHistory');
        if (!saved) {
            return { date: getToday(), previousRoundWords: [] };
        }
        
        const history = JSON.parse(saved);
        
        // Check if it's a new day - if so, reset the history
        if (history.date !== getToday()) {
            return { date: getToday(), previousRoundWords: [] };
        }
        
        return history;
    } catch (error) {
        console.error('Error loading word history:', error);
        return { date: getToday(), previousRoundWords: [] };
    }
}

function saveWordHistory(currentRoundWords) {
    try {
        const history = {
            date: getToday(),
            previousRoundWords: currentRoundWords // Only store the current round as "previous" for next round
        };
        localStorage.setItem('matchingGameWordHistory', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving word history:', error);
    }
}

function selectWordsForRound(allWords, previousRoundWords) {
    // If we have fewer words than needed, use all available words
    if (allWords.length <= WORDS_PER_ROUND) {
        return allWords;
    }
    
    // Filter out words from the immediate previous round only
    const availableWords = allWords.filter(word => 
        !previousRoundWords.includes(word.german)
    );
    
    // If we don't have enough unused words (shouldn't happen with 10 words and selecting 5),
    // just select from all words
    if (availableWords.length < WORDS_PER_ROUND) {
        const shuffled = shuffleArray(allWords);
        return shuffled.slice(0, WORDS_PER_ROUND);
    }
    
    // Shuffle available words and select the required amount
    const shuffled = shuffleArray(availableWords);
    return shuffled.slice(0, WORDS_PER_ROUND);
}

// Text-to-speech function for pronunciation
function speakGerman(text) {
    if ('speechSynthesis' in window) {
        try {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'de-DE'; // German language
            utterance.rate = 0.9; // Slightly slower for learning
            
            utterance.onerror = (event) => {
                console.warn('Speech synthesis error:', event.error);
            };
            
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.warn('Speech synthesis not available:', error);
        }
    }
}

// Timer functions
function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function getElapsedTime() {
    if (startTime) {
        return Math.floor((Date.now() - startTime) / 1000);
    }
    return 0;
}

function formatTime(seconds) {
    if (!seconds) return '--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// localStorage functions
function loadStats() {
    const saved = localStorage.getItem('matchingGameStats');
    if (saved) {
        stats = JSON.parse(saved);
    }
    updateStatsDisplay();
}

function saveStats() {
    localStorage.setItem('matchingGameStats', JSON.stringify(stats));
    updateStatsDisplay();
}

function updateStatsDisplay() {
    gamesPlayedElement.textContent = stats.gamesPlayed;
    highScoreElement.textContent = stats.highScore;
    bestTimeElement.textContent = formatTime(stats.bestTime);
}

// Theme functions
function loadTheme() {
    const savedTheme = localStorage.getItem('matchingGameTheme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('matchingGameTheme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('.theme-icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
}

// Load words from JSON
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const repoWords = await response.json();
        
        // Initialize word manager
        if (!wordManager) {
            wordManager = new WordManager();
        }
        wordManager.setRepoWords(repoWords);
        
        // Get merged words (repo + user, with edits applied)
        words = wordManager.getMergedWords();
        
        initGame();
    } catch (error) {
        console.error('Error loading words:', error);
        messageElement.textContent = 'Error loading words!';
        messageElement.style.color = '#dc3545';
    }
}

// Initialize game
function initGame() {
    score = 0;
    matches = {};
    scoreElement.textContent = score;
    messageElement.textContent = '';
    messageElement.style.color = '#27ae60';
    
    // Reset timer
    stopTimer();
    timerElement.textContent = '0:00';
    startTime = null;
    
    germanWordsContainer.innerHTML = '';
    englishWordsContainer.innerHTML = '';
    
    // Load word history and select words for this round
    const history = loadWordHistory();
    currentGameWords = selectWordsForRound(words, history.previousRoundWords);
    
    // Save current round words as "previous" for next round
    const currentRoundWords = currentGameWords.map(w => w.german);
    saveWordHistory(currentRoundWords);
    
    // Shuffle German words
    const shuffledGerman = shuffleArray(currentGameWords);
    
    // Shuffle English words separately
    const shuffledEnglish = shuffleArray(currentGameWords);
    
    // Create German word items (draggable)
    shuffledGerman.forEach((word, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        
        // Create text span
        const textSpan = document.createElement('span');
        textSpan.textContent = word.german;
        textSpan.className = 'word-text';
        
        // Create audio button
        const audioBtn = document.createElement('button');
        audioBtn.className = 'audio-btn';
        audioBtn.innerHTML = '🔊';
        audioBtn.setAttribute('aria-label', `Pronounce ${word.german}`);
        audioBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            speakGerman(word.german);
        };
        
        wordItem.appendChild(textSpan);
        wordItem.appendChild(audioBtn);
        
        wordItem.draggable = true;
        wordItem.dataset.german = word.german;
        wordItem.dataset.english = word.english;
        wordItem.dataset.index = index;
        
        // Drag events
        wordItem.addEventListener('dragstart', handleDragStart);
        wordItem.addEventListener('dragend', handleDragEnd);
        
        germanWordsContainer.appendChild(wordItem);
    });
    
    // Create English drop zones
    shuffledEnglish.forEach((word, index) => {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.textContent = word.english;
        dropZone.dataset.english = word.english;
        dropZone.dataset.index = index;
        
        // Drop events
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        
        englishWordsContainer.appendChild(dropZone);
    });
}

// Drag handlers
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    const dropZone = e.currentTarget;
    if (!dropZone.classList.contains('filled')) {
        dropZone.classList.add('drag-over');
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.preventDefault();
    
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    // Check if drop zone is already filled
    if (dropZone.classList.contains('filled')) {
        return false;
    }
    
    if (!draggedElement) {
        return false;
    }
    
    // Start timer on first move
    if (!startTime) {
        startTimer();
    }
    
    const germanWord = draggedElement.dataset.german;
    const correctEnglish = draggedElement.dataset.english;
    const dropEnglish = dropZone.dataset.english;
    
    // Check if match is correct
    const isCorrect = correctEnglish === dropEnglish;
    
    if (isCorrect) {
        // Correct match
        dropZone.classList.add('correct', 'filled');
        dropZone.textContent = `${germanWord} → ${dropEnglish}`;
        
        // Remove the dragged element
        draggedElement.remove();
        
        // Update score
        score += 10;
        scoreElement.textContent = score;
        
        // Store match
        matches[germanWord] = dropEnglish;
        
        // Check if all matches are complete
        checkCompletion();
    } else {
        // Incorrect match
        dropZone.classList.add('incorrect');
        
        // Remove incorrect class after animation
        setTimeout(() => {
            dropZone.classList.remove('incorrect');
        }, 500);
        
        // Deduct score
        score = Math.max(0, score - 5);
        scoreElement.textContent = score;
    }
    
    return false;
}

// Check if game is complete
function checkCompletion() {
    const remainingWords = germanWordsContainer.querySelectorAll('.word-item').length;
    
    if (remainingWords === 0) {
        stopTimer();
        const completionTime = getElapsedTime();
        const wordsMatched = Object.keys(matches).length;
        // Calculate words per minute: (words / seconds) * 60
        const wpm = completionTime > 0 ? Math.round((wordsMatched / completionTime) * 60) : 0;
        
        // Update statistics
        stats.gamesPlayed++;
        if (score > stats.highScore) {
            stats.highScore = score;
        }
        if (!stats.bestTime || completionTime < stats.bestTime) {
            stats.bestTime = completionTime;
        }
        saveStats();
        
        messageElement.textContent = `🎉 Complete! Time: ${formatTime(completionTime)} | Speed: ${wpm} WPM`;
        messageElement.style.color = '#27ae60';
    }
}

// Reset game
resetButton.addEventListener('click', initGame);

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Word Manager UI Logic
const manageWordsBtn = document.getElementById('manage-words-btn');
const wordManagerModal = document.getElementById('word-manager-modal');
const closeModalBtn = document.getElementById('close-modal');
const wordTableBody = document.getElementById('word-table-body');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-words');
const filterSelect = document.getElementById('filter-words');
const addWordBtn = document.getElementById('add-word-btn');
const importWordsBtn = document.getElementById('import-words-btn');
const exportWordsBtn = document.getElementById('export-words-btn');
const importFileInput = document.getElementById('import-file-input');

// Word form modal
const wordFormModal = document.getElementById('word-form-modal');
const wordForm = document.getElementById('word-form');
const formTitle = document.getElementById('form-title');
const wordGermanInput = document.getElementById('word-german');
const wordEnglishInput = document.getElementById('word-english');
const cancelFormBtn = document.getElementById('cancel-form-btn');
const formSuccess = document.getElementById('form-success');
const germanError = document.getElementById('german-error');
const englishError = document.getElementById('english-error');

let currentEditingWord = null;

// Open word manager
manageWordsBtn.addEventListener('click', () => {
    wordManagerModal.classList.add('active');
    refreshWordTable();
});

// Close word manager
closeModalBtn.addEventListener('click', () => {
    wordManagerModal.classList.remove('active');
});

// Close modal when clicking outside
wordManagerModal.addEventListener('click', (e) => {
    if (e.target === wordManagerModal) {
        wordManagerModal.classList.remove('active');
    }
});

// Refresh word table
function refreshWordTable() {
    const searchQuery = searchInput.value.trim();
    const filter = filterSelect.value;
    
    let wordsToShow = [];
    
    if (searchQuery) {
        wordsToShow = wordManager.searchWords(searchQuery);
    } else {
        wordsToShow = wordManager.filterWords(filter);
    }
    
    // Update statistics
    const allWords = wordManager.getAllWordsWithMetadata();
    const repoWords = allWords.filter(w => w.source === 'repo');
    const userWords = allWords.filter(w => w.source === 'user');
    const editedWords = allWords.filter(w => w.isEdited);
    const deletedWords = allWords.filter(w => w.isDeleted);
    const activeWords = allWords.filter(w => !w.isDeleted);
    
    document.getElementById('total-words-count').textContent = activeWords.length;
    document.getElementById('repo-words-count').textContent = repoWords.filter(w => !w.isDeleted).length;
    document.getElementById('user-words-count').textContent = userWords.filter(w => !w.isDeleted).length;
    document.getElementById('edited-words-count').textContent = editedWords.filter(w => !w.isDeleted).length;
    document.getElementById('deleted-words-count').textContent = deletedWords.length;
    
    // Render table
    if (wordsToShow.length === 0) {
        wordTableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    wordTableBody.innerHTML = wordsToShow.map(word => {
        const rowClass = word.isDeleted ? 'deleted' : '';
        const statusBadges = [];
        if (word.isEdited) statusBadges.push('<span class="status-badge edited">Edited</span>');
        if (word.isDeleted) statusBadges.push('<span class="status-badge deleted">Deleted</span>');
        
        const actions = word.isDeleted
            ? `<button class="action-btn restore" onclick="restoreWord('${escapeHtml(word.originalGerman)}')">🔄 Restore</button>`
            : `
                <button class="action-btn edit" onclick="editWord('${escapeHtml(word.originalGerman)}')">✏️ Edit</button>
                <button class="action-btn delete" onclick="deleteWord('${escapeHtml(word.originalGerman)}')">🗑️ Delete</button>
              `;
        
        return `
            <tr class="${rowClass}">
                <td>${escapeHtml(word.german)}</td>
                <td>${escapeHtml(word.english)}</td>
                <td><span class="source-badge ${word.source}">${word.source}</span></td>
                <td>${statusBadges.join(' ')}</td>
                <td>${actions}</td>
            </tr>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search and filter
searchInput.addEventListener('input', refreshWordTable);
filterSelect.addEventListener('change', refreshWordTable);

// Add word
addWordBtn.addEventListener('click', () => {
    currentEditingWord = null;
    formTitle.textContent = 'Add New Word';
    wordGermanInput.value = '';
    wordEnglishInput.value = '';
    wordGermanInput.disabled = false;
    formSuccess.style.display = 'none';
    germanError.style.display = 'none';
    englishError.style.display = 'none';
    wordFormModal.classList.add('active');
});

// Edit word
function editWord(originalGerman) {
    const allWords = wordManager.getAllWordsWithMetadata();
    const word = allWords.find(w => w.originalGerman === originalGerman);
    
    if (word) {
        currentEditingWord = originalGerman;
        formTitle.textContent = 'Edit Word';
        wordGermanInput.value = word.german;
        wordEnglishInput.value = word.english;
        formSuccess.style.display = 'none';
        germanError.style.display = 'none';
        englishError.style.display = 'none';
        wordFormModal.classList.add('active');
    }
}

// Delete word
function deleteWord(german) {
    if (confirm(`Are you sure you want to delete "${german}"? You can restore it later.`)) {
        wordManager.deleteWord(german);
        refreshWordTable();
        
        // Reload game words
        words = wordManager.getMergedWords();
        if (words.length > 0) {
            initGame();
        }
    }
}

// Restore word
function restoreWord(german) {
    wordManager.restoreWord(german);
    refreshWordTable();
    
    // Reload game words
    words = wordManager.getMergedWords();
    if (words.length > 0) {
        initGame();
    }
}

// Word form submit
wordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const german = wordGermanInput.value.trim();
    const english = wordEnglishInput.value.trim();
    
    germanError.style.display = 'none';
    englishError.style.display = 'none';
    
    if (!german) {
        germanError.textContent = 'German word is required';
        germanError.style.display = 'block';
        return;
    }
    
    if (!english) {
        englishError.textContent = 'English translation is required';
        englishError.style.display = 'block';
        return;
    }
    
    try {
        if (currentEditingWord) {
            // Edit existing word
            wordManager.editWord(currentEditingWord, german, english);
            formSuccess.textContent = 'Word updated successfully!';
        } else {
            // Add new word
            wordManager.addWord(german, english);
            formSuccess.textContent = 'Word added successfully!';
        }
        
        formSuccess.style.display = 'block';
        wordGermanInput.value = '';
        wordEnglishInput.value = '';
        
        // Close form after a short delay
        setTimeout(() => {
            wordFormModal.classList.remove('active');
            refreshWordTable();
            
            // Reload game words
            words = wordManager.getMergedWords();
            if (words.length > 0) {
                initGame();
            }
        }, 1000);
        
    } catch (error) {
        if (error.message === 'Word already exists') {
            germanError.textContent = 'This word already exists';
            germanError.style.display = 'block';
        } else if (error.message === 'German word already exists') {
            germanError.textContent = 'This German word already exists';
            germanError.style.display = 'block';
        } else {
            alert('Error: ' + error.message);
        }
    }
});

// Cancel form
cancelFormBtn.addEventListener('click', () => {
    wordFormModal.classList.remove('active');
});

// Close form modal when clicking outside
wordFormModal.addEventListener('click', (e) => {
    if (e.target === wordFormModal) {
        wordFormModal.classList.remove('active');
    }
});

// Import words
importWordsBtn.addEventListener('click', () => {
    importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedWords = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedWords)) {
                alert('Invalid JSON format. Expected an array of word objects.');
                return;
            }
            
            const result = wordManager.importWords(importedWords);
            alert(`Import complete!\nAdded: ${result.added} words\nSkipped: ${result.skipped} (already exist)`);
            
            refreshWordTable();
            
            // Reload game words
            words = wordManager.getMergedWords();
            if (words.length > 0) {
                initGame();
            }
            
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
});

// Export words
exportWordsBtn.addEventListener('click', () => {
    const jsonContent = wordManager.exportWords();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'words.json';
    a.click();
    URL.revokeObjectURL(url);
});

// Start game on page load
loadTheme();
loadStats();
loadWords();
