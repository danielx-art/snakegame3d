import Scene3D from "./components/game/Scene3D";
import NavBar from "./components/layout/NavBar";
import { GameLoop } from "./game/GameLoop";
//import { useStore } from "./game/store/store";

export default function App() {
  //const mode = useStore(s=>s.settings.difficulty)

  return (
    <div className="relative w-full h-full font-gone">
      <NavBar />
      <GameLoop />
      <Scene3D />
      {/* {mode != "advanced" && <Scene3D />} */}
    </div>
  );
}