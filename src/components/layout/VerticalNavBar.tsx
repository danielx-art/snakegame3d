import PauseButton from "./PauseButton";
import SettingsButton from "./SettingsButton";


export default function VerticalNavBar() {

    return (<div className="h-full absolute top-0 bottom-0 left-0 flex flex-col gap-2 z-10 p-4">
        <PauseButton />
        <SettingsButton />
    </div>)

}