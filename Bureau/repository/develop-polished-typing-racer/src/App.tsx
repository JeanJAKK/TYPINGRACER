import { useEffect, useRef, useCallback, useState } from "react";
import { useGame, FallingWord } from "./useGame";
import { getHighScores, HighScore } from "./highscores";
import { Particle } from "./particles";
import { startBackgroundMusic, stopBackgroundMusic } from "./audio";

function ParticleLayer({ particles }: { particles: Particle[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life,
            transform: `scale(${p.life})`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            willChange: "transform, opacity",
          }}
        />
      ))}
    </div>
  );
}

function StarsBackground() {
  const stars = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.7,
      animDelay: Math.random() * 3,
    })),
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animation: `float ${2 + star.animDelay}s ease-in-out infinite`,
            animationDelay: `${star.animDelay}s`,
          }}
        />
      ))}
    </div>
  );
}

function RoadLines({ speed }: { speed: number }) {
  const lines = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden opacity-30">
      {lines.map((i) => (
        <div
          key={i}
          className="absolute left-1/2 w-1 h-8 bg-yellow-400 rounded"
          style={{
            top: `${i * 25}%`,
            animation: `road-line ${Math.max(0.3, 2 - speed)}s linear infinite`,
            animationDelay: `${i * (Math.max(0.3, 2 - speed) / 8)}s`,
          }}
        />
      ))}
    </div>
  );
}

