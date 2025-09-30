import { humanizeKey } from "../../game/helpers";
import { toggleFirstTime } from "../../game/store/actions";
import { useStore } from "../../game/store/store";
import type { Controls } from "../../game/store/types";
import Button from "../generic/Button";
import WavyText from "../generic/WavyText";

export default function StartScreen() {
  const firstTime = useStore((s) => s.ui.firstTime);
  const controls = useStore((s) => s.settings.controls);

  return (
    firstTime && (<div className="absolute inset-0 top-0 bottom-0 right-0 left-0 grid place-items-center z-1000">
      <div className="bg-background/80 border-2 border-primary rounded-sm p-8 text-text sm:max-w-1/3 max-w-4/5 backdrop-blur-[2px]">
        <div className="mb-6">
          <h1>Welcome to {<WavyText text="Snake Game 3D" amplitudeEm={0.1}/>}</h1>
          <p className="text-xs leading-5 my-4">This is meant to be played at a <strong>desktop</strong> with a keyboard.</p>
        </div>
        <div className="flex flex-col flex-nowrap gap-2">
          {(Object.keys(controls) as Array<keyof Controls>).map((key) => (
            <div
              key={`list_controls_${controls[key]}`}
              className="flex flex-row flex-nowrap gap-2"
            >
                <p>{key}: </p>
                <p className="text-accent">{humanizeKey(controls[key])}</p>
            </div>
          ))}
        </div>
        <div className="w-full text-end mt-6"><Button variant="outline" className="py-2 px-4" onClick={toggleFirstTime}>Got It!</Button></div>
      </div>
    </div>)
  );
}
