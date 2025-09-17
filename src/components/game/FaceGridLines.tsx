import * as THREE from "three";
import { useMemo } from "react";
import { useStore } from "../../game/store/store";
import { CELL } from "../../game/defaults";

export default function FaceGridLines() {
  const dims = useStore((s) => s.settings.dims);
  const theme = useStore((s) => s.colors);

  const sx = dims.w * CELL;
  const sy = dims.h * CELL;
  const sz = dims.d * CELL;

  // Build lines in local coords spanning 0..sx, 0..sy, 0..sz
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const push = (...v: number[]) => positions.push(...v);

    // Faces on x=0 and x=sx (YZ planes)
    for (let y = 0; y <= dims.h; y++) {
      const yy = y * CELL;
      push(0, yy, 0, 0, yy, sz);
      push(sx, yy, 0, sx, yy, sz);
    }
    for (let z = 0; z <= dims.d; z++) {
      const zz = z * CELL;
      push(0, 0, zz, 0, sy, zz);
      push(sx, 0, zz, sx, sy, zz);
    }

    // Faces on y=0 and y=sy (XZ planes)
    for (let x = 0; x <= dims.w; x++) {
      const xx = x * CELL;
      push(xx, 0, 0, xx, 0, sz);
      push(xx, sy, 0, xx, sy, sz);
    }
    for (let z = 0; z <= dims.d; z++) {
      const zz = z * CELL;
      push(0, 0, zz, sx, 0, zz);
      push(0, sy, zz, sx, sy, zz);
    }

    // Faces on z=0 and z=sz (XY planes)
    for (let x = 0; x <= dims.w; x++) {
      const xx = x * CELL;
      push(xx, 0, 0, xx, sy, 0);
      push(xx, 0, sz, xx, sy, sz);
    }
    for (let y = 0; y <= dims.h; y++) {
      const yy = y * CELL;
      push(0, yy, 0, sx, yy, 0);
      push(0, yy, sz, sx, yy, sz);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    return geo;
  }, [dims.h, dims.d, dims.w, sz, sx, sy]);

  const color = useMemo(
    () => new THREE.Color(theme.boundary),
    [theme.boundary]
  );

  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.05} />
      </lineSegments>
    </group>
  );
}
