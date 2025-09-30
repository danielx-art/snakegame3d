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

export function humanizeKey(code: string): string {
  if (!code) return "?";
  if (code.startsWith("Key") && code.length === 4) return code[3];
  if (code === "Space") return "␣";
  if (code.startsWith("Arrow")) {
    const m: Record<string, string> = {
      ArrowUp: "↑",
      ArrowDown: "↓",
      ArrowLeft: "←",
      ArrowRight: "→",
    };
    return m[code] ?? code.replace("Arrow", "");
  }
  if (code.startsWith("Digit") && code.length === 6) return code[5];
  return code;
}