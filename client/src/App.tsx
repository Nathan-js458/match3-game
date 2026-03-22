import { useState } from 'react';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'pink'];
const GRID_SIZE = 6;
const MATCH_SIZE = 3;
const ANIMATION_DELAY = 150;
const INITIAL_MOVES = 25;

interface GameState {
  grid: string[][];
  score: number;
  moves: number;
  movesRemaining: number;
  selectedTile: { row: number; col: number } | null;
  isAnimating: boolean;
  gameOver: boolean;
  history: Array<{ grid: string[][]; score: number; moves: number; movesRemaining: number }>;
}

// Utility functions
function generateInitialGrid(): string[][] {
  let grid: string[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
  }
  // Ensure no initial matches
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      while (hasMatchAt(grid, i, j)) {
        grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }
  }
  return grid;
}

function hasMatchAt(grid: string[][], row: number, col: number): boolean {
  const color = grid[row][col];
  let horizontalMatch = 1;
  for (let j = col - 1; j >= 0 && grid[row][j] === color; j--) horizontalMatch++;
  for (let j = col + 1; j < GRID_SIZE && grid[row][j] === color; j++) horizontalMatch++;
  if (horizontalMatch >= MATCH_SIZE) return true;

  let verticalMatch = 1;
  for (let i = row - 1; i >= 0 && grid[i][col] === color; i--) verticalMatch++;
  for (let i = row + 1; i < GRID_SIZE && grid[i][col] === color; i++) verticalMatch++;
  if (verticalMatch >= MATCH_SIZE) return true;

  return false;
}

function findMatches(grid: string[][]): Array<{ row: number; col: number }> {
  const matched = new Set<string>();

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - MATCH_SIZE + 1; j++) {
      const color = grid[i][j];
      let matchLength = 1;
      for (let k = j + 1; k < GRID_SIZE && grid[i][k] === color; k++) matchLength++;
      if (matchLength >= MATCH_SIZE) {
        for (let k = 0; k < matchLength; k++) matched.add(`${i},${j + k}`);
      }
    }
  }

  for (let j = 0; j < GRID_SIZE; j++) {
    for (let i = 0; i < GRID_SIZE - MATCH_SIZE + 1; i++) {
      const color = grid[i][j];
      let matchLength = 1;
      for (let k = i + 1; k < GRID_SIZE && grid[k][j] === color; k++) matchLength++;
      if (matchLength >= MATCH_SIZE) {
        for (let k = 0; k < matchLength; k++) matched.add(`${i + k},${j}`);
      }
    }
  }

  return Array.from(matched).map((pos) => {
    const [row, col] = pos.split(',').map(Number);
    return { row, col };
  });
}

