export type Vec3 = [number, number, number];

export type FreeCells = {
  cells:Vec3[];
  index: Map<string, number>;
};

export type GridDims = { w: number; h: number; d: number };

export type DirectionKey = "UP" | "DOWN" | "LEFT" | "RIGHT" | "IN" | "OUT";

export type GeneralKey = "PAUSE" | "RESTART" | "SETTINGS";

export type Controls = Record<DirectionKey|GeneralKey, string>;

export type GameColors = {
  snake: string;
  snakeFront: string;
  snakeBack: string;
  snakeHead: string;
  food: string;
  boundary: string;
  background: string;
};

export type Difficulty = "easy" | "medium" | "hard" | "advanced" | "custom";

export type CameraMode = "fixed" | "free" | "autoOrbit";

export type CameraType = "isometric" | "perspective" | "2d";

export type Settings = {
  dims: GridDims;
  wrap: boolean;
  tickMs: number;
  showControlsInHead: boolean;
  showControlsInMinicube: boolean;
  cameraMode: CameraMode;
  cameraType: CameraType;
  controls: Controls;
  difficulty: Difficulty;
};

export type GameRuntime = {
  snake:Vec3[];
  direction: Vec3;
  nextDir: Vec3;
  food:Vec3;
  score: number;
  gameOver: boolean;
  lastTickAt: number | null;
  free: FreeCells;
};

export type UIState = {
  firstTime: boolean;
  paused: boolean;
  showSettings: boolean;
};

export type RootState = {
  settings: Settings;
  colors: GameColors;
  game: GameRuntime;
  ui: UIState;
};

export type Defaults = {
  [key in Difficulty]: RootState["settings"];
};

export type PersistedFreeCells = {
  cells:Vec3[];
  // index omitted; rebuilt on load
};

export type PersistedRootState = {
  settings: Settings;
  game: Omit<GameRuntime, "free" | "lastTickAt"> & {
    free: PersistedFreeCells;
    lastTickAt: null; //don't persist timers
  };
  ui: UIState;
};