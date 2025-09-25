import Scene3D from "./components/game/Scene3D";
import VerticalNavBar from "./components/layout/VerticalNavBar";
//import NavBar from "./components/layout/NavBar"; //<-only when vertical space > horizontal space
import { GameLoop } from "./game/GameLoop";
//import { useStore } from "./game/store/store";

export default function App() {
  //const mode = useStore(s=>s.settings.difficulty)

  return (
    <div className="relative w-full h-full font-gone">
      {/* <NavBar /> */}
      <VerticalNavBar />
      <GameLoop />
      <Scene3D />
      {/* {mode != "advanced" && <Scene3D />} */}
    </div>
  );
}