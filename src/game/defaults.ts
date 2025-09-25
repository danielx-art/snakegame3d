import type { Defaults, RootState } from "./store/types";

export const CELL = 0.5;

export const DEFAULT_COLORS = {
  snake: "#39FF14",
  snakeFront: "#39FF14",
  snakeBack: "#FFFF00",
  snakeHead: "#F08A2E",
  food: "#D83E4F",
  boundary: "#00FFEE",
  background: "#040610",
};

export const DEFAULT_CONTROLS: RootState["settings"]["controls"] = {
  UP: "KeyW",
  DOWN: "KeyS",
  RIGHT: "KeyD",
  LEFT: "KeyA",
  IN: "KeyQ",
  OUT: "KeyE",
  PAUSE: "Space",
  RESTART: "Enter",
  SETTINGS: "Escape",
};

export const DEFAULT_EASY_MODE: Defaults["easy"] = {
  dims: { w: 10, h: 10, d: 10 },
  wrap: true,
  tickMs: 200,
  controls: DEFAULT_CONTROLS,
  showControlsInHead: true,
  showControlsInMinicube: false,
  cameraMode: "fixed",
  cameraType: "perspective",
  difficulty: "easy",
};

export const DEFAULT_MEDIUM_MODE: Defaults["medium"] = { 
  dims: { w: 12, h: 12, d: 12 },
  wrap: false,
  tickMs: 160,
  controls: DEFAULT_CONTROLS,
  showControlsInHead: false,
  showControlsInMinicube: true,
  cameraMode: "free",
  cameraType: "perspective",
  difficulty: "medium",
};

export const DEFAULT_HARD_MODE: Defaults["hard"] = {
  dims: { w: 16, h: 16, d: 16 },
  wrap: false,
  tickMs: 140,
  controls: DEFAULT_CONTROLS,
  showControlsInHead: false,
  showControlsInMinicube: false,
  cameraMode: "autoOrbit",
  cameraType: "perspective",
  difficulty: "hard",
};

export const DEFAULT_ADVANCED_MODE: Defaults["advanced"] = {
  dims: { w: 16, h: 16, d: 16 },
  wrap: false,
  tickMs: 140,
  controls: DEFAULT_CONTROLS,
  showControlsInHead: false,
  showControlsInMinicube: false,
  cameraMode: "fixed",
  cameraType: "2d",
  difficulty: "advanced",
};

export const DEFAULT_CUSTOM_MODE: Defaults["custom"] = {
  dims: { w: 10, h: 10, d: 10 },
  wrap: true,
  tickMs: 200,
  controls: DEFAULT_CONTROLS,
  showControlsInHead: true,
  showControlsInMinicube: false,
  cameraMode: "free",
  cameraType: "perspective",
  difficulty: "custom",
};

export const DEFAULT_SETTINGS: Defaults = {
  easy: DEFAULT_EASY_MODE,
  medium: DEFAULT_MEDIUM_MODE,
  hard: DEFAULT_HARD_MODE,
  advanced: DEFAULT_ADVANCED_MODE,
  custom: DEFAULT_CUSTOM_MODE,
};
