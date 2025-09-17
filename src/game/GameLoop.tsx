import { useStore } from "./store/store";
import { initGame, step, togglePaused, restart, openSettings, setNextDirectionByCode, setPaused } from "./store/actions";
import { useEffect } from "react";

export function GameLoop() {
  const tickMs = useStore((s) => s.settings.tickMs);
  const paused = useStore((s) => s.ui.paused);
  const gameOver = useStore((s) => s.game.gameOver);
  const snakeLen = useStore((s) => s.game.snake.length);
  const difficulty = useStore((s) => s.settings.difficulty);

  useEffect(() => {
    if (snakeLen === 0) initGame();
  }, [snakeLen]);

  useEffect(() => {
    if (difficulty === "easy") return; // no auto-tick in easy mode

    let id: number | null = null;
    const tick = () => {
      step();
      id = window.setTimeout(tick, tickMs);
    };
    if (!paused && !gameOver) id = window.setTimeout(tick, tickMs);
    return () => {
      if (id) window.clearTimeout(id);
    };
  }, [paused, gameOver, tickMs, difficulty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePaused();
        return;
      }
      if (e.code === "Enter") {
        e.preventDefault();
        restart();
        return;
      }
      if (e.code === "Escape") {
        e.preventDefault();
        openSettings();
        return;
      }
      setNextDirectionByCode(e.code);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return null;
}