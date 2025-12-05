// Game state
let words = [];
let score = 0;
let matches = {};

// DOM elements
const germanWordsContainer = document.getElementById('german-words');
const englishWordsContainer = document.getElementById('english-words');
const scoreElement = document.getElementById('score');
const messageElement = document.getElementById('message');
const resetButton = document.getElementById('reset-btn');

// Shuffle array helper
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
        wordItem.textContent = word.german;
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
        messageElement.textContent = '🎉 Hoàn thành! Congratulations!';
        messageElement.style.color = '#27ae60';
    }
}

// Reset game
resetButton.addEventListener('click', initGame);

// Start game on page load
loadWords();
