// Game State
const GRID_SIZE = 8;
let grid = [];
let score = 0;
let highScore = 0;
let currentBlocks = [];
let draggedBlock = null;
let draggedBlockIndex = null;

// Block Shapes (Tetris-like pieces)
const BLOCK_SHAPES = [
    // Single block
    [[1]],

    // 2x1 horizontal
    [[1, 1]],

    // 2x1 vertical
    [[1], [1]],

    // 3x1 horizontal
    [[1, 1, 1]],

    // 3x1 vertical
    [[1], [1], [1]],

    // 2x2 square
    [[1, 1], [1, 1]],

    // L-shape (4 variations)
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]],
    [[0, 0, 1], [1, 1, 1]],

    // T-shape (4 variations)
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],

    // Z-shape (2 variations)
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],

    // 3x3 square
    [[1, 1, 1], [1, 1, 1], [1, 1, 1]],

    // Plus shape
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]],

    // 4x1 horizontal
    [[1, 1, 1, 1]],

    // 4x1 vertical
    [[1], [1], [1], [1]],

    // 5x1 horizontal
    [[1, 1, 1, 1, 1]],
];

// Block Colors
const BLOCK_COLORS = [
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];

// DOM Elements
const gameGrid = document.getElementById('gameGrid');
const blocksContainer = document.getElementById('blocksContainer');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const gameOverModal = document.getElementById('gameOverModal');
const restartButton = document.getElementById('restartButton');
const comboIndicator = document.getElementById('comboIndicator');
const highScoreBadge = document.getElementById('highScoreBadge');
const particlesContainer = document.getElementById('particlesContainer');

// Initialize Game
function initGame() {
    // Grid now stores null (empty) or color string (filled)
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    score = 0;
    loadHighScore();
    updateScore();
    createGrid();
    generateNewBlocks();
    gameOverModal.classList.remove('show');
}

// Create Grid
function createGrid() {
    gameGrid.innerHTML = '';
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            gameGrid.appendChild(cell);
        }
    }
    updateGridDisplay();
}

// Update Grid Display
function updateGridDisplay() {
    const cells = gameGrid.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const color = grid[row][col];
        if (color) {
            cell.classList.add('filled');
            cell.style.background = color;
        } else {
            cell.classList.remove('filled');
            cell.style.background = '';
        }
    });
}

// Check if a specific shape can be placed anywhere on the grid
function canShapeBePlaced(shape) {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (canPlaceBlock(row, col, shape)) {
                return true;
            }
        }
    }
    return false;
}

// Get all shapes that can currently be placed
function getPlaceableShapes() {
    return BLOCK_SHAPES.filter(shape => canShapeBePlaced(shape));
}

// Generate New Blocks - Smart generation ensures at least one block can be placed
function generateNewBlocks() {
    currentBlocks = [];
    const blockPreviews = [
        document.getElementById('block1'),
        document.getElementById('block2'),
        document.getElementById('block3')
    ];

    // Get shapes that can actually be placed
    const placeableShapes = getPlaceableShapes();

    // If no shapes can be placed, game over
    if (placeableShapes.length === 0) {
        gameOver();
        return;
    }

    // Generate 3 blocks, ensuring at least one is placeable
    let guaranteedPlaceable = false;

    blockPreviews.forEach((preview, index) => {
        let shape;
        const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

        // For the last block, if none are placeable yet, force a placeable one
        if (index === 2 && !guaranteedPlaceable) {
            shape = placeableShapes[Math.floor(Math.random() * placeableShapes.length)];
            guaranteedPlaceable = true;
        } else {
            // 70% chance to pick from all shapes, 30% chance to pick placeable
            if (Math.random() < 0.7) {
                shape = BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)];
            } else {
                shape = placeableShapes[Math.floor(Math.random() * placeableShapes.length)];
            }

            // Track if this shape is placeable
            if (canShapeBePlaced(shape)) {
                guaranteedPlaceable = true;
            }
        }

        currentBlocks.push({ shape, color, used: false });
        renderBlockPreview(preview, shape, color, index);
    });
}

