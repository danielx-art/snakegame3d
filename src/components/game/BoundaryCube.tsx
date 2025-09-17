import { CELL } from "../../game/defaults";
import { useStore } from "../../game/store/store";
import type {Vec3 } from "../../game/store/types";

type Props = { position?:Vec3 };

export default function BoundaryCube({ position }: Props) {
  const grid = useStore((s) => s.settings.dims);
  const theme = useStore((s) => s.colors);
  const sx = grid.w * CELL;
  const sy = grid.h * CELL;
  const sz = grid.d * CELL;

  return (
    <mesh position={position}>
      <boxGeometry args={[sx, sy, sz]} />
      <meshBasicMaterial color={theme.boundary} wireframe transparent opacity={0.25} />
    </mesh>
  );
}