export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'star' | 'trail' | 'explosion';
}

let nextId = 0;

export function createSparkParticles(x: number, y: number, color: string, count: number = 8): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.3,
      size: 2 + Math.random() * 3,
      color,
      type: 'spark',
    });
  }
  return particles;
}

export function createStarParticles(x: number, y: number, count: number = 5): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#fbbf24', '#f59e0b', '#eab308', '#facc15'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 1 + Math.random() * 3;
    particles.push({
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.3,
      size: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'star',
    });
  }
  return particles;
}

export function createTrailParticle(x: number, y: number, speed: number): Particle {
  return {
    id: nextId++,
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 6,
    vx: -speed * 2 - Math.random() * 3,
    vy: (Math.random() - 0.5) * 2,
    life: 1,
    maxLife: 0.3 + Math.random() * 0.2,
    size: 2 + Math.random() * 4,
    color: speed > 3 ? '#ef4444' : speed > 2 ? '#f97316' : '#fbbf24',
    type: 'trail',
  };
}

export function createExplosionParticles(x: number, y: number, count: number = 20): Particle[] {
  const particles: Particle[] = [];
  const colors = ['#ef4444', '#f97316', '#fbbf24', '#a855f7', '#6366f1'];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      id: nextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.5 + Math.random() * 0.5,
      size: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: 'explosion',
    });
  }
  return particles;
}

export function updateParticle(p: Particle, dt: number): Particle {
  return {
    ...p,
    x: p.x + p.vx,
    y: p.y + p.vy,
    vx: p.vx * 0.96,
    vy: p.vy * 0.96 + 0.1,
    life: p.life - dt / p.maxLife,
  };
}
