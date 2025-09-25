import { useStore } from "../../game/store/store";
import PauseButton from "./PauseButton";
import SettingsButton from "./SettingsButton";

export default function NavBar() {
  const score = useStore((s) => s.game.score);

  return (
    <>
      <div className="fixed top-0 right-0 left-0 p-1 flex flex-row flex-nowrap gap-2 overflow-hidden w-full bg-background z-10">
        <div className="px-1 h-fit leading-0 invisible"> {/* take off invisible */}
          <SettingsButton />
        </div>
        <div className="mx-auto leading-0">
          <PauseButton />
        </div>
        <div className="px-2">{score}</div>
      </div>
    </>
  );
};