function Car({ speed, nitro }: { speed: number; nitro: boolean }) {
  return (
    <div
      id="car-area"
      className="absolute bottom-4 left-1/2 -translate-x-1/2"
      style={{
        animation:
          speed > 0
            ? `car-bounce ${Math.max(0.15, 0.5 - speed * 0.1)}s ease-in-out infinite`
            : "none",
      }}
    >
      <div className="relative">
        {speed > 0 && (
          <div
            className="absolute -left-6 top-1/2 -translate-y-1/2"
            style={{
              width: nitro ? 40 : 15 + speed * 5,
              height: nitro ? 16 : 8 + speed * 2,
              background: nitro
                ? "linear-gradient(to left, transparent, #3b82f6, #60a5fa, #93c5fd)"
                : "linear-gradient(to left, transparent, #f97316, #ef4444)",
              borderRadius: "50%",
              filter: `blur(${nitro ? 3 : 2}px)`,
              opacity: 0.8 + Math.random() * 0.2,
              transition: "width 0.3s, height 0.3s",
            }}
          />
        )}
        <div
          className="text-4xl"
          style={{
            filter: nitro
              ? "drop-shadow(0 0 10px #3b82f6) drop-shadow(0 0 20px #6366f1)"
              : "none",
          }}
        >
          🏎️
        </div>
        {nitro && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: -15 - i * 12,
                  top: -2 + i * 2 - 2,
                  width: 8 - i * 2,
                  height: 8 - i * 2,
                  background: "#60a5fa",
                  boxShadow: "0 0 8px #3b82f6",
                  opacity: 0.8 - i * 0.25,
                  animation: `float ${0.3 + i * 0.1}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WordDisplay({
  word,
  isActive,
}: {
  word: FallingWord;
  isActive: boolean;
}) {
  const typed = word.typed.length;
  const remaining = word.word.slice(typed);
  const typedPart = word.word.slice(0, typed);

  return (
    <div
      id={`word-${word.id}`}
      className="absolute transition-none select-none"
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isActive ? 20 : 10,
      }}
    >
      <div
        className={`
          px-3 py-1.5 rounded-lg font-mono text-lg font-bold tracking-wider
          border-2 transition-colors duration-100
          ${isActive ? "border-indigo-400 bg-indigo-950/90 shadow-lg shadow-indigo-500/30" : "border-slate-600/50 bg-slate-900/80 shadow-md"}
          ${word.y > 80 ? "border-red-500/70 animate-pulse" : ""}
        `}
      >
        <span className="text-green-400">{typedPart}</span>
        <span className={isActive ? "text-white" : "text-slate-300"}>
          {remaining}
        </span>
      </div>
      {word.y > 70 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-red-500 animate-pulse" />
      )}
    </div>
  );
}

function HUD({
  score,
  combo,
  lives,
  maxLives,
  wpm,
  accuracy,
  level,
  scorePop,
}: {
  score: number;
  combo: number;
  lives: number;
  maxLives: number;
  wpm: number;
  accuracy: number;
  level: number;
  scorePop: boolean;
}) {
  return (
    <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-30 pointer-events-none">
      <div className="flex flex-col gap-1">
        <div
          className={`text-2xl font-black text-white tabular-nums ${scorePop ? "scale-125" : "scale-100"}`}
          style={{
            transition: "transform 0.1s ease-out",
            textShadow: "0 2px 10px rgba(99,102,241,0.5)",
          }}
        >
          {score.toLocaleString()}
        </div>
        {combo > 1 && (
          <div
            className="flex items-center gap-1"
            style={{ animation: "slide-up 0.2s ease-out" }}
          >
            <span className="text-amber-400 font-bold text-sm">
              🔥 Combo {combo}x
            </span>
            {combo >= 5 && (
              <span className="text-xs text-purple-400 font-bold">Nitro</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
          Level
        </div>
        <div className="text-xl font-black text-indigo-400">{level}</div>
      </div>

      <div className="flex flex-col items-end gap-1 text-sm">
        <div className="text-slate-400 tabular-nums">
          <span className="text-rose-400 font-bold">❤️ Lives</span> {lives}/
          {maxLives}
        </div>
        <div className="text-slate-400 tabular-nums">
          <span className="text-cyan-400 font-bold">⚡ {wpm}</span> words/min
        </div>
        <div className="text-slate-400 tabular-nums">
          <span
            className={`font-bold ${accuracy >= 90 ? "text-green-400" : accuracy >= 70 ? "text-yellow-400" : "text-red-400"}`}
          >
            {accuracy}%
          </span>{" "}
          🎯 accuracy
        </div>
      </div>
    </div>
  );
}

function InputDisplay({
  input,
  activeWord,
}: {
  input: string;
  activeWord: string | null;
}) {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
      <div className="px-6 py-2 bg-slate-800/90 border-2 border-indigo-500/50 rounded-xl min-w-[200px] text-center backdrop-blur-sm">
        <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">
          typing
        </div>
        <div className="font-mono text-xl font-bold tracking-wider h-7 flex items-center justify-center">
          {input ? (
            <>
              <span className="text-green-400">{input}</span>
              {activeWord && (
                <span className="text-slate-600">
                  {activeWord.slice(input.length)}
                </span>
              )}
              <span className="inline-block w-0.5 h-5 bg-indigo-400 ml-0.5 animate-pulse" />
            </>
          ) : (
            <span className="text-slate-600 text-sm">type to race...</span>
          )}
        </div>
      </div>
    </div>
  );
}

function VirtualKeyboard({ onKey }: { onKey: (key: string) => void }) {
  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-40 pb-2 px-1 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700/50">
      {rows.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[3px] my-[3px]">
          {row.map((key) => (
            <button
              key={key}
              className="w-[9.2%] max-w-[36px] aspect-square rounded-md bg-slate-700 hover:bg-slate-600 active:bg-indigo-600 active:scale-90 text-white text-sm font-bold flex items-center justify-center transition-all duration-75 shadow-md border border-slate-600/50 select-none touch-manipulation"
              onPointerDown={(e) => {
                e.preventDefault();
                onKey(key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function StartScreen({
  onStart,
  highScores,
}: {
  onStart: () => void;
  highScores: HighScore[];
}) {
  const [showScores, setShowScores] = useState(false);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900">
      <StarsBackground />
      <div
        className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-md w-full"
        style={{ animation: "fade-in 0.5s ease-out" }}
      >
        <div className="text-center">
          <div className="text-6xl mb-3">🏎️</div>
          <div className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">
            Typing Racer
          </div>
          <h1
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 mb-2"
            style={{ animation: "title-glow 2s ease-in-out infinite" }}
          >
            TYPING
          </h1>
          <h1
            className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400"
            style={{
              animation: "title-glow 2s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          >
            RACER
          </h1>
          <p className="text-slate-400 mt-3 text-sm">
            Type words before they fall — race to the top!
          </p>
        </div>

        <button
          onClick={onStart}
          className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xl font-black rounded-2xl shadow-xl shadow-indigo-500/30 transform hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30"
          style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
        >
          🚀 Start race
        </button>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm w-full">
          <h3 className="text-indigo-400 font-bold text-sm mb-2 uppercase tracking-wider">
            How to Play
          </h3>
          <div className="space-y-1.5 text-slate-300 text-sm">
            <p>⌨️ Type the falling words before they hit bottom</p>
            <p>🔥 Chain combos for score multipliers</p>
            <p>💨 Every 5 combo triggers NITRO boost!</p>
            <p>❤️ Miss a word = lose a life. 5 lives total</p>
            <p>
              ⏸️ Press{" "}
              <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs font-mono">
                Esc
              </kbd>{" "}
              to pause
            </p>
          </div>
        </div>

        {highScores.length > 0 && (
          <button
            onClick={() => setShowScores(!showScores)}
            className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors"
          >
            {showScores ? "Hide" : "Show"} scores
          </button>
        )}

        {showScores && highScores.length > 0 && (
          <HighScoreTable scores={highScores} currentScore={-1} />
        )}
      </div>
    </div>
  );
}

function HighScoreTable({
  scores,
  currentScore,
}: {
  scores: HighScore[];
  currentScore: number;
}) {
  return (
    <div
      className="bg-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden w-full"
      style={{ animation: "slide-up 0.3s ease-out" }}
    >
      <div className="px-4 py-2 bg-indigo-900/50 border-b border-slate-700/50">
        <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
          🏆 High scores
        </h3>
      </div>
      <div className="divide-y divide-slate-700/30">
        {scores.map((s, i) => (
          <div
            key={i}
            className={`px-4 py-2 flex items-center justify-between text-sm ${s.score === currentScore && currentScore > 0 ? "bg-indigo-900/30" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`font-bold w-6 text-center ${i === 0 ? "text-amber-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-700" : "text-slate-500"}`}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <span className="text-white font-bold tabular-nums">
                {s.score.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span>{s.wpm} WPM</span>
              <span>{s.accuracy}%</span>
              <span>{s.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountdownScreen({ value }: { value: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/80 backdrop-blur-sm">
      <div
        key={value}
        className="text-9xl font-black text-indigo-400"
        style={{
          animation: "countdown-pop 0.7s ease-out",
          textShadow:
            "0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.3)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PauseScreen({
  onResume,
  onQuit,
}: {
  onResume: () => void;
  onQuit: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/80 backdrop-blur-md"
      style={{ animation: "fade-in 0.2s ease-out" }}
    >
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="text-4xl">⏸️</div>
        <h2 className="text-3xl font-black text-white">PAUSED</h2>
        <div className="flex flex-col gap-3 w-48">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95"
          >
            ▶️ Resume
          </button>
          <button
            onClick={onQuit}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-all active:scale-95"
          >
            🏠 Quit
          </button>
        </div>
        <p className="text-slate-500 text-sm">Press Esc to resume</p>
      </div>
    </div>
  );
}

function GameOverScreen({
  score,
  wordsCompleted,
  wpm,
  accuracy,
  maxCombo,
  level,
  newHighScore,
  highScores,
  onRestart,
  onMenu,
}: {
  score: number;
  wordsCompleted: number;
  wpm: number;
  accuracy: number;
  maxCombo: number;
  level: number;
  newHighScore: boolean;
  highScores: HighScore[];
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto"
      style={{ animation: "fade-in 0.3s ease-out" }}
    >
      <div
        className="flex flex-col items-center gap-4 p-6 max-w-sm w-full my-4"
        style={{ animation: "slide-up 0.4s ease-out" }}
      >
        <div className="text-5xl">🏁</div>
        <h2 className="text-3xl font-black text-white">RACE OVER</h2>

        {newHighScore && (
          <div
            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 rounded-lg"
            style={{ animation: "pulse-glow 1.5s ease-in-out infinite" }}
          >
            <span className="text-amber-400 font-black text-lg">
              🌟 NEW HIGH SCORE! 🌟
            </span>
          </div>
        )}

        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
          {score.toLocaleString()}
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { label: "Words", value: wordsCompleted, icon: "📝" },
            { label: "WPM", value: wpm, icon: "⚡" },
            { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
            { label: "Max Combo", value: `${maxCombo}x`, icon: "🔥" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 text-center"
            >
              <div className="text-lg">{stat.icon}</div>
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="text-slate-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="text-slate-400 text-sm">
          Reached Level{" "}
          <span className="text-indigo-400 font-bold">{level}</span>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            🔄 Race Again
          </button>
          <button
            onClick={onMenu}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-all active:scale-95"
          >
            🏠
          </button>
        </div>

        {highScores.length > 0 && (
          <HighScoreTable scores={highScores} currentScore={score} />
        )}
      </div>
    </div>
  );
}

function SpeedLines({ speed, nitro }: { speed: number; nitro: boolean }) {
  if (speed < 0.3) return null;
  const count = nitro ? 8 : Math.min(Math.floor(speed * 5), 6);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            right: 0,
            top: `${10 + (i * 80) / count + Math.random() * 10}%`,
            width: nitro ? 120 : 40 + speed * 20,
            height: 2,
            background: nitro
              ? "linear-gradient(to left, transparent, #818cf8, #6366f1)"
              : "linear-gradient(to left, transparent, rgba(148,163,184,0.3))",
            animation: `speedline ${0.3 + Math.random() * 0.3}s linear infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function NitroOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-5"
      style={{ animation: "fade-in 0.2s ease-out" }}
    >
      <div
        className="absolute inset-0 border-2 border-indigo-500/30 rounded-none"
        style={{ boxShadow: "inset 0 0 60px rgba(99,102,241,0.15)" }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 text-xs font-black uppercase tracking-[0.3em] opacity-20">
        NITRO
      </div>
    </div>
  );
}

export default function App() {
  const {
    game,
    startCountdown,
    pause,
    resume,
    handleInput,
    goToMenu: goToMenuAction,
  } = useGame();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [menuScores, setMenuScores] = useState<HighScore[]>([]);
  const [musicEnabled, setMusicEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("typing-racer-music-enabled");
    return stored ? stored === "true" : true;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setMenuScores(getHighScores());
  }, []);

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus();
  }, [game.state]);

  useEffect(() => {
    if (musicEnabled) {
      const mode =
        game.state === "playing" || game.state === "paused" ? "game" : "upbeat";
      startBackgroundMusic(mode);
    } else {
      stopBackgroundMusic();
    }

    return () => stopBackgroundMusic();
  }, [musicEnabled, game.state]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "typing-racer-music-enabled",
        String(musicEnabled),
      );
    }
  }, [musicEnabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (game.state === "playing" || game.state === "paused") {
        if (e.key !== "F5" && e.key !== "F12" && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      }

      if (e.key === "Escape") {
        if (game.state === "playing") pause();
        else if (game.state === "paused") resume();
        return;
      }

      if (game.state === "menu") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startCountdown();
        }
        return;
      }

      if (game.state === "gameover") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startCountdown();
        }
        return;
      }

      if (game.state === "playing") {
        const key = e.key.toLowerCase();
        if (key.length === 1 && key >= "a" && key <= "z") {
          handleInput(key);
        }
      }
    },
    [game.state, handleInput, pause, resume, startCountdown],
  );

  const handleTouchKey = useCallback(
    (key: string) => {
      if (game.state === "playing") handleInput(key);
    },
    [game.state, handleInput],
  );

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => !prev);
  }, []);

  const goToMenu = useCallback(() => {
    setMenuScores(getHighScores());
    goToMenuAction();
  }, [goToMenuAction]);

  const shakeStyle =
    game.shakeIntensity > 0
      ? {
          transform: `translate(${(Math.random() - 0.5) * game.shakeIntensity * 2}px, ${(Math.random() - 0.5) * game.shakeIntensity * 2}px)`,
        }
      : {};

  const flashStyle =
    game.flashType === "correct"
      ? { animation: "correct-flash 0.3s ease-out" }
      : game.flashType === "wrong"
        ? { animation: "wrong-flash 0.3s ease-out" }
        : {};

  const activeWordText =
    game.activeWordId !== null
      ? game.words.find((w) => w.id === game.activeWordId)?.word || null
      : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-full h-full outline-none relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950/50 to-slate-900"
      style={shakeStyle}
    >
      <div className="absolute top-28 right-3 z-[60]">
        <button
          onClick={toggleMusic}
          className="px-3 py-1.5 rounded-full border border-slate-600/60 bg-slate-900/80 text-xs font-bold text-white backdrop-blur-sm shadow-lg hover:bg-slate-800 transition-colors active:scale-95"
          aria-pressed={musicEnabled}
          title={musicEnabled ? "Désactiver la musique" : "Activer la musique"}
        >
          {musicEnabled ? "🔊 Musique on" : "🔇 Musique off"}
        </button>
      </div>

      {game.flashType && (
        <div
          className="absolute inset-0 pointer-events-none z-[90]"
          style={flashStyle}
        />
      )}

      <ParticleLayer particles={game.particles} />

      {game.state === "menu" && (
        <StartScreen onStart={startCountdown} highScores={menuScores} />
      )}
      {game.state === "countdown" && (
        <CountdownScreen value={game.countdownValue} />
      )}

      {(game.state === "playing" ||
        game.state === "paused" ||
        game.state === "gameover") && (
        <div id="game-area" className="absolute inset-0">
          <StarsBackground />
          <SpeedLines speed={game.speed} nitro={game.nitroActive} />
          {game.nitroActive && <NitroOverlay />}
          <RoadLines speed={game.speed} />

          <HUD
            score={game.score}
            combo={game.combo}
            lives={game.lives}
            maxLives={game.maxLives}
            wpm={game.wpm}
            accuracy={game.accuracy}
            level={game.level}
            scorePop={game.scorePop}
          />

          {game.words.map((word) => (
            <WordDisplay
              key={word.id}
              word={word}
              isActive={word.id === game.activeWordId}
            />
          ))}

          <InputDisplay input={game.input} activeWord={activeWordText} />
          <Car speed={game.speed} nitro={game.nitroActive} />

          {isTouchDevice && game.state === "playing" && (
            <VirtualKeyboard onKey={handleTouchKey} />
          )}

          {isTouchDevice && game.state === "playing" && (
            <button
              onClick={pause}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 bg-slate-800/80 rounded-lg text-white text-sm font-bold border border-slate-600/50 active:bg-slate-700"
            >
              ⏸️ Pause
            </button>
          )}
        </div>
      )}

      {game.state === "paused" && (
        <PauseScreen onResume={resume} onQuit={goToMenu} />
      )}
      {game.state === "gameover" && (
        <GameOverScreen
          score={game.score}
          wordsCompleted={game.wordsCompleted}
          wpm={game.wpm}
          accuracy={game.accuracy}
          maxCombo={game.maxCombo}
          level={game.level}
          newHighScore={game.newHighScore}
          highScores={game.highScores}
          onRestart={startCountdown}
          onMenu={goToMenu}
        />
      )}
    </div>
  );
}
