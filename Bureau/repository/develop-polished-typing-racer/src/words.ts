// Word pools organized by difficulty
const easyWords = [
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
  'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way', 'who', 'did',
  'got', 'let', 'say', 'she', 'too', 'use', 'run', 'big', 'end', 'set',
  'try', 'ask', 'own', 'put', 'red', 'hot', 'top', 'car', 'map', 'add',
  'fast', 'race', 'fire', 'move', 'jump', 'play', 'spin', 'dash', 'zoom',
  'win', 'go', 'up', 'fly', 'hit', 'run', 'bit', 'key', 'box', 'fix',
];

const mediumWords = [
  'about', 'after', 'again', 'being', 'below', 'could', 'every', 'first',
  'found', 'great', 'house', 'large', 'learn', 'never', 'other', 'place',
  'plant', 'point', 'right', 'small', 'sound', 'spell', 'still', 'study',
  'their', 'there', 'these', 'thing', 'think', 'three', 'water', 'where',
  'which', 'world', 'would', 'write', 'turbo', 'speed', 'racer', 'boost',
  'power', 'blaze', 'drift', 'track', 'motor', 'wheel', 'start', 'shift',
  'brake', 'flash', 'storm', 'force', 'prime', 'pulse', 'blast', 'crush',
  'flame', 'surge', 'rapid', 'swift', 'quick', 'chase', 'rally', 'spark',
];

const hardWords = [
  'absolute', 'between', 'building', 'capital', 'chapter', 'complete',
  'consider', 'country', 'develop', 'during', 'economy', 'example',
  'explain', 'finally', 'forward', 'general', 'history', 'however',
  'hundred', 'include', 'kitchen', 'machine', 'morning', 'nothing',
  'outside', 'picture', 'problem', 'program', 'project', 'provide',
  'quality', 'quarter', 'reached', 'reading', 'require', 'service',
  'society', 'special', 'student', 'subject', 'surface', 'teacher',
  'thought', 'thunder', 'tonight', 'trouble', 'usually', 'version',
  'virtual', 'welcome', 'without', 'working', 'writing', 'yourself',
  'champion', 'velocity', 'adrenaline', 'overtake', 'throttle',
  'cylinder', 'downforce', 'roadster', 'ignition', 'momentum',
  'nitrous', 'exhaust', 'burnout', 'torque', 'redline', 'podium',
];

export function getRandomWord(difficulty: number): string {
  if (difficulty < 3) {
    return easyWords[Math.floor(Math.random() * easyWords.length)];
  } else if (difficulty < 7) {
    const pool = [...easyWords, ...mediumWords];
    return pool[Math.floor(Math.random() * pool.length)];
  } else if (difficulty < 12) {
    const pool = [...mediumWords, ...hardWords];
    return pool[Math.floor(Math.random() * pool.length)];
  } else {
    return hardWords[Math.floor(Math.random() * hardWords.length)];
  }
}

export function getWordBatch(count: number, difficulty: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    words.push(getRandomWord(difficulty));
  }
  return words;
}
