import { useStore } from "../../game/store/store";
import Settings from "./Settings";

export const NavBar = () => {
  const score = useStore((s) => s.game.score);
  const paused = useStore((s) => s.ui.paused);
  const gameOver = useStore((s) => s.game.gameOver);

  return (
    <>
      <div className="fixed top-0 right-0 left-0 flex flex-row flex-nowrap gap-2 overflow-hidden h-auto w-full bg-black z-10">
        <Settings />
        <div>Score: {score}</div>
        <div>{paused ? "Paused" : gameOver ? "Game Over" : ""}</div>
      </div>
    </>
  );
};
