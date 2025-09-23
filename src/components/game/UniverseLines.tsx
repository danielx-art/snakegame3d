import * as THREE from "three";
import { useMemo, useRef, useEffect } from "react";
import { useStore } from "../../game/store/store";
import { CELL } from "../../game/defaults";
import { useThree, useFrame } from "@react-three/fiber";

export default function UniverseLines() {
  const dims = useStore((s) => s.settings.dims);
  const colors = useStore((s) => s.colors);
  const alignToMin = true;

  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();

  const size = useMemo(
    () => new THREE.Vector3(dims.w * CELL, dims.h * CELL, dims.d * CELL),
    [dims.w, dims.h, dims.d]
  );

  const geometry = useMemo(
    () => new THREE.BoxGeometry(size.x, size.y, size.z, 1, 1, 1),
    [size.x, size.y, size.z]
  );

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

      // Transform normal to world (ignore non-uniform scale)
      vWorldNormal = normalize(mat3(modelMatrix) * normal);

      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `;

  const fragmentShader = `
 precision highp float;
precision highp int;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

uniform vec3 uMin;               // world min (0,0,0)
uniform vec3 uMax;               // world max (w*CELL, h*CELL, d*CELL)
uniform float uCell;             // grid spacing in world units
uniform float uThickness;        // base face-proximity thickness in world units
uniform vec3 uLineColor;         // regular grid color
uniform vec3 uBoundaryColor;     // boundary line color
uniform bool uTransparent;       // discard when no line if true

// No-derivatives "screen" control
uniform vec3 uCameraPos;         // camera position in world space

// Distance cue: increase min thickness when closer, reduce when far
uniform float uMinWorldNear;     // min extra world half-thickness when near (e.g., 0.02 * CELL)
uniform float uMinWorldFar;      // min extra world half-thickness when far  (e.g., 0.01 * CELL)
uniform float uNearDist;         // distance at which "near" begins
uniform float uFarDist;          // distance at which "far" ends

// Align grid to the box minimum (1.0) or world origin (0.0)
uniform float uAlignToMin;

float saturate(float x) { return clamp(x, 0.0, 1.0); }

// Distance factor [0..1]: 0 near, 1 far
float dist01(vec3 worldPos) {
  float dist = distance(worldPos, uCameraPos);
  return saturate((dist - uNearDist) / max(1e-6, (uFarDist - uNearDist)));
}

// Interpolated minimum world half-thickness by distance
float minHalfThicknessWorld(vec3 worldPos) {
  float t = dist01(worldPos);
  return mix(uMinWorldNear, uMinWorldFar, t);
}

// Angle-based scale to keep perceived thickness at grazing angles without derivatives.
float angleScale(vec3 faceNormal, vec3 worldPos) {
  vec3 V = normalize(uCameraPos - worldPos); // view dir
  float cosTheta = abs(dot(faceNormal, V));
  return 1.0 / max(cosTheta, 0.15); // clamp to avoid extreme blow-up
}

// Distance to nearest grid line for one coordinate, with optional origin offset.
float distToGrid(float coord, float cell, float origin) {
  float c = coord - origin;
  float m = mod(c, cell);
  return min(m, cell - m);
}

// 1D mask: world-space band around grid line center with soft edges
float mask1D_band(float coord, float cell, float halfBand, float origin) {
  float d = distToGrid(coord, cell, origin);
  return smoothstep(halfBand, 0.0, d);
}

// 2D grid: max of the two axis-aligned line masks
float grid2D_band(vec2 ab, vec2 originAB, float cell, float halfBand) {
  float ma = mask1D_band(ab.x, cell, halfBand, originAB.x);
  float mb = mask1D_band(ab.y, cell, halfBand, originAB.y);
  return max(ma, mb);
}

// Boundary lines using a similar band in world space
float boundary2D_band(vec2 ab, vec2 minAB, vec2 maxAB, float halfBand) {
  float axMin = smoothstep(halfBand, 0.0, abs(ab.x - minAB.x));
  float axMax = smoothstep(halfBand, 0.0, abs(ab.x - maxAB.x));
  float ayMin = smoothstep(halfBand, 0.0, abs(ab.y - minAB.y));
  float ayMax = smoothstep(halfBand, 0.0, abs(ab.y - maxAB.y));
  return max(max(axMin, axMax), max(ayMin, ayMax));
}

void main() {
  vec3 n = normalize(vWorldNormal);
  vec3 an = abs(n);

  // Base world half-thickness for the band
  float halfT = 0.5 * uThickness;

  // Distance-driven minimum world half-thickness (extra softness)
  float minHalfW = minHalfThicknessWorld(vWorldPos);

  // Determine dominant face normal (axis-aligned)
  vec3 faceN;
  if (an.x > an.y && an.x > an.z)      faceN = vec3(sign(n.x), 0.0, 0.0);
  else if (an.y > an.x && an.y > an.z) faceN = vec3(0.0, sign(n.y), 0.0);
  else                                 faceN = vec3(0.0, 0.0, sign(n.z));

  // Angle scale for perceived thickness
  float angScale = angleScale(faceN, vWorldPos);

  // Effective half-band in world units
  float halfBand = max(halfT, minHalfW) * angScale;

  float alpha = 0.0;
  vec3 color = uLineColor;

  // Grid origin alignment
  vec3 gridOrigin = mix(vec3(0.0), uMin, vec3(saturate(uAlignToMin)));

  float b = 0.0; // boundary coverage kept to bias visibility if desired

  // X faces: use (y,z)
  if (an.x > an.y && an.x > an.z) {
    float xFace = (n.x > 0.0) ? uMax.x : uMin.x;
    float faceDist = abs(vWorldPos.x - xFace);
    if (faceDist <= uThickness) {
      vec2 yz = vec2(vWorldPos.y, vWorldPos.z);
      vec2 minYZ = vec2(uMin.y, uMin.z);
      vec2 maxYZ = vec2(uMax.y, uMax.z);
      vec2 originYZ = vec2(gridOrigin.y, gridOrigin.z);

      float g = grid2D_band(yz, originYZ, uCell, halfBand);
      b = boundary2D_band(yz, minYZ, maxYZ, halfBand);

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
      vec2 originXZ = vec2(gridOrigin.x, gridOrigin.z);

      float g = grid2D_band(xz, originXZ, uCell, halfBand);
      b = boundary2D_band(xz, minXZ, maxXZ, halfBand);

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
      vec2 originXY = vec2(gridOrigin.x, gridOrigin.y);

      float g = grid2D_band(xy, originXY, uCell, halfBand);
      b = boundary2D_band(xy, minXY, maxXY, halfBand);

      color = mix(uLineColor, uBoundaryColor, b);
      alpha = max(g, b);
    }
  }

  // Option B: smooth fade — keep front faces but make them subtle.
  // Target: about 20% opacity for faces that face the camera.
  // Compute view relation for this face (using the dominant axis normal).
  vec3 V = normalize(uCameraPos - vWorldPos);
  float cosTheta = dot(faceN, V); // 1 = fully front-facing, -1 = fully back-facing

  // Map cosTheta to a face visibility factor in [minFrontAlpha .. 1]
  const float minFrontAlpha = 0.2;   // tweak: front faces at most 20% opacity
  const float start =  0.4;          // start fading when cosTheta >= 0.4 (quite front)
  const float end   = -0.2;          // fully visible by cosTheta <= -0.2 (slightly back)
  float t = clamp((start - cosTheta) / max(1e-5, (start - end)), 0.0, 1.0);
  // Optional curve shaping (1.0 = linear)
  const float power = 1.0;
  t = pow(t, power);
  // Blend between minFrontAlpha (front) and 1.0 (back)
  float faceVisibility = mix(minFrontAlpha, 1.0, t);

  // If you want boundary lines to remain a bit stronger on front faces,
  // bias alpha so boundary contributes even when faceVisibility is low:
  // alpha = mix(b * max(minFrontAlpha, 0.35), alpha, t);
  // Otherwise, just scale the whole face alpha:
  alpha *= faceVisibility;

  // Output / transparency handling
  if (alpha < 0.01) {
    if (uTransparent) discard;
    gl_FragColor = vec4(0.0);
    return;
  }

  gl_FragColor = vec4(color, alpha);
}
  `;

  const material = useMemo(() => {
    const mat = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        // Base bounds and style
        uMin: { value: new THREE.Vector3(0, 0, 0) },
        uMax: { value: new THREE.Vector3(size.x, size.y, size.z) },
        uCell: { value: CELL },
        // Proximity gate to stay near the actual face plane
        uThickness: { value: Math.max(0.02 * CELL, 0.001) },
        uLineColor: { value: new THREE.Color(colors.boundary ?? "#3a3a3a") },
        uBoundaryColor: { value: new THREE.Color(colors.boundary ?? "#ffffff") },
        uTransparent: { value: true },

        // No-derivatives controls
        uCameraPos: { value: new THREE.Vector3() },
        uMinWorldNear: { value: Math.max(0.002 * CELL, 0.002) },
        uMinWorldFar: { value: Math.max(0.01 * CELL, 0.01) },
        uNearDist: { value: 2.0 },
        uFarDist: { value: 18.0 },
        uAlignToMin: { value: alignToMin ? 1.0 : 0.0 },
      },
      transparent: true,
      depthWrite: true,
      depthTest: true,
      side: THREE.DoubleSide,
    });
    return mat;
  }, [fragmentShader, vertexShader, size.x, size.y, size.z, colors.boundary, alignToMin]);

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
    material.uniforms.uAlignToMin.value = alignToMin ? 1.0 : 0.0;
  }, [size.x, size.y, size.z, colors.boundary, material, alignToMin]);

  // Update camera position each frame
  useFrame(() => {
    const uCam = material.uniforms.uCameraPos.value as THREE.Vector3;
    uCam.copy(camera.position);
  });

  // Place box so min corner is at origin
  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.position.set(size.x * 0.5, size.y * 0.5, size.z * 0.5);
    meshRef.current.renderOrder = -1;
  }, [size.x, size.y, size.z]);

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}