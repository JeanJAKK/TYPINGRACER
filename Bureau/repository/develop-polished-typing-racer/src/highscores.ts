export interface HighScore {
  score: number;
  wpm: number;
  accuracy: number;
  date: string;
}

const STORAGE_KEY = 'typing-racer-highscores';

export function getHighScores(): HighScore[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveHighScore(entry: HighScore): HighScore[] {
  const scores = getHighScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
  } catch {
    // ignore
  }
  return top;
}

export function isNewHighScore(score: number): boolean {
  const scores = getHighScores();
  if (scores.length < 10) return true;
  return score > scores[scores.length - 1].score;
}
