import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RootState, PersistedRootState, Vec3 } from "./types";
import { DEFAULT_COLORS, DEFAULT_SETTINGS } from "../defaults";

const InitialState: RootState = {
  settings: DEFAULT_SETTINGS.easy,
  game: {
    snake: [],
    direction: [1, 0, 0],
    nextDir: [1, 0, 0],
    food: [0, 0, 0],
    score: 0,
    gameOver: false,
    lastTickAt: null,
    free: { cells: [], index: new Map() },
  },
  colors: DEFAULT_COLORS,
  ui: {
    paused: false,
    showSettings: false,
  },
};

function buildIndex(cells: Vec3[]): Map<string, number> {
  const index = new Map<string, number>();
  for (let i = 0; i < cells.length; i++) {
    const pos = cells[i];
    index.set(`${pos[0]},${pos[1]},${pos[2]}`, i);
  }
  return index;
}

export const useStore = create<RootState>()(
  persist(
    () => InitialState,
    {
      name: "snake-store-dev0",
      storage: createJSONStorage(() => localStorage),

      // Persist only JSON-safe parts
      partialize: (s): PersistedRootState => ({
        settings: s.settings,
        game: {
          snake: s.game.snake,
          direction: s.game.direction,
          nextDir: s.game.nextDir,
          food: s.game.food,
          score: s.game.score,
          gameOver: s.game.gameOver,
          lastTickAt: null,
          free: {
            cells: s.game.free.cells,
          },
        },
        ui: {
          paused: true,
          showSettings: s.ui.showSettings,
        },
      }),

      onRehydrateStorage: () => (state, error) => {

        if (error) {
          console.error("rehydration error", error);
          return;
        }
        if (!state) return;

        // Rebuild Map index from persisted cells
        const cells = state.game.free.cells ?? [];
        state.game.free.index = buildIndex(cells);

        // Enforce runtime-only tweaks
        state.ui.paused = true;
        state.game.lastTickAt = null;
      },
    }
  )
);

export const getState = () => useStore.getState();
export const setState = useStore.setState;