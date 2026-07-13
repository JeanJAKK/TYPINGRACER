import { useState, useCallback, useRef, useEffect } from 'react';
import { getRandomWord } from './words';
import { Particle, createSparkParticles, createStarParticles, createTrailParticle, createExplosionParticles, updateParticle } from './particles';
import { playKeyPress, playCorrect, playWrong, playCombo, playGameOver, playCountdown, playStart } from './audio';
import { saveHighScore, isNewHighScore, HighScore } from './highscores';

export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';

export interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  typed: string;
  active: boolean;
}

export interface GameData {
  state: GameState;
  score: number;
  combo: number;
  maxCombo: number;
  wordsCompleted: number;
  wordsMissed: number;
  totalKeysPressed: number;
  correctKeys: number;
  wrongKeys: number;
  wpm: number;
  accuracy: number;
  speed: number;
  lives: number;
  maxLives: number;
  level: number;
  countdownValue: number;
  shakeIntensity: number;
  flashType: '' | 'correct' | 'wrong';
  words: FallingWord[];
  particles: Particle[];
  activeWordId: number | null;
  input: string;
  newHighScore: boolean;
  highScores: HighScore[];
  elapsedTime: number;
  nitroActive: boolean;
  nitroTimer: number;
  scorePop: boolean;
}

const INITIAL_SPEED = 0.4;
const SPEED_INCREMENT = 0.03;
const MAX_LIVES = 5;
const WORD_SPAWN_INTERVAL_BASE = 2500;
const WORD_SPAWN_INTERVAL_MIN = 800;

let wordIdCounter = 0;

function createFallingWord(level: number): FallingWord {
  const word = getRandomWord(level);
  return {
    id: wordIdCounter++,
    word,
    x: 10 + Math.random() * 75,
    y: -5,
    speed: INITIAL_SPEED + level * SPEED_INCREMENT * 0.5 + Math.random() * 0.15,
    typed: '',
    active: false,
  };
}

