import { getState, setState } from "./store";
import type { DirectionKey, Vec3, GameColors, FreeCells, GridDims, Settings } from "./types";

const DIRS: Record<DirectionKey, Vec3> = {
  UP: [0, 1, 0],
  DOWN: [0, -1, 0],
  LEFT: [-1, 0, 0],
  RIGHT: [1, 0, 0],
  IN: [0, 0, -1],
  OUT: [0, 0, 1],
};

//BASIC VECTOR MATH
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const isOpposite = (a: Vec3, b: Vec3): boolean =>
  a[0] === -b[0] && a[1] === -b[1] && a[2] === -b[2];
const eq = (a: Vec3, b: Vec3): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const keyOf = (p:Vec3): string => `${p[0]},${p[1]},${p[2]}`;

// FREE CELLS SEARCH
function buildFreeCells(dims: GridDims, occupiedSnake:Vec3[], food?:Vec3): FreeCells {
  const index = new Map<string, number>();
  //Because searching in strings is quicker??
  const occ = new Set<string>(occupiedSnake.map(keyOf));
  if (food) occ.add(keyOf(food));
  const cells:Vec3[] = [];
  for (let x = 0; x < dims.w; x++) {
    for (let y = 0; y < dims.h; y++) {
      for (let z = 0; z < dims.d; z++) {
        const k = `${x},${y},${z}`;
        if (!occ.has(k)) {
          index.set(k, cells.length);
          cells.push([x, y, z]);
        }
      }
    }
  }
  return { cells, index };
}

// Swap-remove an entry by key (O(1)) - mutate
function freeRemove(free: FreeCells, p:Vec3): boolean {
  const k = keyOf(p);
  const idx = free.index.get(k);
  if (idx === undefined) return false;
  const lastIdx = free.cells.length - 1;
  if (idx !== lastIdx) {
    const last = free.cells[lastIdx];
    free.cells[idx] = last;
    free.index.set(keyOf(last), idx);
  }
  free.cells.pop();
  free.index.delete(k);
  return true;
}

// Add a free cell if not already present (O(1)) - mutate
function freeAdd(free: FreeCells, p:Vec3): boolean {
  const k = keyOf(p);
  if (free.index.has(k)) return false;
  free.index.set(k, free.cells.length);
  free.cells.push([p[0], p[1], p[2]]);
  return true;
}

// Random free cell (O(1))
function randomFreeCellFast(free: FreeCells):Vec3 {
  const n = free.cells.length;
  if (n === 0) throw new Error("No free cells available");
  const i = Math.floor(Math.random() * n);
  return free.cells[i];
}

// Game lifecycle

export function initGame(): void {
  const s = getState();
  const { dims } = s.settings;
  const cx = Math.floor(dims.w / 2);
  const cy = Math.floor(dims.h / 2);
  const cz = Math.floor(dims.d / 2);

  const snake:Vec3[] = [
    [cx, cy, cz],
    [cx - 1, cy, cz],
    [cx - 2, cy, cz],
  ];

  // Build free cells excluding snake first, then choose food from free and remove it
  const free = buildFreeCells(dims, snake);
  const food = randomFreeCellFast(free);
  freeRemove(free, food);

  setState((prev) => ({
    ...prev,
    game: {
      snake,
      direction: DIRS.RIGHT,
      nextDir: DIRS.RIGHT,
      food,
      score: 0,
      gameOver: false,
      lastTickAt: performance.now(),
      free,
    },
    ui: { ...prev.ui, paused: false },
  }));
}

export function restart(): void {
  initGame();
}

// UI

export function toggleFirstTime(): void {
  setState((prev)=>({...prev, ui: {...prev.ui, firstTime: !prev.ui.firstTime}}));
}

export function setPaused(paused: boolean): void {
  setState((prev) => ({ ...prev, ui: { ...prev.ui, paused } }));
}

export function togglePaused(): void {
  setState((prev) => ({ ...prev, ui: { ...prev.ui, paused: !prev.ui.paused } }));
}

export function setShowSettings(show: boolean): void {
  setState((prev) => ({ ...prev, ui: { ...prev.ui, showSettings: show } }));
}

export function openSettings(): void {
  setState((prev) => ({ ...prev, ui: { ...prev.ui, showSettings: true, paused: true } }));
}

export function closeSettings(): void {
  setState((prev) => ({ ...prev, ui: { ...prev.ui, showSettings: false } }));
}

// Game Settings

export function setDifficulty(d: "easy" | "medium" | "advanced"): void {
  setState((prev) => ({ ...prev, settings: { ...prev.settings, difficulty: d } }));
}

export function setBinding(dir: DirectionKey, code: string): void {
  setState((prev) => ({
    ...prev,
    settings: {
      ...prev.settings,
      controls: {
        ...prev.settings.controls, [dir]: code,
      },
    },
  }));
}

export function setTheme(partial: Partial<GameColors>): void {
  setState((prev) => {return {colors: {...partial, ...prev.colors} }});
}

export function setCameraType(t: "isometric" | "perspective"): void {
  setState((prev) => ({ ...prev, settings: { ...prev.settings, cameraType: t } }));
}

