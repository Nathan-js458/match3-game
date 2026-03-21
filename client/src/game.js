// Match-3 Game Logic
// Design: Minimalista e Moderno - Geometria pura, tipografia ousada, paleta monocromática com acento vibrante

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
const GRID_SIZE = 6;
const MATCH_SIZE = 3;
const ANIMATION_DELAY = 150;
const INITIAL_MOVES = 25; // Movimentos iniciais agradáveis

class Match3Game {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.moves = 0;
        this.movesRemaining = INITIAL_MOVES;
        this.history = [];
        this.selectedTile = null;
        this.isAnimating = false;
        this.gameOver = false;
        
        this.initializeGame();
        this.setupEventListeners();
        this.render();
    }

    initializeGame() {
        this.grid = this.generateGrid();
        this.score = 0;
        this.moves = 0;
        this.movesRemaining = INITIAL_MOVES;
        this.history = [];
        this.selectedTile = null;
        this.isAnimating = false;
        this.gameOver = false;
        this.ensureValidBoard();
    }

    generateGrid() {
        const grid = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            grid[i] = [];
            for (let j = 0; j < GRID_SIZE; j++) {
                grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
            }
        }
        return grid;
    }

    ensureValidBoard() {
        // Remove initial matches
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                while (this.hasMatchAt(i, j)) {
                    this.grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
                }
            }
        }
    }

    setupEventListeners() {
        const gameGrid = document.getElementById('gameGrid');
        if (gameGrid) {
            gameGrid.addEventListener('click', (e) => this.handleTileClick(e));
        }

        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.addEventListener('click', () => this.newGame());
        }

        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.newGame());
        }
    }

    handleTileClick(e) {
        if (this.isAnimating || this.gameOver) return;

        const target = e.target;
        if (!target.classList.contains('tile')) return;

        const row = parseInt(target.dataset.row || '0');
        const col = parseInt(target.dataset.col || '0');

        if (this.selectedTile === null) {
            this.selectedTile = { row, col };
            this.render();
        } else {
            if (this.selectedTile.row === row && this.selectedTile.col === col) {
                this.selectedTile = null;
                this.render();
                return;
            }

            if (this.isAdjacent(this.selectedTile, { row, col })) {
                this.swapTiles(this.selectedTile.row, this.selectedTile.col, row, col);
            }

            this.selectedTile = null;
        }
    }

    isAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapTiles(row1, col1, row2, col2) {
        // Save state for undo
        this.saveState();

        // Swap
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        this.moves++;
        this.movesRemaining--;

        // Check for matches
        this.isAnimating = true;
        setTimeout(() => {
            const matches = this.findMatches();
            if (matches.length > 0) {
                this.processMatches(matches);
            } else {
                // Swap back if no matches
                const temp = this.grid[row1][col1];
                this.grid[row1][col1] = this.grid[row2][col2];
                this.grid[row2][col2] = temp;
                this.moves--;
                this.movesRemaining++;
                this.history.pop();
                this.isAnimating = false;
                this.render();
            }
        }, ANIMATION_DELAY);
    }

    saveState() {
        this.history.push({
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score,
            moves: this.moves,
            movesRemaining: this.movesRemaining,
        });
    }

    undo() {
        if (this.history.length === 0 || this.isAnimating) return;

        const previousState = this.history.pop();
        if (previousState) {
            this.grid = JSON.parse(JSON.stringify(previousState.grid));
            this.movesRemaining = previousState.movesRemaining;
            this.score = previousState.score;
            this.moves = previousState.moves;
            this.render();
        }
    }

    findMatches() {
        const matched = new Set();

        // Check horizontal
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE - MATCH_SIZE + 1; j++) {
                const color = this.grid[i][j];
                let matchLength = 1;
                for (let k = j + 1; k < GRID_SIZE && this.grid[i][k] === color; k++) {
                    matchLength++;
                }
                if (matchLength >= MATCH_SIZE) {
                    for (let k = 0; k < matchLength; k++) {
                        matched.add(`${i},${j + k}`);
                    }
                }
            }
        }

        // Check vertical
        for (let j = 0; j < GRID_SIZE; j++) {
            for (let i = 0; i < GRID_SIZE - MATCH_SIZE + 1; i++) {
                const color = this.grid[i][j];
                let matchLength = 1;
                for (let k = i + 1; k < GRID_SIZE && this.grid[k][j] === color; k++) {
                    matchLength++;
                }
                if (matchLength >= MATCH_SIZE) {
                    for (let k = 0; k < matchLength; k++) {
                        matched.add(`${i + k},${j}`);
                    }
                }
            }
        }

        return Array.from(matched).map((pos) => {
            const [row, col] = pos.split(',').map(Number);
            return { row, col };
        });
    }

    hasMatchAt(row, col) {
        const color = this.grid[row][col];

        // Check horizontal
        let horizontalMatch = 1;
        for (let j = col - 1; j >= 0 && this.grid[row][j] === color; j--) horizontalMatch++;
        for (let j = col + 1; j < GRID_SIZE && this.grid[row][j] === color; j++) horizontalMatch++;
        if (horizontalMatch >= MATCH_SIZE) return true;

        // Check vertical
        let verticalMatch = 1;
        for (let i = row - 1; i >= 0 && this.grid[i][col] === color; i--) verticalMatch++;
        for (let i = row + 1; i < GRID_SIZE && this.grid[i][col] === color; i++) verticalMatch++;
        if (verticalMatch >= MATCH_SIZE) return true;

        return false;
    }

    processMatches(matches) {
        // Remove matched tiles
        matches.forEach(({ row, col }) => {
            this.grid[row][col] = '';
            this.score += 10;
        });

        this.render();

        setTimeout(() => {
            this.applyGravity();
        }, ANIMATION_DELAY);
    }

    applyGravity() {
        for (let j = 0; j < GRID_SIZE; j++) {
            const column = [];
            for (let i = 0; i < GRID_SIZE; i++) {
                if (this.grid[i][j] !== '') {
                    column.push(this.grid[i][j]);
                }
            }

            for (let i = 0; i < GRID_SIZE; i++) {
                this.grid[i][j] = column[i] || '';
            }
        }

        // Fill empty spaces
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (this.grid[i][j] === '') {
                    this.grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
                }
            }
        }

        this.render();

        setTimeout(() => {
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.processMatches(newMatches);
            } else {
                this.isAnimating = false;
                this.checkGameOver();
                this.render();
            }
        }, ANIMATION_DELAY);
    }

    checkGameOver() {
        // Check if movesRemaining is 0
        if (this.movesRemaining <= 0) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        // Check if any valid moves exist
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                // Check right
                if (j < GRID_SIZE - 1) {
                    const temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i][j + 1];
                    this.grid[i][j + 1] = temp;

                    if (this.findMatches().length > 0) {
                        // Swap back
                        this.grid[i][j + 1] = this.grid[i][j];
                        this.grid[i][j] = temp;
                        return;
                    }

                    // Swap back
                    this.grid[i][j + 1] = this.grid[i][j];
                    this.grid[i][j] = temp;
                }

                // Check down
                if (i < GRID_SIZE - 1) {
                    const temp = this.grid[i][j];
                    this.grid[i][j] = this.grid[i + 1][j];
                    this.grid[i + 1][j] = temp;

                    if (this.findMatches().length > 0) {
                        // Swap back
                        this.grid[i + 1][j] = this.grid[i][j];
                        this.grid[i][j] = temp;
                        return;
                    }

                    // Swap back
                    this.grid[i + 1][j] = this.grid[i][j];
                    this.grid[i][j] = temp;
                }
            }
        }

        this.gameOver = true;
        this.showGameOver();
    }

    showGameOver() {
        const modal = document.getElementById('gameOverModal');
        const finalScore = document.getElementById('finalScore');
        if (modal && finalScore) {
            finalScore.textContent = this.score.toString();
            modal.classList.add('active');
        }
    }

    hideGameOver() {
        const modal = document.getElementById('gameOverModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    newGame() {
        this.hideGameOver();
        this.initializeGame();
        this.render();
    }

    render() {
        this.renderGrid();
        this.updateStats();
    }

    renderGrid() {
        const gameGrid = document.getElementById('gameGrid');
        if (!gameGrid) return;

        gameGrid.innerHTML = '';

        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const tile = document.createElement('div');
                tile.className = `tile ${this.grid[i][j]}`;
                tile.dataset.row = i.toString();
                tile.dataset.col = j.toString();
                tile.textContent = '';

                if (this.selectedTile && this.selectedTile.row === i && this.selectedTile.col === j) {
                    tile.classList.add('selected');
                }

                gameGrid.appendChild(tile);
            }
        }
    }

    updateStats() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const movesDisplay = document.getElementById('movesDisplay');

        if (scoreDisplay) scoreDisplay.textContent = this.score.toString();
        if (movesDisplay) movesDisplay.textContent = this.movesRemaining.toString();
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Match3Game();
});
