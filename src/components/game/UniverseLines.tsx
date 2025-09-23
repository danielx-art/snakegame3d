import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useStore } from "../../game/store/store";
import { CELL } from "../../game/defaults";

export default function UniverseLines() {
  const dims = useStore((s) => s.settings.dims);
  const colors = useStore((s) => s.colors);

  const meshRef = useRef<THREE.Mesh>(null!);

  // Universe box size: from 0 to w*CELL etc. (positive octant layout)
  const size = useMemo(
    () => new THREE.Vector3(dims.w * CELL, dims.h * CELL, dims.d * CELL),
    [dims.w, dims.h, dims.d]
  );

  const geometry = useMemo(
    () => new THREE.BoxGeometry(size.x, size.y, size.z, 1, 1, 1),
    [size.x, size.y, size.z]
  );

  // Vertex: pass world position and world normal
  const vertexShader = `
    precision highp float;
    precision highp int;

    attribute vec3 position;
    attribute vec3 normal;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;

      // Transform normal to world (ignore scale/shear)
      vWorldNormal = normalize(mat3(modelMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  // Fragment: draw 2D grid on each face plane
  // We compute grid lines using mod() in the 2D axes on that face.
  const fragmentShader = `
    precision highp float;
    precision highp int;

    varying vec3 vWorldPos;
    varying vec3 vWorldNormal;

    uniform vec3 uMin;        // world min (0,0,0)
    uniform vec3 uMax;        // world max (w*CELL, h*CELL, d*CELL)
    uniform float uCell;      // cell size
    uniform float uThickness; // line thickness in world units
    uniform vec3 uLineColor;  // internal grid color
    uniform vec3 uBoundaryColor; // outer boundary color
    uniform bool uTransparent;

    // Return 1.0 when coord is within thickness of an integer multiple of cell
    float mask1D(float coord, float cell, float halfT) {
      float m = mod(coord, cell);
      float d = min(m, cell - m);
      return smoothstep(halfT, 0.0, d);
    }

    // 2D grid on plane for coords (a,b) each with spacing cell
    float grid2D(vec2 ab, float cell, float halfT) {
      float ma = mask1D(ab.x, cell, halfT);
      float mb = mask1D(ab.y, cell, halfT);
      return max(ma, mb);
    }

    // Whether we're within thickness of the outer boundary lines on the plane
    float boundary2D(vec2 ab, vec2 minAB, vec2 maxAB, float halfT) {
      float axMin = smoothstep(halfT, 0.0, abs(ab.x - minAB.x));
      float axMax = smoothstep(halfT, 0.0, abs(ab.x - maxAB.x));
      float ayMin = smoothstep(halfT, 0.0, abs(ab.y - minAB.y));
      float ayMax = smoothstep(halfT, 0.0, abs(ab.y - maxAB.y));
      return max(max(axMin, axMax), max(ayMin, ayMax));
    }

    void main() {
      float halfT = 0.5 * uThickness;

      // Determine dominant axis of the face by world normal
      vec3 n = normalize(vWorldNormal);
      vec3 an = abs(n);

      // We render lines only on the box faces; select the 2D coordinates on that face.
      float alpha = 0.0;
      vec3 color = uLineColor;

      // X faces: use (y,z)
      if (an.x > an.y && an.x > an.z) {
        float xFace = (n.x > 0.0) ? uMax.x : uMin.x; // which side
        // Only draw near that face (avoid bleeding to interior due to smoothing)
        float faceDist = abs(vWorldPos.x - xFace);
        if (faceDist <= uThickness) {
          vec2 yz = vec2(vWorldPos.y, vWorldPos.z);
          vec2 minYZ = vec2(uMin.y, uMin.z);
          vec2 maxYZ = vec2(uMax.y, uMax.z);

          float g = grid2D(yz, uCell, halfT);
          float b = boundary2D(yz, minYZ, maxYZ, halfT);

          color = mix(uLineColor, uBoundaryColor, b);
          alpha = max(g, b);
        }
      }
      // Y faces: use (x,z)
      else if (an.y > an.x && an.y > an.z) {
        float yFace = (n.y > 0.0) ? uMax.y : uMin.y;
        float faceDist = abs(vWorldPos.y - yFace);
        if (faceDist <= uThickness) {
          vec2 xz = vec2(vWorldPos.x, vWorldPos.z);
          vec2 minXZ = vec2(uMin.x, uMin.z);
          vec2 maxXZ = vec2(uMax.x, uMax.z);

          float g = grid2D(xz, uCell, halfT);
          float b = boundary2D(xz, minXZ, maxXZ, halfT);

          color = mix(uLineColor, uBoundaryColor, b);
          alpha = max(g, b);
        }
      }
      // Z faces: use (x,y)
      else {
        float zFace = (n.z > 0.0) ? uMax.z : uMin.z;
        float faceDist = abs(vWorldPos.z - zFace);
        if (faceDist <= uThickness) {
          vec2 xy = vec2(vWorldPos.x, vWorldPos.y);
          vec2 minXY = vec2(uMin.x, uMin.y);
          vec2 maxXY = vec2(uMax.x, uMax.y);

          float g = grid2D(xy, uCell, halfT);
          float b = boundary2D(xy, minXY, maxXY, halfT);

          color = mix(uLineColor, uBoundaryColor, b);
          alpha = max(g, b);
        }
      }

      if (alpha < 0.01) {
        if (uTransparent) discard;
        gl_FragColor = vec4(0.0);
        return;
      }

      gl_FragColor = vec4(color, alpha);
    }
  `;

  const material = useMemo(() => {
    return new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uMin: { value: new THREE.Vector3(0, 0, 0) },
        uMax: { value: new THREE.Vector3(size.x, size.y, size.z) },
        uCell: { value: CELL },
        uThickness: { value: Math.max(0.04 * CELL, 0.001) },
        uLineColor: {
          value: new THREE.Color(colors.boundary ?? "#3a3a3a"),
        },
        uBoundaryColor: {
          value: new THREE.Color(colors.boundary ?? "#ffffff"),
        },
        uTransparent: { value: true },
      },
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
    });
  }, [
    fragmentShader,
    vertexShader,
    size.x,
    size.y,
    size.z,
    colors.boundary,
  ]);

  // Sync uniforms on changes
  useEffect(() => {
    (material.uniforms.uMax.value as THREE.Vector3).set(size.x, size.y, size.z);
    material.uniforms.uCell.value = CELL;
    (material.uniforms.uLineColor.value as THREE.Color).set(
      colors.boundary ?? "#3a3a3a"
    );
    (material.uniforms.uBoundaryColor.value as THREE.Color).set(
      colors.boundary ?? "#ffffff"
    );
  }, [size.x, size.y, size.z, colors.boundary, material]);

  // Place the box so its min corner is at (0,0,0) and max at (w*CELL, h*CELL, d*CELL)
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    // Optional: slightly bias render order so it draws after background but before UI
    meshRef.current.renderOrder = -1;
  }, [size.x, size.y, size.z]);

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}