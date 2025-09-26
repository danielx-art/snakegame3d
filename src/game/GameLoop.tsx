import { useStore } from "./store/store";
import { initGame, step, togglePaused, restart, openSettings, setNextDirectionByCode, setPaused } from "./store/actions";
import { useEffect } from "react";

export function GameLoop() {
  const tickMs = useStore((s) => s.settings.tickMs);
  const controls = useStore((s)=>s.settings.controls);
  const paused = useStore((s) => s.ui.paused);
  const gameOver = useStore((s) => s.game.gameOver);
  const snakeLen = useStore((s) => s.game.snake.length);
  const difficulty = useStore((s) => s.settings.difficulty);

  useEffect(() => {
    if (snakeLen === 0) initGame();
  }, [snakeLen]);

  useEffect(() => {
    if(tickMs === 0) return;
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
      if (e.code === controls.PAUSE) {
        e.preventDefault();
        togglePaused();
        return;
      }
      if (e.code === controls.RESTART) {
        e.preventDefault();
        restart();
        return;
      }
      if (e.code === controls.SETTINGS) {
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