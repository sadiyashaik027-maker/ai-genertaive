import React, { useState, useEffect, useRef } from 'react';

const TRACKS = [
  { id: 1, title: "SYS.REQ.01", artist: "UNKNOWN_ENTITY", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "MEM_LEAK_DETECTED", artist: "SECTOR_7G", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "NULL_POINTER", artist: "VOID_WALKER", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 100;

export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const [bars, setBars] = useState<number[]>(Array(12).fill(10));
  
  const directionRef = useRef(INITIAL_DIRECTION);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(12).fill(10));
      return;
    }
    const interval = setInterval(() => {
      setBars(Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20));
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => { setCurrentTrackIndex(p => (p + 1) % TRACKS.length); setIsPlaying(true); };
  const prevTrack = () => { setCurrentTrackIndex(p => (p - 1 + TRACKS.length) % TRACKS.length); setIsPlaying(true); };

  const generateFoodWithSnake = (currentSnake: {x: number, y: number}[]) => {
    let newFood;
    while (true) {
      newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
      if (!currentSnake.some(s => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setFood(generateFoodWithSnake(INITIAL_SNAKE));
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (!gameStarted && e.key === " ") { resetGame(); if(!isPlaying) setIsPlaying(true); return; }
      if (gameOver && e.key === " ") { resetGame(); return; }

      const { x, y } = directionRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (y !== 1) directionRef.current = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': if (y !== -1) directionRef.current = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': if (x !== 1) directionRef.current = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': if (x !== -1) directionRef.current = { x: 1, y: 0 }; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPlaying]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = { x: head.x + directionRef.current.x, y: head.y + directionRef.current.y };
        
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE || 
            prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...prev];
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1);
          setFood(generateFoodWithSnake(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    };
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, food]);

  const currentTrack = TRACKS[currentTrackIndex];

  return (
    <div className="min-h-screen bg-black text-[#0ff] p-4 relative overflow-hidden screen-tear flex flex-col items-center justify-center">
      <div className="static-noise"></div>
      <div className="scanline"></div>
      
      <audio ref={audioRef} src={currentTrack.url} onEnded={nextTrack} />

      <header className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-end mb-8 z-10 border-b-4 border-[#f0f] pb-4 gap-4">
        <div>
          <h1 className="text-5xl md:text-7xl font-bold glitch-text tracking-tighter" data-text="PROTOCOL: OROBOROS">
            PROTOCOL: OROBOROS
          </h1>
          <p className="text-[#f0f] text-2xl mt-2 animate-pulse">STATUS: AUDIO_SUBSYSTEM_ACTIVE</p>
        </div>
        <div className="text-left md:text-right">
          <p className="text-[#f0f] text-xl">DATA_COLLECTED</p>
          <div className="text-6xl font-bold bg-[#0ff] text-black px-4 py-1 inline-block mt-1">
            {score.toString().padStart(4, '0')}
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-12 w-full max-w-5xl z-10">
        
        {/* Game Board */}
        <div className="relative border-cyan-magenta bg-black p-2 flex-grow">
          <div 
            className="grid bg-[#111] w-full aspect-square"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = snake.some((s, idx) => idx !== 0 && s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;

              return (
                <div key={i} className="w-full h-full border border-[#222]">
                  {isHead && <div className="w-full h-full bg-[#f0f] border-2 border-[#0ff]"></div>}
                  {isBody && <div className="w-full h-full bg-[#0ff] border border-[#f0f] opacity-80"></div>}
                  {isFood && <div className="w-full h-full bg-white animate-ping"></div>}
                </div>
              );
            })}
          </div>

          {!gameStarted && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <button 
                onClick={() => { resetGame(); if(!isPlaying) setIsPlaying(true); }}
                className="text-4xl bg-[#f0f] text-black px-8 py-4 border-4 border-[#0ff] hover:bg-[#0ff] hover:text-black transition-colors glitch-text"
                data-text="INITIALIZE_SEQUENCE"
              >
                INITIALIZE_SEQUENCE
              </button>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center border-4 border-red-600">
              <h2 className="text-7xl font-bold text-red-500 mb-4 glitch-text" data-text="FATAL_ERROR">FATAL_ERROR</h2>
              <p className="text-3xl text-white mb-8">ENTITY_COLLISION // SCORE: {score}</p>
              <button 
                onClick={resetGame}
                className="text-3xl bg-red-600 text-black px-8 py-4 hover:bg-white transition-colors font-bold"
              >
                [ EXECUTE_REBOOT ]
              </button>
            </div>
          )}
        </div>

        {/* Audio Terminal */}
        <div className="w-full lg:w-96 border-magenta-cyan bg-black p-6 flex flex-col gap-6 h-fit">
          <div className="border-b-4 border-[#0ff] pb-2">
            <h3 className="text-3xl text-[#f0f] font-bold">AUDIO_TERMINAL</h3>
          </div>

          <div>
            <p className="text-lg text-gray-400 mb-1">CURRENT_STREAM:</p>
            <div className="bg-[#0ff] text-black p-3 text-2xl font-bold truncate">
              {currentTrack.title}
            </div>
            <p className="text-lg text-[#f0f] mt-2">SRC: {currentTrack.artist}</p>
          </div>

          {/* Raw Visualizer */}
          <div className="flex items-end gap-1 h-24 border-2 border-[#333] p-1">
            {bars.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-[#f0f]"
                style={{
                  height: `${height}%`,
                  transition: 'height 0.1s steps(2)'
                }}
              />
            ))}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button onClick={prevTrack} className="text-4xl hover:text-[#f0f] hover:bg-[#0ff] px-2 transition-colors">[&lt;&lt;]</button>
            <button onClick={togglePlay} className="text-4xl font-bold bg-[#f0f] text-black px-6 py-2 hover:bg-[#0ff] transition-colors">
              {isPlaying ? '[ PAUSE ]' : '[ PLAY ]'}
            </button>
            <button onClick={nextTrack} className="text-4xl hover:text-[#f0f] hover:bg-[#0ff] px-2 transition-colors">[&gt;&gt;]</button>
          </div>

          <div className="mt-6">
            <p className="text-lg text-gray-400 mb-2">VOL_CONTROL:</p>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-6 cursor-pointer"
            />
          </div>
        </div>
      </main>
      
      <div className="absolute bottom-4 text-[#f0f] text-xl tracking-widest">
        INPUT_REQUIRED: [W][A][S][D] OR [ARROWS]
      </div>
    </div>
  );
}
