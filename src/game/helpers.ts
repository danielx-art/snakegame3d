import { CELL } from "./defaults";
import type {Vec3} from "./store/types";

export function cellToWorld(p:Vec3):Vec3 {
  return [(p[0] + 0.5) * CELL, (p[1] + 0.5) * CELL, (p[2] + 0.5) * CELL];
}

export function cellToCentered(
  p:Vec3,
  dims: { sx: number; sy: number; sz: number }
): Vec3 {
  return [
    (p[0] + 0.5) * CELL - dims.sx / 2,
    (p[1] + 0.5) * CELL - dims.sy / 2,
    (p[2] + 0.5) * CELL - dims.sz / 2,
  ];
}