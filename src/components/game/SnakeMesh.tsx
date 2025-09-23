import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../game/store/store";
import { cellToWorld } from "../../game/helpers";
import { CELL } from "../../game/defaults";

const vertexShader = `
  precision highp float;
  precision highp int;

  // Attributes
  attribute vec3 position;
  attribute mat4 instanceMatrix;

  // Uniforms provided by three for RawShaderMaterial
  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;

  // Varying: pass world Z to fragment
  varying float vWorldZ;

  void main() {
    // Instance transform to world
    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);

    // Save world Z for gradient
    vWorldZ = worldPosition.z;

    // Project
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  precision mediump float;
  precision mediump int;

  varying float vWorldZ;

  uniform vec3 uFrontColor; // snakeFront
  uniform vec3 uBackColor;  // snakeBack
  uniform float uDimsD;     // dims.d (max z extent)

  void main() {
    float t = 0.0;
    if (uDimsD > 0.0) {
      t = clamp(vWorldZ / uDimsD, 0.0, 1.0);
    }
    vec3 color = mix(uFrontColor, uBackColor, t);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function SnakeMesh() {
  const snake = useStore((s) => s.game.snake);
  const colors = useStore((s) => s.colors);
  const dimsD = useStore((s) => s.settings.dims.d);

  const instRef = useRef<THREE.InstancedMesh>(null!);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometry = useMemo(() => new THREE.BoxGeometry(CELL, CELL, CELL), []);

  const material = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uFrontColor: { value: new THREE.Color(colors.snakeFront ?? colors.snake ?? 0xffffff) },
          uBackColor: { value: new THREE.Color(colors.snakeBack ?? colors.snake ?? 0xffffff) },
          uDimsD: { value: dimsD ?? 0 },
        },
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
        transparent: false,
      }),
    []
  );

  // Keep uniforms in sync with the store
  useEffect(() => {
    (material.uniforms.uFrontColor.value as THREE.Color).set(
      colors.snakeFront ?? colors.snake ?? 0xffffff
    );
  }, [colors.snakeFront, colors.snake, material]);

  useEffect(() => {
    (material.uniforms.uBackColor.value as THREE.Color).set(
      colors.snakeBack ?? colors.snake ?? 0xffffff
    );
  }, [colors.snakeBack, colors.snake, material]);

  useEffect(() => {
    material.uniforms.uDimsD.value = dimsD ?? 0;
  }, [dimsD, material]);

  // Ensure buffers exist
  useEffect(() => {
    const inst = instRef.current;
    if (!inst) return;

    const cap = Math.max(1, snake.length);
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    for (let i = 0; i < cap; i++) inst.setMatrixAt(i, dummy.matrix);
    inst.count = cap;
    inst.instanceMatrix.needsUpdate = true;
  }, [snake.length, dummy]);

  useFrame(() => {
    const inst = instRef.current;
    if (!inst) return;

    const n = snake.length;
    inst.count = Math.max(1, n);

    if (n === 0) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(0, dummy.matrix);
      inst.instanceMatrix.needsUpdate = true;
      return;
    }

    for (let i = 0; i < n; i++) {
      const [x, y, z] = cellToWorld(snake[i]);
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instRef}
      args={[geometry, material, Math.max(1, snake.length)]}
    />
  );
}