// Render Block Preview
function renderBlockPreview(container, shape, color, index) {
    container.innerHTML = '';
    container.classList.remove('disabled');

    // Responsive cell size
    const isMobile = window.innerWidth <= 480;
    const cellSize = isMobile ? 22 : 28;

    const blockGrid = document.createElement('div');
    blockGrid.style.display = 'grid';
    blockGrid.style.gridTemplateColumns = `repeat(${shape[0].length}, ${cellSize}px)`;
    blockGrid.style.gap = '3px';

    shape.forEach(row => {
        row.forEach(cell => {
            const cellDiv = document.createElement('div');
            if (cell) {
                cellDiv.className = 'block-cell';
                cellDiv.style.width = cellSize + 'px';
                cellDiv.style.height = cellSize + 'px';
                cellDiv.style.background = color;
            } else {
                cellDiv.style.width = cellSize + 'px';
                cellDiv.style.height = cellSize + 'px';
            }
            blockGrid.appendChild(cellDiv);
        });
    });

    container.appendChild(blockGrid);
    setupDragAndDrop(container, index);
}

// Setup Drag and Drop
function setupDragAndDrop(element, blockIndex) {
    element.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e, blockIndex);
    });

    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(e, blockIndex);
    }, { passive: false });
}

function startDrag(e, blockIndex) {
    if (currentBlocks[blockIndex].used) return;

    draggedBlock = currentBlocks[blockIndex];
    draggedBlockIndex = blockIndex;

    const preview = document.getElementById(`block${blockIndex + 1}`);
    preview.classList.add('dragging');

    const floatingBlock = createFloatingBlock(draggedBlock.shape, draggedBlock.color);
    document.body.appendChild(floatingBlock);

    const shape = draggedBlock.shape;
    const blockRows = shape.length;
    const blockCols = shape[0].length;

    // Offset to center block on cursor
    const offsetRows = Math.floor(blockRows / 2);
    const offsetCols = Math.floor(blockCols / 2);

    let currentTargetRow = null;
    let currentTargetCol = null;

    const getCoords = (event) => {
        if (event.touches && event.touches.length > 0) {
            return { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
        if (event.changedTouches && event.changedTouches.length > 0) {
            return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
        }
        return { x: event.clientX, y: event.clientY };
    };

    const findTargetCell = (x, y) => {
        const cells = gameGrid.querySelectorAll('.cell');
        for (const cell of cells) {
            const rect = cell.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return {
                    row: parseInt(cell.dataset.row),
                    col: parseInt(cell.dataset.col)
                };
            }
        }
        return null;
    };

    const moveHandler = (moveEvent) => {
        moveEvent.preventDefault();
        const coords = getCoords(moveEvent);

        floatingBlock.style.left = coords.x + 'px';
        floatingBlock.style.top = coords.y + 'px';

        clearHighlights();

        const cell = findTargetCell(coords.x, coords.y);
        if (cell) {
            // Apply offset to center the block on cursor
            currentTargetRow = cell.row - offsetRows;
            currentTargetCol = cell.col - offsetCols;
            highlightPlacement(currentTargetRow, currentTargetCol, shape);
        } else {
            currentTargetRow = null;
            currentTargetCol = null;
        }
    };

    const endHandler = (endEvent) => {
        floatingBlock.remove();
        preview.classList.remove('dragging');
        clearHighlights();

        if (currentTargetRow !== null && currentTargetCol !== null) {
            if (canPlaceBlock(currentTargetRow, currentTargetCol, shape)) {
                placeBlock(currentTargetRow, currentTargetCol, shape, blockIndex);
            }
        }

        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', endHandler);
        document.removeEventListener('touchmove', moveHandler);
        document.removeEventListener('touchend', endHandler);

        draggedBlock = null;
        draggedBlockIndex = null;
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);

    const coords = getCoords(e);
    floatingBlock.style.left = coords.x + 'px';
    floatingBlock.style.top = coords.y + 'px';
}

function createFloatingBlock(shape, color) {
    // Use smaller cells on mobile
    const isMobile = window.innerWidth <= 480;
    const cellSize = isMobile ? 22 : 28;

    const block = document.createElement('div');
    block.style.position = 'fixed';
    block.style.pointerEvents = 'none';
    block.style.zIndex = '10000';
    block.style.transform = 'translate(-50%, -50%) scale(1.1)';
    block.style.display = 'grid';
    block.style.gridTemplateColumns = `repeat(${shape[0].length}, ${cellSize}px)`;
    block.style.gap = '3px';
    block.style.filter = 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))';

    shape.forEach(row => {
        row.forEach(cell => {
            const cellDiv = document.createElement('div');
            if (cell) {
                cellDiv.style.width = cellSize + 'px';
                cellDiv.style.height = cellSize + 'px';
                cellDiv.style.background = color;
                cellDiv.style.borderRadius = '6px';
                cellDiv.style.border = '1px solid rgba(255,255,255,0.3)';
                cellDiv.style.boxShadow = 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)';
            } else {
                cellDiv.style.width = cellSize + 'px';
                cellDiv.style.height = cellSize + 'px';
            }
            block.appendChild(cellDiv);
        });
    });

    return block;
}

