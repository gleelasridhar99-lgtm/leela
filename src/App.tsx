/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Trophy, 
  RefreshCw, 
  Music,
  Gamepad2,
  Heart
} from 'lucide-react';
import { Track, Point, Direction, GameState } from './types';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const DUMMY_TRACKS: Track[] = [
  {
    id: '1',
    title: 'Cyberpunk Pulse',
    artist: 'AI Composer Alpha',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/cyberpunk/400/400',
  },
  {
    id: '2',
    title: 'Neon Dreams',
    artist: 'AI Composer Beta',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/neon/400/400',
  },
  {
    id: '3',
    title: 'Synthwave Horizon',
    artist: 'AI Composer Gamma',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/synthwave/400/400',
  },
];

export default function App() {
  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = DUMMY_TRACKS[currentTrackIndex];

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: { x: 5, y: 5 },
    direction: INITIAL_DIRECTION,
    score: 0,
    isGameOver: false,
    isPaused: true,
  });

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Music Controls ---
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % DUMMY_TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const prevIndex = (currentTrackIndex - 1 + DUMMY_TRACKS.length) % DUMMY_TRACKS.length;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    }
  }, [currentTrackIndex, isPlaying]);

  // --- Game Logic ---
  const generateFood = useCallback((snake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || gameState.isPaused) return;

    setGameState(prev => {
      const head = prev.snake[0];
      const newHead = { ...head };

      switch (prev.direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prev.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        return { ...prev, isGameOver: true };
      }

      const newSnake = [newHead, ...prev.snake];
      let newScore = prev.score;
      let newFood = prev.food;

      if (newHead.x === prev.food.x && newHead.y === prev.food.y) {
        newScore += 10;
        newFood = generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
      };
    });
  }, [gameState.isGameOver, gameState.isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (gameState.direction !== 'DOWN') setGameState(s => ({ ...s, direction: 'UP' })); break;
        case 'ArrowDown': if (gameState.direction !== 'UP') setGameState(s => ({ ...s, direction: 'DOWN' })); break;
        case 'ArrowLeft': if (gameState.direction !== 'RIGHT') setGameState(s => ({ ...s, direction: 'LEFT' })); break;
        case 'ArrowRight': if (gameState.direction !== 'LEFT') setGameState(s => ({ ...s, direction: 'RIGHT' })); break;
        case ' ': 
          if (gameState.isGameOver) {
            resetGame();
          } else {
            setGameState(s => ({ ...s, isPaused: !s.isPaused }));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.direction, gameState.isGameOver]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake]);

  const resetGame = () => {
    setGameState({
      snake: INITIAL_SNAKE,
      food: { x: 5, y: 5 },
      direction: INITIAL_DIRECTION,
      score: 0,
      isGameOver: false,
      isPaused: false,
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-dark-bg text-[#e0e0e0] overflow-hidden">
      {/* Header */}
      <header className="h-[60px] flex items-center justify-between px-6 bg-dark-surface border-b border-dark-border shrink-0">
        <div className="text-xl font-extrabold tracking-[2px] uppercase text-neon-primary text-glow-primary">
          SYNTHSNAKE
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-dim uppercase tracking-[1px]">Current Session</span>
            <span className="text-xl font-mono text-neon-primary">{gameState.score.toString().padStart(5, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-text-dim uppercase tracking-[1px]">High Score</span>
            <span className="text-xl font-mono text-neon-primary">12,850</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-dark-surface border-r border-dark-border p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="text-[12px] font-semibold text-text-dim uppercase tracking-[1.5px]">Cyber Beats Library</div>
          <div className="flex flex-col gap-2">
            {DUMMY_TRACKS.map((track, i) => (
              <button
                key={track.id}
                onClick={() => {
                  setCurrentTrackIndex(i);
                  setIsPlaying(true);
                }}
                className={`p-3 rounded-lg text-left transition-all border ${
                  i === currentTrackIndex 
                    ? 'bg-neon-secondary/5 border-neon-secondary' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="font-medium text-sm mb-1">{track.title}</div>
                <div className="text-[11px] text-text-dim">AI-GEN • {track.artist}</div>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-6 border-t border-dark-border">
            <div className="text-[12px] font-semibold text-text-dim uppercase tracking-[1.5px] mb-4">Controls</div>
            <div className="space-y-2 text-[11px] font-mono text-text-dim">
              <div className="flex justify-between"><span>MOVE</span><span>↑↓←→</span></div>
              <div className="flex justify-between"><span>PAUSE</span><span>SPACE</span></div>
            </div>
          </div>
        </aside>

        {/* Main Game Viewport */}
        <main className="flex-1 flex items-center justify-center bg-[radial-gradient(circle_at_center,_#111_0%,_#050505_100%)] p-5 relative overflow-hidden">
          <div className="relative w-[500px] h-[500px] bg-black border-2 border-dark-border shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            {/* Grid Simulation */}
            <div className="absolute inset-0 grid grid-cols-[repeat(20,1fr)] grid-rows-[repeat(20,1fr)]">
              {[...Array(400)].map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/[0.03]" />
              ))}
            </div>

            {/* Game Elements */}
            <div className="relative w-full h-full">
              {/* Food */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="absolute bg-neon-secondary rounded-full glow-secondary"
                style={{
                  left: `${(gameState.food.x / GRID_SIZE) * 100}%`,
                  top: `${(gameState.food.y / GRID_SIZE) * 100}%`,
                  margin: '4px',
                  width: `calc(${100 / GRID_SIZE}% - 8px)`,
                  height: `calc(${100 / GRID_SIZE}% - 8px)`,
                }}
              />

              {/* Snake */}
              {gameState.snake.map((segment, i) => (
                <div
                  key={`${i}-${segment.x}-${segment.y}`}
                  className="absolute rounded-[2px] bg-neon-primary glow-primary"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Overlays */}
            <AnimatePresence>
              {gameState.isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm"
                >
                  <h2 className="text-4xl font-bold text-neon-secondary text-glow-secondary mb-6 tracking-tighter">GAME OVER</h2>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-8 py-3 bg-neon-primary text-black font-bold rounded-sm hover:glow-primary transition-all uppercase tracking-widest text-xs"
                  >
                    <RefreshCw size={16} />
                    Retry Session
                  </button>
                </motion.div>
              )}

              {gameState.isPaused && !gameState.isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20 backdrop-blur-sm"
                >
                  <button 
                    onClick={() => setGameState(s => ({ ...s, isPaused: false }))}
                    className="p-6 bg-white text-black rounded-full hover:scale-110 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  >
                    <Play size={40} fill="currentColor" />
                  </button>
                  <p className="mt-6 text-neon-primary font-mono text-xs tracking-[4px] uppercase animate-pulse">Press Space to Start</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer Player Controls */}
      <footer className="h-[100px] bg-dark-surface border-t border-dark-border grid grid-cols-[280px_1fr_280px] items-center px-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#222] to-[#444] rounded-[4px] flex items-center justify-center text-neon-secondary font-bold text-xs">
            {currentTrack.title.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-semibold truncate">{currentTrack.title}</div>
            <div className="text-xs text-text-dim truncate">{currentTrack.artist}</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6">
            <button onClick={prevTrack} className="text-xl text-[#e0e0e0] hover:text-neon-secondary transition-colors"><SkipBack size={20} /></button>
            <button 
              onClick={togglePlay}
              className="w-11 h-11 bg-[#e0e0e0] text-dark-bg rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-xl text-[#e0e0e0] hover:text-neon-secondary transition-colors"><SkipForward size={20} /></button>
          </div>
          <div className="w-full max-w-[400px] h-1 bg-dark-border rounded-full relative">
            <motion.div 
              className="absolute left-0 top-0 h-full bg-neon-secondary glow-secondary rounded-full"
              initial={{ width: "45%" }}
              animate={{ width: isPlaying ? "100%" : "45%" }}
              transition={{ duration: 180, ease: "linear" }}
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 text-text-dim">
          <Volume2 size={18} />
          <div className="w-20 h-1 bg-dark-border rounded-full overflow-hidden">
            <div className="w-[70%] h-full bg-text-dim rounded-full" />
          </div>
        </div>
      </footer>

      {/* Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