export function useGame() {
  const [game, setGame] = useState<GameData>({
    state: 'menu',
    score: 0,
    combo: 0,
    maxCombo: 0,
    wordsCompleted: 0,
    wordsMissed: 0,
    totalKeysPressed: 0,
    correctKeys: 0,
    wrongKeys: 0,
    wpm: 0,
    accuracy: 100,
    speed: 0,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    level: 1,
    countdownValue: 3,
    shakeIntensity: 0,
    flashType: '',
    words: [],
    particles: [],
    activeWordId: null,
    input: '',
    newHighScore: false,
    highScores: [],
    elapsedTime: 0,
    nitroActive: false,
    nitroTimer: 0,
    scorePop: false,
  });

  const gameRef = useRef(game);
  gameRef.current = game;

  const gameLoopRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const trailTimerRef = useRef<number>(0);

  const startCountdown = useCallback(() => {
    setGame(prev => ({
      ...prev,
      state: 'countdown',
      countdownValue: 3,
      score: 0,
      combo: 0,
      maxCombo: 0,
      wordsCompleted: 0,
      wordsMissed: 0,
      totalKeysPressed: 0,
      correctKeys: 0,
      wrongKeys: 0,
      wpm: 0,
      accuracy: 100,
      speed: 0,
      lives: MAX_LIVES,
      level: 1,
      words: [],
      particles: [],
      activeWordId: null,
      input: '',
      newHighScore: false,
      elapsedTime: 0,
      nitroActive: false,
      nitroTimer: 0,
      shakeIntensity: 0,
      flashType: '',
      scorePop: false,
    }));

    playCountdown();

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        playCountdown();
        setGame(prev => ({ ...prev, countdownValue: count }));
      } else {
        clearInterval(interval);
        playStart();
        startTimeRef.current = performance.now();
        lastTimeRef.current = performance.now();
        spawnTimerRef.current = 0;
        trailTimerRef.current = 0;
        setGame(prev => ({
          ...prev,
          state: 'playing',
          countdownValue: 0,
          words: [createFallingWord(1), createFallingWord(1)],
        }));
      }
    }, 800);
  }, []);

  const pause = useCallback(() => {
    setGame(prev => prev.state === 'playing' ? { ...prev, state: 'paused' } : prev);
  }, []);

  const resume = useCallback(() => {
    setGame(prev => {
      if (prev.state === 'paused') {
        lastTimeRef.current = performance.now();
        return { ...prev, state: 'playing' };
      }
      return prev;
    });
  }, []);

  const goToMenu = useCallback(() => {
    setGame(prev => ({
      ...prev,
      state: 'menu' as GameState,
      score: 0,
      combo: 0,
      maxCombo: 0,
      wordsCompleted: 0,
      wordsMissed: 0,
      totalKeysPressed: 0,
      correctKeys: 0,
      wrongKeys: 0,
      wpm: 0,
      accuracy: 100,
      speed: 0,
      lives: MAX_LIVES,
      level: 1,
      words: [],
      particles: [],
      activeWordId: null,
      input: '',
      newHighScore: false,
      elapsedTime: 0,
      nitroActive: false,
      nitroTimer: 0,
      shakeIntensity: 0,
      flashType: '' as const,
      scorePop: false,
    }));
  }, []);

  const handleInput = useCallback((key: string) => {
    setGame(prev => {
      if (prev.state !== 'playing') return prev;

      const g = { ...prev };
      g.totalKeysPressed++;

      // Find or activate a word
      let activeWord: FallingWord | undefined;

      if (g.activeWordId !== null) {
        activeWord = g.words.find(w => w.id === g.activeWordId);
      }

      if (!activeWord || !activeWord.active) {
        // Try to find a word that starts with this key
        const candidates = g.words
          .filter(w => !w.active && w.typed === '' && w.word.startsWith(key))
          .sort((a, b) => b.y - a.y); // Prefer lowest (most urgent)

        if (candidates.length > 0) {
          activeWord = candidates[0];
          g.activeWordId = activeWord.id;
          g.words = g.words.map(w =>
            w.id === activeWord!.id ? { ...w, active: true, typed: key } : { ...w, active: false }
          );
          g.correctKeys++;
          g.input = key;
          playKeyPress();

          // Check if single char word
          if (activeWord.word.length === 1) {
            // Word completed!
            return handleWordComplete(g, activeWord.id);
          }
          return g;
        } else {
          // Wrong key
          g.wrongKeys++;
          g.combo = 0;
          g.shakeIntensity = 3;
          g.flashType = 'wrong';
          playWrong();
          return g;
        }
      }

      // Continue typing active word
      const expectedChar = activeWord.word[activeWord.typed.length];
      if (key === expectedChar) {
        g.correctKeys++;
        const newTyped = activeWord.typed + key;
        g.input = newTyped;
        playKeyPress();

        g.words = g.words.map(w =>
          w.id === activeWord!.id ? { ...w, typed: newTyped } : w
        );

        if (newTyped === activeWord.word) {
          return handleWordComplete(g, activeWord.id);
        }
      } else {
        // Wrong key
        g.wrongKeys++;
        g.combo = 0;
        g.shakeIntensity = 5;
        g.flashType = 'wrong';
        playWrong();
      }

      return g;
    });
  }, []);

  const handleWordComplete = (g: GameData, wordId: number): GameData => {
    const word = g.words.find(w => w.id === wordId);
    if (!word) return g;

    const wordLen = word.word.length;
    const baseScore = wordLen * 10;
    g.combo++;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    const comboMultiplier = Math.min(1 + (g.combo - 1) * 0.25, 5);
    const points = Math.round(baseScore * comboMultiplier);
    g.score += points;
    g.wordsCompleted++;
    g.scorePop = true;
    g.flashType = 'correct';

    // Level up every 5 words
    g.level = Math.floor(g.wordsCompleted / 5) + 1;

    // Nitro boost at combo milestones
    if (g.combo > 0 && g.combo % 5 === 0) {
      g.nitroActive = true;
      g.nitroTimer = 2;
      playCombo();
    } else {
      playCorrect();
    }

    // Create particles at word position
    const wordEl = document.getElementById(`word-${wordId}`);
    if (wordEl) {
      const rect = wordEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      g.particles = [
        ...g.particles,
        ...createSparkParticles(cx, cy, g.combo >= 5 ? '#a855f7' : '#22c55e', wordLen),
        ...createStarParticles(cx, cy, Math.min(wordLen, 8)),
      ];
    }

    // Remove completed word
    g.words = g.words.filter(w => w.id !== wordId);
    g.activeWordId = null;
    g.input = '';

    // Update WPM
    const elapsed = g.elapsedTime / 60;
    if (elapsed > 0) {
      g.wpm = Math.round(g.wordsCompleted / elapsed);
    }

    // Update accuracy
    if (g.totalKeysPressed > 0) {
      g.accuracy = Math.round((g.correctKeys / g.totalKeysPressed) * 100);
    }

    return g;
  };

  // Game loop
  useEffect(() => {
    const loop = (time: number) => {
      gameLoopRef.current = requestAnimationFrame(loop);

      const g = gameRef.current;
      if (g.state !== 'playing') return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      setGame(prev => {
        if (prev.state !== 'playing') return prev;

        const updated = { ...prev };
        updated.elapsedTime += dt;

        // Decay effects
        updated.shakeIntensity *= 0.85;
        if (updated.shakeIntensity < 0.1) updated.shakeIntensity = 0;
        if (updated.flashType && updated.shakeIntensity < 0.5) updated.flashType = '';
        if (updated.scorePop) updated.scorePop = false;

        // Nitro timer
        if (updated.nitroActive) {
          updated.nitroTimer -= dt;
          if (updated.nitroTimer <= 0) {
            updated.nitroActive = false;
            updated.nitroTimer = 0;
          }
        }

        // Move words down
        updated.words = updated.words.map(w => ({
          ...w,
          y: w.y + w.speed * dt * 20,
        }));

        // Check for words that fell off
        const fallen = updated.words.filter(w => w.y > 105);
        if (fallen.length > 0) {
          updated.wordsMissed += fallen.length;
          updated.lives -= fallen.length;
          updated.combo = 0;
          updated.shakeIntensity = 8;
          updated.flashType = 'wrong';

          // Reset active word if it fell
          if (updated.activeWordId !== null && fallen.some(w => w.id === updated.activeWordId)) {
            updated.activeWordId = null;
            updated.input = '';
          }

          // Explosion particles for missed words
          fallen.forEach(w => {
            const container = document.getElementById('game-area');
            if (container) {
              const rect = container.getBoundingClientRect();
              const wx = rect.left + (w.x / 100) * rect.width;
              const wy = rect.bottom;
              updated.particles = [
                ...updated.particles,
                ...createExplosionParticles(wx, wy, 12),
              ];
            }
          });
        }

        updated.words = updated.words.filter(w => w.y <= 105);

        // Speed calculation for visual
        updated.speed = INITIAL_SPEED + updated.level * SPEED_INCREMENT;

        // Spawn new words
        spawnTimerRef.current += dt * 1000;
        const spawnInterval = Math.max(
          WORD_SPAWN_INTERVAL_MIN,
          WORD_SPAWN_INTERVAL_BASE - updated.level * 150
        );
        if (spawnTimerRef.current > spawnInterval) {
          spawnTimerRef.current = 0;
          const newWord = createFallingWord(updated.level);
          updated.words = [...updated.words, newWord];

          // At higher levels, sometimes spawn two
          if (updated.level > 5 && Math.random() > 0.6) {
            const extraWord = createFallingWord(updated.level);
            updated.words = [...updated.words, extraWord];
          }
        }

        // Car trail particles
        trailTimerRef.current += dt;
        if (trailTimerRef.current > 0.05 && updated.speed > 0) {
          trailTimerRef.current = 0;
          const carArea = document.getElementById('car-area');
          if (carArea) {
            const rect = carArea.getBoundingClientRect();
            updated.particles = [
              ...updated.particles,
              createTrailParticle(rect.left + 20, rect.top + rect.height / 2, updated.speed),
            ];
          }
        }

        // Update particles
        updated.particles = updated.particles
          .map(p => updateParticle(p, dt))
          .filter(p => p.life > 0);

        // Check game over
        if (updated.lives <= 0) {
          updated.state = 'gameover';
          updated.lives = 0;

          // Calculate final stats
          const elapsed = updated.elapsedTime / 60;
          if (elapsed > 0) {
            updated.wpm = Math.round(updated.wordsCompleted / elapsed);
          }
          if (updated.totalKeysPressed > 0) {
            updated.accuracy = Math.round((updated.correctKeys / updated.totalKeysPressed) * 100);
          }

          updated.newHighScore = isNewHighScore(updated.score);
          updated.highScores = saveHighScore({
            score: updated.score,
            wpm: updated.wpm,
            accuracy: updated.accuracy,
            date: new Date().toLocaleDateString(),
          });

          // Big explosion
          const container = document.getElementById('game-area');
          if (container) {
            const rect = container.getBoundingClientRect();
            updated.particles = [
              ...updated.particles,
              ...createExplosionParticles(rect.width / 2, rect.height / 2, 30),
            ];
          }

          playGameOver();
        }

        return updated;
      });
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return {
    game,
    startCountdown,
    pause,
    resume,
    handleInput,
    goToMenu,
  };
}