function isAdjacent(pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean {
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.col - pos2.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    grid: generateInitialGrid(),
    score: 0,
    moves: INITIAL_MOVES,
    movesRemaining: INITIAL_MOVES,
    selectedTile: null,
    isAnimating: false,
    gameOver: false,
    history: [],
  });

  function handleTileClick(row: number, col: number) {
    if (gameState.isAnimating || gameState.gameOver) return;

    if (gameState.selectedTile === null) {
      setGameState((prev) => ({ ...prev, selectedTile: { row, col } }));
    } else {
      if (gameState.selectedTile.row === row && gameState.selectedTile.col === col) {
        setGameState((prev) => ({ ...prev, selectedTile: null }));
        return;
      }

      if (isAdjacent(gameState.selectedTile, { row, col })) {
        swapTiles(gameState.selectedTile.row, gameState.selectedTile.col, row, col);
      } else {
        setGameState((prev) => ({ ...prev, selectedTile: { row, col } }));
      }
    }
  }

  function swapTiles(row1: number, col1: number, row2: number, col2: number) {
    const newGrid = gameState.grid.map((r) => [...r]);
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = newGrid[row2][col2];
    newGrid[row2][col2] = temp;

    const newState = {
      ...gameState,
      grid: newGrid,
      moves: gameState.moves + 1,
      movesRemaining: gameState.movesRemaining - 1,
      selectedTile: null as { row: number; col: number } | null,
      isAnimating: true,
      history: [
        ...gameState.history,
        {
          grid: gameState.grid.map((r) => [...r]),
          score: gameState.score,
          moves: gameState.moves,
          movesRemaining: gameState.movesRemaining,
        },
      ],
    };

    setGameState(newState);

    setTimeout(() => {
      const matches = findMatches(newGrid);
      if (matches.length > 0) {
        processMatches(newGrid, matches);
      } else {
        const temp = newGrid[row1][col1];
        newGrid[row1][col1] = newGrid[row2][col2];
        newGrid[row2][col2] = temp;

        setGameState((prev) => ({
          ...prev,
          grid: newGrid,
          moves: prev.moves - 1,
          movesRemaining: prev.movesRemaining + 1,
          isAnimating: false,
          history: prev.history.slice(0, -1),
        }));
      }
    }, ANIMATION_DELAY);
  }

  function processMatches(grid: string[][], matches: Array<{ row: number; col: number }>) {
    const newGrid = grid.map((r) => [...r]);
    let newScore = gameState.score;

    matches.forEach(({ row, col }) => {
      newGrid[row][col] = '';
      newScore += 10;
    });

    setGameState((prev) => ({
      ...prev,
      grid: newGrid,
      score: newScore,
    }));

    setTimeout(() => {
      applyGravity(newGrid, newScore);
    }, ANIMATION_DELAY);
  }

  function applyGravity(grid: string[][], score: number) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const column = [];
      for (let i = 0; i < GRID_SIZE; i++) {
        if (grid[i][j] !== '') {
          column.push(grid[i][j]);
        }
      }
      for (let i = 0; i < GRID_SIZE; i++) {
        grid[i][j] = column[i] || '';
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === '') {
          grid[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
        }
      }
    }

    setGameState((prev) => ({
      ...prev,
      grid: grid.map((r) => [...r]),
    }));

    setTimeout(() => {
      const newMatches = findMatches(grid);
      if (newMatches.length > 0) {
        processMatches(grid, newMatches);
      } else {
        setGameState((prev) => ({
          ...prev,
          isAnimating: false,
        }));
        checkGameOver(grid);
      }
    }, ANIMATION_DELAY);
  }

  function checkGameOver(grid: string[][]) {
    if (gameState.movesRemaining <= 0) {
      setGameState((prev) => ({ ...prev, gameOver: true }));
      return;
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (j < GRID_SIZE - 1) {
          const temp = grid[i][j];
          grid[i][j] = grid[i][j + 1];
          grid[i][j + 1] = temp;
          if (findMatches(grid).length > 0) {
            grid[i][j + 1] = grid[i][j];
            grid[i][j] = temp;
            return;
          }
          grid[i][j + 1] = grid[i][j];
          grid[i][j] = temp;
        }

        if (i < GRID_SIZE - 1) {
          const temp = grid[i][j];
          grid[i][j] = grid[i + 1][j];
          grid[i + 1][j] = temp;
          if (findMatches(grid).length > 0) {
            grid[i + 1][j] = grid[i][j];
            grid[i][j] = temp;
            return;
          }
          grid[i + 1][j] = grid[i][j];
          grid[i][j] = temp;
        }
      }
    }

    setGameState((prev) => ({ ...prev, gameOver: true }));
  }

  function newGame() {
    setGameState({
      grid: generateInitialGrid(),
      score: 0,
      moves: 0,
      movesRemaining: INITIAL_MOVES,
      selectedTile: null,
      isAnimating: false,
      gameOver: false,
      history: [],
    });
  }

  function undo() {
    if (gameState.history.length === 0 || gameState.isAnimating) return;

    const previousState = gameState.history[gameState.history.length - 1];
    setGameState((prev) => ({
      ...prev,
      grid: previousState.grid.map((r) => [...r]),
      score: previousState.score,
      moves: previousState.moves,
      movesRemaining: previousState.movesRemaining,
      history: prev.history.slice(0, -1),
    }));
  }

  const getColorStyle = (color: string) => {
    const colorMap: Record<string, string> = {
      red: '#ff6b35',
      blue: '#4a90e2',
      green: '#2ecc71',
      yellow: '#f1c40f',
      purple: '#9b59b6',
      pink: '#e91e63',
    };
    return colorMap[color] || '#ccc';
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col items-center justify-center p-5">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="font-black text-5xl mb-2" style={{ fontFamily: 'Poppins' }}>
            MATCH-3
          </h1>
          <p className="text-sm text-gray-600 font-medium">Clique em peças adjacentes para combinar</p>
        </div>

        <div className="flex gap-8 mb-8">
          <div className="flex-1 bg-gray-100 border-4 border-gray-900 p-4">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {gameState.grid.map((row, i) =>
                row.map((color, j) => (
                  <button
                    key={`${i}-${j}`}
                    onClick={() => handleTileClick(i, j)}
                    className={`aspect-square border-2 border-gray-900 font-bold text-2xl transition-all ${
                      gameState.selectedTile?.row === i && gameState.selectedTile?.col === j
                        ? 'ring-4 ring-orange-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: getColorStyle(color),
                      color: color === 'yellow' ? '#1a1a1a' : 'white',
                    }}
                  />
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-100 border-4 border-gray-900 p-5 min-w-max">
            <div className="text-center mb-6">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-2">Pontos</div>
              <div className="font-mono text-4xl font-bold text-gray-900">{gameState.score}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-2">Movimentos</div>
              <div className="font-mono text-4xl font-bold text-gray-900">{gameState.movesRemaining}</div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-col">
          <button
            onClick={newGame}
            className="w-full py-3 px-6 bg-gray-900 text-white font-bold uppercase tracking-wider border-4 border-gray-900 hover:bg-orange-500 hover:border-orange-500 transition-all"
          >
            Novo Jogo
          </button>
          <button
            onClick={undo}
            className="w-full py-3 px-6 bg-transparent text-gray-900 font-bold uppercase tracking-wider border-4 border-gray-900 hover:bg-gray-100 transition-all"
          >
            Desfazer
          </button>
        </div>
      </div>

      {gameState.gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-white border-4 border-gray-900 p-10 text-center max-w-sm">
            <h2 className="font-black text-4xl mb-5" style={{ fontFamily: 'Poppins' }}>
              Fim de Jogo!
            </h2>
            <p className="text-gray-600 mb-6">Nenhum movimento disponível</p>
            <div className="font-mono text-6xl font-bold text-orange-500 mb-8">{gameState.score}</div>
            <button
              onClick={newGame}
              className="w-full py-3 px-6 bg-gray-900 text-white font-bold uppercase tracking-wider border-4 border-gray-900 hover:bg-orange-500 hover:border-orange-500 transition-all"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