function highlightPlacement(row, col, shape) {
    const isValid = canPlaceBlock(row, col, shape);

    // Highlight the block placement cells
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const targetRow = row + r;
                const targetCol = col + c;
                if (targetRow >= 0 && targetRow < GRID_SIZE && targetCol >= 0 && targetCol < GRID_SIZE) {
                    const cell = gameGrid.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                    if (cell) {
                        cell.classList.add(isValid ? 'hover-valid' : 'hover-invalid');
                    }
                }
            }
        }
    }

    // If valid placement, check for line clears and highlight them
    if (isValid) {
        const linesToClear = getLinesToClearPreview(row, col, shape);
        linesToClear.forEach(line => {
            if (line.type === 'row') {
                for (let c = 0; c < GRID_SIZE; c++) {
                    const cell = gameGrid.querySelector(`[data-row="${line.index}"][data-col="${c}"]`);
                    if (cell) cell.classList.add('will-clear');
                }
            } else {
                for (let r = 0; r < GRID_SIZE; r++) {
                    const cell = gameGrid.querySelector(`[data-row="${r}"][data-col="${line.index}"]`);
                    if (cell) cell.classList.add('will-clear');
                }
            }
        });
    }
}

// Preview which lines would be cleared if block is placed
function getLinesToClearPreview(row, col, shape) {
    // Create a temporary grid copy with the block placed
    const tempGrid = grid.map(r => [...r]);

    // Place the block temporarily
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                tempGrid[row + r][col + c] = 'temp';
            }
        }
    }

    const linesToClear = [];

    // Check rows
    for (let r = 0; r < GRID_SIZE; r++) {
        if (tempGrid[r].every(cell => cell !== null)) {
            linesToClear.push({ type: 'row', index: r });
        }
    }

    // Check columns
    for (let c = 0; c < GRID_SIZE; c++) {
        if (tempGrid.every(row => row[c] !== null)) {
            linesToClear.push({ type: 'col', index: c });
        }
    }

    return linesToClear;
}

function clearHighlights() {
    gameGrid.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('hover-valid', 'hover-invalid', 'will-clear');
    });
}

function canPlaceBlock(row, col, shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const targetRow = row + r;
                const targetCol = col + c;
                // Check bounds (including negative values) and collision
                if (targetRow < 0 || targetCol < 0 || targetRow >= GRID_SIZE || targetCol >= GRID_SIZE || grid[targetRow]?.[targetCol]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock(row, col, shape, blockIndex) {
    // Place block on grid with its color
    const color = currentBlocks[blockIndex].color;
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                grid[row + r][col + c] = color;
            }
        }
    }

    // Mark block as used
    currentBlocks[blockIndex].used = true;
    const preview = document.getElementById(`block${blockIndex + 1}`);
    preview.classList.add('disabled');

    // Update display
    updateGridDisplay();

    // Add points for placing block
    const blockSize = shape.flat().filter(cell => cell).length;
    score += blockSize;

    // Check for line clears
    const clearedLines = checkAndClearLines();

    // Check if all blocks are used - generate new blocks
    if (currentBlocks.every(block => block.used)) {
        setTimeout(() => generateNewBlocks(), 500);
    } else {
        // Check if remaining blocks can still be placed
        // Wait for line clear animation before checking
        setTimeout(() => {
            if (!hasValidMoves()) {
                gameOver();
            }
        }, clearedLines > 0 ? 600 : 100);
    }

    updateScore();
}

