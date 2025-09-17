import { useStore } from "../../game/store/store";
import { cellToWorld } from "../../game/helpers";
import { CELL } from "../../game/defaults";

export default function FoodMesh() {
  const food = useStore((s) => s.game.food);
  const colors = useStore((s) => s.colors);
  const pos = cellToWorld(food);

  return (
    <mesh position={pos}>
      <boxGeometry args={[CELL, CELL, CELL]} />
      <meshStandardMaterial color={colors.food} />
    </mesh>
  );
}