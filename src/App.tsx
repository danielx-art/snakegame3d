import Scene3D from "./components/game/Scene3D";
import Footer from "./components/layout/Footer";
import GameOverScreen from "./components/layout/GameOverScreen";
import VerticalNavBar from "./components/layout/VerticalNavBar";
//import NavBar from "./components/layout/NavBar"; //<-only when vertical space > horizontal space
import { GameLoop } from "./game/GameLoop";
//import { useStore } from "./game/store/store";

export default function App() {
  //const mode = useStore(s=>s.settings.difficulty)

  return (
    <div className="relative w-full h-full font-start">
      {/* <NavBar /> */}
      <VerticalNavBar />
      <GameOverScreen />
      <GameLoop />
      <Scene3D />
      <Footer />
      {/* {mode != "advanced" && <Scene3D />} */}
    </div>
  );
}