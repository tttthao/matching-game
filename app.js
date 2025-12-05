// Game state
let words = [];
let score = 0;
let matches = {};
let startTime = null;
let timerInterval = null;

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
        words = await response.json();
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
    
    // Shuffle German words
    const shuffledGerman = shuffleArray(words);
    
    // Shuffle English words separately
    const shuffledEnglish = shuffleArray(words);
    
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

// Start game on page load
loadTheme();
loadStats();
loadWords();
