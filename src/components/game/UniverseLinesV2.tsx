import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../game/store/store";
import { CELL } from "../../game/defaults";

// Creates a beam (rectangular prism) aligned along +X.
// Length is 1 in the X direction; cross-section is thickness (t) in Y and Z.
function makeUnitBeamGeometry(t: number) {
  const geo = new THREE.BoxGeometry(1, t, t, 1, 1, 1);
  // Optional: mark as non-indexed for simpler shader needs
  geo.toNonIndexed();
  return geo;
}

export default function UniverseLinesV2() {
  const dims = useStore((s) => s.settings.dims);
  const colors = useStore((s) => s.colors);

  // counts for beams across the 3 axis families
  const counts = useMemo(() => {
    const nx = (dims.h + 1) * (dims.d + 1); // X-beams at every grid line in Y and Z
    const ny = (dims.w + 1) * (dims.d + 1); // Y-beams
    const nz = (dims.w + 1) * (dims.h + 1); // Z-beams
    return { nx, ny, nz };
  }, [dims.w, dims.h, dims.d]);

  // Thickness of beams in world units
  const THICK = Math.max(0.08 * CELL, 0.01);

  // Unit beam geometry aligned along +X
  const beamGeo = useMemo(() => makeUnitBeamGeometry(THICK), [THICK]);

  // Three instanced meshes, one per axis family
  const xRef = useRef<THREE.InstancedMesh>(null!);
  const yRef = useRef<THREE.InstancedMesh>(null!);
  const zRef = useRef<THREE.InstancedMesh>(null!);

  // Simple shader with animated pulse along axis
  const vertexShader = `
    precision highp float;
    precision highp int;

    attribute vec3 position;
    attribute mat4 instanceMatrix;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;

    varying vec3 vWorldPos;

    void main() {
      vec4 wp = instanceMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  const fragmentShader = `
    precision highp float;
    precision highp int;

    varying vec3 vWorldPos;

    uniform vec3 uColorBase;
    uniform vec3 uColorGlow;
    uniform float uTime;

    // Which axis this batch represents: (1,0,0)=X, (0,1,0)=Y, (0,0,1)=Z
    uniform vec3 uAxis;

    // pulse controls
    uniform float uBaseAlpha;
    uniform float uGlowStrength;
    uniform float uPulseWidth;   // world units
    uniform float uPulseSpeed;   // wu/s
    uniform float uPulseSpacing; // wu between pulses
    uniform float uNoiseAmp;
    uniform float uCell;

    // hash from integer cell for desync
    float hash13(vec3 p) {
      vec3 f = floor(p);
      float h = dot(f, vec3(127.1, 311.7, 74.7));
      return fract(sin(h) * 43758.5453123);
    }

    void main() {
      // coordinate along this axis
      float coord = dot(vWorldPos, uAxis);

      // base alpha (dim line)
      float alpha = uBaseAlpha;

      // per-cell jitter to desync timing
      vec3 cellIdx = floor(vWorldPos / uCell);
      float jitter = (hash13(cellIdx) - 0.5) * uNoiseAmp;

      // pulse center slides along axis with spacing
      float pos = mod(uTime * uPulseSpeed + jitter, uPulseSpacing);

      // wrap distance to nearest pulse center
      float halfSpan = 0.5 * uPulseSpacing;
      float dwrap = mod(coord - pos + halfSpan, uPulseSpacing) - halfSpan;

      // smooth band
      float glow = smoothstep(uPulseWidth, 0.0, abs(dwrap));

      vec3 color = uColorBase * alpha + uColorGlow * (uGlowStrength * glow);
      float outAlpha = clamp(alpha + uGlowStrength * glow, 0.0, 1.0);

      if (outAlpha < 0.01) discard;
      gl_FragColor = vec4(color, outAlpha);
    }
  `;

  const makeMaterial = (axis: THREE.Vector3) =>
    new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColorBase: { value: new THREE.Color("#262626") },
        uColorGlow: {
          value: new THREE.Color(colors.boundary ?? "#7fd0ff"),
        },
        uTime: { value: 0 },
        uAxis: { value: axis.clone() }, // axis selector
        uBaseAlpha: { value: 0.05 },
        uGlowStrength: { value: 0.95 },
        uPulseWidth: { value: 0.25 * CELL },
        uPulseSpeed: { value: 1.0 * CELL },
        uPulseSpacing: { value: 4.0 * CELL },
        uNoiseAmp: { value: 0.35 * CELL },
        uCell: { value: CELL },
      },
      transparent: true,
      depthWrite: false, // don't occlude snake; set true if you want occlusion
      depthTest: true,
      side: THREE.DoubleSide,
    });

  const matX = useMemo(() => makeMaterial(new THREE.Vector3(1, 0, 0)), [colors.boundary]);
  const matY = useMemo(() => makeMaterial(new THREE.Vector3(0, 1, 0)), [colors.boundary]);
  const matZ = useMemo(() => makeMaterial(new THREE.Vector3(0, 0, 1)), [colors.boundary]);

  // Build transforms for beams
  useEffect(() => {
    const instX = xRef.current;
    const instY = yRef.current;
    const instZ = zRef.current;
    if (!instX || !instY || !instZ) return;

    const dummy = new THREE.Object3D();

    // X-beams: y in [0..h], z in [0..d], span x: [0..w*CELL]
    let i = 0;
    for (let y = 0; y <= dims.h; y++) {
      for (let z = 0; z <= dims.d; z++) {
        const length = dims.w * CELL;
        // BoxGeometry is centered on its local origin; for a beam of length L along +X,
        // we want its center at (L/2, y*CELL, z*CELL).
        dummy.position.set(length * 0.5, y * CELL, z * CELL);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(length, 1, 1);
        dummy.updateMatrix();
        instX.setMatrixAt(i++, dummy.matrix);
      }
    }
    instX.count = counts.nx;
    instX.instanceMatrix.needsUpdate = true;

    // Y-beams: x in [0..w], z in [0..d], span y: [0..h*CELL]
    i = 0;
    for (let x = 0; x <= dims.w; x++) {
      for (let z = 0; z <= dims.d; z++) {
        const length = dims.h * CELL;
        // rotate +X beam to +Y (rotate around Z by +90deg), and center at (x*CELL, L/2, z*CELL)
        dummy.position.set(x * CELL, length * 0.5, z * CELL);
        dummy.rotation.set(0, 0, Math.PI / 2);
        dummy.scale.set(length, 1, 1);
        dummy.updateMatrix();
        instY.setMatrixAt(i++, dummy.matrix);
      }
    }
    instY.count = counts.ny;
    instY.instanceMatrix.needsUpdate = true;

    // Z-beams: x in [0..w], y in [0..h], span z: [0..d*CELL]
    i = 0;
    for (let x = 0; x <= dims.w; x++) {
      for (let y = 0; y <= dims.h; y++) {
        const length = dims.d * CELL;
        // rotate +X beam to +Z (rotate around Y by -90deg), center at (x*CELL, y*CELL, L/2)
        dummy.position.set(x * CELL, y * CELL, length * 0.5);
        dummy.rotation.set(0, -Math.PI / 2, 0);
        dummy.scale.set(length, 1, 1);
        dummy.updateMatrix();
        instZ.setMatrixAt(i++, dummy.matrix);
      }
    }
    instZ.count = counts.nz;
    instZ.instanceMatrix.needsUpdate = true;
  }, [counts.nx, counts.ny, counts.nz, dims.w, dims.h, dims.d]);

  // Animate time
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    matX.uniforms.uTime.value = t;
    matY.uniforms.uTime.value = t;
    matZ.uniforms.uTime.value = t;
  });

  // Update glow color when palette changes
  useEffect(() => {
    (matX.uniforms.uColorGlow.value as THREE.Color).set(colors.boundary ?? "#7fd0ff");
    (matY.uniforms.uColorGlow.value as THREE.Color).set(colors.boundary ?? "#7fd0ff");
    (matZ.uniforms.uColorGlow.value as THREE.Color).set(colors.boundary ?? "#7fd0ff");
  }, [colors.boundary, matX, matY, matZ]);

  // Offset the whole lattice so it spans [0..w*CELL], [0..h*CELL], [0..d*CELL]
  // We built beams in that space already, so no additional offset is needed.
  // If your snake grid is centered, shift these transforms accordingly.

  return (
    <>
      <instancedMesh ref={xRef} args={[beamGeo, matX, counts.nx]} frustumCulled={false} />
      <instancedMesh ref={yRef} args={[beamGeo, matY, counts.ny]} frustumCulled={false} />
      <instancedMesh ref={zRef} args={[beamGeo, matZ, counts.nz]} frustumCulled={false} />
    </>
  );
}