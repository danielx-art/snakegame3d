import { useEffect } from "react";
import { useStore } from "../../game/store/store"
import { initGame } from "../../game/store/actions";
import WavyText from "../generic/WavyText";

export default function GameOverScreen() {

    const isGameOver = useStore(s=>s.game.gameOver);
    const score = useStore(s=>s.game.score);
    const dims = useStore(s=>s.settings.dims);
    const snakeLen = useStore(s=>s.game.snake.length)

    useEffect(()=>{
        if(!isGameOver) return;
        window.addEventListener("click", initGame);
        return ()=>window.removeEventListener("click", initGame);
    }, [isGameOver]);

    const totalVolume = dims.w*dims.h*dims.d;
    const fillPercentage = totalVolume != 0 ? snakeLen/totalVolume : undefined 

    const fillMessage = fillPercentage ? `${fillPercentage}% of the total!` : "you cheated!"

    return (isGameOver && (<div className="absolute inset-0 w-full h-full z-90 grid place-items-center bg-background/70 backdrop-blur-[1px]">
        <div className="flex flex-col gap-8 text-center">
            <WavyText text="Game Over!" easing="linear" amplitudeEm={0.05} duration={1000} className="text-7xl" />
            <p className="">Your score is <span className="font-bold">{score}</span>, which means <span className="font-bold">{fillMessage}</span></p>
            <p className="">Press anywhere to restart</p>
        </div>
    </div>))
}