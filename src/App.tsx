import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Gamepad2, Github, Linkedin } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION: Direction = 'RIGHT';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>(INITIAL_FOOD);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snakeHighScore') || '0');
  });
  const [gridWidth, setGridWidth] = useState(25);
  const [gridHeight, setGridHeight] = useState(20);

  // Update grid size based on canvas size
  useEffect(() => {
    const updateGridSize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        setGridWidth(Math.floor(rect.width / GRID_SIZE));
        setGridHeight(Math.floor(rect.height / GRID_SIZE));
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, [gridWidth, gridHeight]);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood(INITIAL_SNAKE));
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameState('START');
  }, [generateFood]);

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
      return true;
    }
    // Self collision
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, [gridWidth, gridHeight]);

  const moveSnake = useCallback(() => {
    setSnake(currentSnake => {
      const newSnake = [...currentSnake];
      const head = { ...newSnake[0] };

      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      if (checkCollision(head, newSnake)) {
        setGameState('GAME_OVER');
        return currentSnake;
      }

      newSnake.unshift(head);

      // Check if food is eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snakeHighScore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, checkCollision, generateFood, highScore]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'PLAYING') return;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        e.preventDefault();
        setDirection(prev => prev !== 'DOWN' ? 'UP' : prev);
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        setDirection(prev => prev !== 'UP' ? 'DOWN' : prev);
        break;
      case 'arrowleft':
      case 'a':
        e.preventDefault();
        setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev);
        break;
      case 'arrowright':
      case 'd':
        e.preventDefault();
        setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev);
        break;
      case ' ':
        e.preventDefault();
        setGameState('PAUSED');
        break;
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Game loop
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = window.setInterval(moveSnake, 150);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, moveSnake]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= gridHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(canvas.width, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#10b981' : '#34d399';
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
      
      if (index === 0) {
        // Draw eyes on head
        ctx.fillStyle = '#1f2937';
        const eyeSize = 3;
        ctx.fillRect(
          segment.x * GRID_SIZE + 6,
          segment.y * GRID_SIZE + 5,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * GRID_SIZE + 11,
          segment.y * GRID_SIZE + 5,
          eyeSize,
          eyeSize
        );
      }
    });

    // Draw food
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2 - 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }, [snake, food, gridWidth, gridHeight]);

  const startGame = () => {
    if (gameState === 'START' || gameState === 'GAME_OVER') {
      if (gameState === 'GAME_OVER') {
        resetGame();
      }
      setGameState('START');
      setTimeout(() => setGameState('PLAYING'), 100);
    }
  };

  const togglePause = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };

  const handleTouch = (direction: Direction) => {
    if (gameState !== 'PLAYING') return;
    setDirection(prev => {
      switch (direction) {
        case 'UP': return prev !== 'DOWN' ? 'UP' : prev;
        case 'DOWN': return prev !== 'UP' ? 'DOWN' : prev;
        case 'LEFT': return prev !== 'RIGHT' ? 'LEFT' : prev;
        case 'RIGHT': return prev !== 'LEFT' ? 'RIGHT' : prev;
        default: return prev;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gamepad2 className="w-8 h-8 text-emerald-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Snake Game
            </h1>
          </div>
          <p className="text-gray-400">Use WASD or arrow keys to control the snake</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg px-6 py-3 border border-gray-700">
            <div className="text-sm text-gray-400">Score</div>
            <div className="text-2xl font-bold text-emerald-400">{score}</div>
          </div>
          
          <div className="flex items-center gap-4">
            {(gameState === 'START' || gameState === 'GAME_OVER') && (
              <button
                onClick={startGame}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                <Play className="w-5 h-5" />
                {gameState === 'GAME_OVER' ? 'Play Again' : 'Start Game'}
              </button>
            )}
            
            {gameState === 'PLAYING' && (
              <button
                onClick={togglePause}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            
            {gameState === 'PAUSED' && (
              <button
                onClick={togglePause}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                <Play className="w-5 h-5" />
                Resume
              </button>
            )}
            
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg px-6 py-3 border border-gray-700">
            <div className="text-sm text-gray-400 flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              High Score
            </div>
            <div className="text-2xl font-bold text-yellow-400">{highScore}</div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={400}
              className="border-2 border-gray-700 rounded-lg bg-gray-800 shadow-2xl"
            />
            
            {/* Game State Overlays */}
            {gameState === 'START' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
                  <p className="text-gray-300 mb-6">Collect orange food to grow your snake!</p>
                </div>
              </div>
            )}
            
            {gameState === 'PAUSED' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <Pause className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                  <h2 className="text-3xl font-bold">Game Paused</h2>
                </div>
              </div>
            )}
            
            {gameState === 'GAME_OVER' && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <h2 className="text-3xl font-bold mb-2 text-red-400">Game Over!</h2>
                  <p className="text-xl mb-4">Final Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="text-yellow-400 font-semibold mb-4">🎉 New High Score! 🎉</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Touch Controls for Mobile */}
        <div className="md:hidden">
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-2 max-w-48">
              <div></div>
              <button
                onTouchStart={() => handleTouch('UP')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-2xl transition-colors duration-200"
              >
                ↑
              </button>
              <div></div>
              <button
                onTouchStart={() => handleTouch('LEFT')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-2xl transition-colors duration-200"
              >
                ←
              </button>
              <div></div>
              <button
                onTouchStart={() => handleTouch('RIGHT')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-2xl transition-colors duration-200"
              >
                →
              </button>
              <div></div>
              <button
                onTouchStart={() => handleTouch('DOWN')}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-2xl transition-colors duration-200"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-400 mt-8">
          <p className="mb-2">Desktop: Use WASD or Arrow Keys to move • Spacebar to pause</p>
          <p>Mobile: Use the touch controls above</p>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-700">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Created by Michael Ysmael Jr. Fernandez</p>
            <div className="flex justify-center gap-6">
              <a
                href="https://github.com/michaelysmael10"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-200 group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/michael-ysmael-jr-fernandez-0b4318280/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;