function checkAndClearLines() {
    const linesToClear = [];

    // Check rows (cell is filled if it has a color string)
    for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row].every(cell => cell !== null)) {
            linesToClear.push({ type: 'row', index: row });
        }
    }

    // Check columns
    for (let col = 0; col < GRID_SIZE; col++) {
        if (grid.every(row => row[col] !== null)) {
            linesToClear.push({ type: 'col', index: col });
        }
    }

    if (linesToClear.length > 0) {
        clearLines(linesToClear);
    }

    return linesToClear.length;
}

function clearLines(lines) {
    // Animate clearing
    lines.forEach(line => {
        if (line.type === 'row') {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = gameGrid.querySelector(`[data-row="${line.index}"][data-col="${col}"]`);
                cell.classList.add('clearing');
                createParticles(cell);
            }
        } else {
            for (let row = 0; row < GRID_SIZE; row++) {
                const cell = gameGrid.querySelector(`[data-row="${row}"][data-col="${line.index}"]`);
                cell.classList.add('clearing');
                createParticles(cell);
            }
        }
    });

    // Clear after animation
    setTimeout(() => {
        lines.forEach(line => {
            if (line.type === 'row') {
                grid[line.index].fill(null);
            } else {
                grid.forEach(row => row[line.index] = null);
            }
        });

        updateGridDisplay();
        gameGrid.querySelectorAll('.clearing').forEach(cell => cell.classList.remove('clearing'));

        // Calculate score
        const basePoints = lines.length * 10;
        const comboMultiplier = lines.length;
        const totalPoints = basePoints * comboMultiplier;
        score += totalPoints;

        // Show combo
        if (lines.length > 1) {
            showCombo(lines.length, totalPoints);
        }

        updateScore();
    }, 500);
}

function createParticles(cell) {
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.background = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

        const angle = (Math.PI * 2 * i) / 8;
        const distance = 50 + Math.random() * 50;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');

        particlesContainer.appendChild(particle);

        setTimeout(() => particle.remove(), 1000);
    }
}

function showCombo(count, points) {
    const comboText = comboIndicator.querySelector('.combo-text');
    comboText.textContent = `${count}x COMBO! +${points}`;
    comboIndicator.classList.add('show');

    setTimeout(() => {
        comboIndicator.classList.remove('show');
    }, 1000);
}

function hasValidMoves() {
    for (let block of currentBlocks) {
        if (block.used) continue;
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (canPlaceBlock(row, col, block.shape)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function gameOver() {
    finalScoreElement.textContent = score;

    if (score > highScore) {
        highScore = score;
        saveHighScore();
        highScoreBadge.style.display = 'block';
    } else {
        highScoreBadge.style.display = 'none';
    }

    gameOverModal.classList.add('show');
}

function updateScore() {
    scoreElement.textContent = score;

    // Update high score in real-time if current score beats it
    if (score > highScore) {
        highScore = score;
        saveHighScore();
    }

    highScoreElement.textContent = highScore;
}

function saveHighScore() {
    try {
        localStorage.setItem('stackFieldHighScore', highScore.toString());
    } catch (e) {
        console.log('Could not save high score:', e);
    }
}

function loadHighScore() {
    try {
        const saved = localStorage.getItem('stackFieldHighScore');
        highScore = saved ? parseInt(saved, 10) : 0;
        // Validate the loaded value
        if (isNaN(highScore) || highScore < 0) {
            highScore = 0;
        }
    } catch (e) {
        console.log('Could not load high score:', e);
        highScore = 0;
    }
}

// Event Listeners
restartButton.addEventListener('click', initGame);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}

// Start Game
initGame();