export function setGrid(dims: GridDims): void {
  // Reinitialize free-cells and recenter snake safely on grid change
  const prev = getState();
  const cx = Math.floor(dims.w / 2);
  const cy = Math.floor(dims.h / 2);
  const cz = Math.floor(dims.d / 2);
  const snake:Vec3[] = [
    [cx, cy, cz],
    [cx - 1, cy, cz],
    [cx - 2, cy, cz],
  ];
  const free = buildFreeCells(dims, snake);
  const food = randomFreeCellFast(free);
  freeRemove(free, food);

  setState({
    settings: { ...prev.settings, dims },
    game: {
      snake,
      direction: [1, 0, 0],
      nextDir: [1, 0, 0],
      food,
      score: 0,
      gameOver: false,
      lastTickAt: performance.now(),
      free,
    },
    ui: { ...prev.ui, paused: false },
  });
}

export function setSpeed(ms: number): void {
  setState((prev) => ({ ...prev, settings: { ...prev.settings, tickMs: ms } }));
}

export function setWrap(wrap: boolean): void {
  setState((prev) => ({ ...prev, settings: { ...prev.settings, wrap } }));
}

// Input mapping

export function setNextDirectionByCode(code: string): void {
  const { settings, game } = getState();
  const bindings = settings.controls;

  let dirKey: DirectionKey | null = null;
  for (const k of Object.keys(bindings) as DirectionKey[]) {
    if (bindings[k] === code) {
      dirKey = k;
      break;
    }
  }
  if (!dirKey) return;

  const next = DIRS[dirKey];
  if (isOpposite(next, game.direction)) return;

  // Set nextDir
  setState((prev) => ({ ...prev, game: { ...prev.game, nextDir: next } }));

  // When tickMs === 0, move one step immediately on key press
  if (settings.tickMs === 0) {
    step();
  }
}

export function saveSettings(next: Partial<Settings>): void {
  setState((prev) => ({ ...prev, settings: {...prev.settings, ...next} }));
  initGame();
}

// Core tick using free-cells

export function step(): void {
  const s = getState();
  const { settings, game, ui } = s;

  if (ui.paused || game.gameOver || game.snake.length === 0) return;

  const dims = settings.dims;
  const dir = game.nextDir;
  const head = game.snake[0];
  let newHead = add(head, dir);

  // Bounds / wrap
  if (!settings.wrap) {
    if (
      newHead[0] < 0 ||
      newHead[0] >= dims.w ||
      newHead[1] < 0 ||
      newHead[1] >= dims.h ||
      newHead[2] < 0 ||
      newHead[2] >= dims.d
    ) {
      setState((prev) => ({ ...prev, game: { ...prev.game, gameOver: true } }));
      return;
    }
  } else {
    newHead = [
      (newHead[0] + dims.w) % dims.w,
      (newHead[1] + dims.h) % dims.h,
      (newHead[2] + dims.d) % dims.d,
    ];
  }

  const eating = eq(newHead, game.food);
  const tail = game.snake[game.snake.length - 1];

  // Use a definitive occupancy check against the current snake
  const occ = new Set(game.snake.map(keyOf));
  const hitsBody = occ.has(keyOf(newHead));

  // Collision logic:
  // - If eating: tail doesn't move; stepping onto any occupied cell is a collision,
  //   EXCEPT stepping onto the food cell (which is by definition in front of head).
  //   Since food was removed from free at spawn, free can't tell us this. Use eq(newHead, food).
  // - If not eating: tail moves away; stepping onto current tail is allowed.
  if (eating) {
    // If newHead overlaps body (including tail), that's a collision ONLY if that cell isn't the food.
    // But eating implies newHead == food, so if hitsBody is true here, it means the food cell was
    // somehow inside the snake (shouldn't happen). We'll treat eq(newHead, food) as valid move.
    // Therefore: no extra collision check needed beyond bounds.
  } else {
    if (hitsBody && !eq(newHead, tail)) {
      setState((prev) => ({ ...prev, game: { ...prev.game, gameOver: true } }));
      return;
    }
  }

  // Clone free-cells for mutation
  const free = {
    cells: game.free.cells.slice(),
    index: new Map(game.free.index),
  };

  // Remove newHead from free if present (it won't be present if it was the food)
  freeRemove(free, newHead);

  const newSnake:Vec3[] = [newHead, ...game.snake];

  if (eating) {
    // Grow: do not pop tail
    // Place new food uniformly among remaining free cells
    const newFood = randomFreeCellFast(free);
    // Reserve that food cell (remove from free)
    freeRemove(free, newFood);

    setState((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        snake: newSnake,
        direction: dir,
        food: newFood,
        score: prev.game.score + 1,
        lastTickAt: performance.now(),
        free,
      },
    }));
    return;
  } else {
    // Normal move: tail becomes free
    const oldTail = newSnake.pop()!; // remove last
    freeAdd(free, oldTail);

    setState((prev) => ({
      ...prev,
      game: {
        ...prev.game,
        snake: newSnake,
        direction: dir,
        lastTickAt: performance.now(),
        free,
      },
    }));
  }
}