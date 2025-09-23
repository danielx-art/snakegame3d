import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "../../game/store/store";
import { CELL } from "../../game/defaults";

export default function AllInOneMesh() {
  const dims = useStore((s) => s.settings.dims);
  const colors = useStore((s) => s.colors);
  const snake = useStore((s) => s.game.snake);
  const food = useStore((s) => s.game.food);

  const total = dims.w * dims.h * dims.d;

  const indexOf = useMemo(() => {
    return (x: number, y: number, z: number) => x + dims.w * (y + dims.h * z);
  }, [dims.w, dims.h]);

  const instRef = useRef<THREE.InstancedMesh>(null!);

  const geometry = useMemo(() => new THREE.BoxGeometry(CELL, CELL, CELL), []);

  // Two per-instance attributes:
  // - instanceState: float, encodes kind (0 empty, 1 snake body, 2 snake head, 3 food, 4 boundary)
  // - instanceCenterZ: float, stores world z position for colors gradient
  const instanceState = useMemo(
    () => new THREE.InstancedBufferAttribute(new Float32Array(total), 1),
    [total]
  );
  const instanceCenterZ = useMemo(
    () => new THREE.InstancedBufferAttribute(new Float32Array(total), 1),
    [total]
  );

  // We attach these attributes to the geometry once
  useEffect(() => {
    geometry.setAttribute("instanceState", instanceState);
    geometry.setAttribute("instanceCenterZ", instanceCenterZ);
    // Cleanup on unmount
    return () => {
      geometry.deleteAttribute("instanceState");
      geometry.deleteAttribute("instanceCenterZ");
    };
  }, [geometry, instanceState, instanceCenterZ]);

  // Build the instancing transforms (instanceMatrix) once, based on dims
  useEffect(() => {
    const inst = instRef.current;
    if (!inst) return;

const dummy = new THREE.Object3D();

// centers from 0..dims.* * CELL
for (let z = 0; z < dims.d; z++) {
  for (let y = 0; y < dims.h; y++) {
    for (let x = 0; x < dims.w; x++) {
      const i = indexOf(x, y, z);
      const wx = (x + 0.5) * CELL;
      const wy = (y + 0.5) * CELL;
      const wz = (z + 0.5) * CELL;

      dummy.position.set(wx, wy, wz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);

      instanceState.setX(i, 0);
      instanceCenterZ.setX(i, wz); // world Z center
    }
  }
}
inst.count = total;
inst.instanceMatrix.needsUpdate = true;
instanceState.needsUpdate = true;
instanceCenterZ.needsUpdate = true;

    // Optionally compute bounds for proper culling
    inst.computeBoundingSphere();
    inst.computeBoundingBox();
  }, [dims.w, dims.h, dims.d, total, indexOf, instanceState, instanceCenterZ]);

  // Raw shaders: we color by instanceState and instanceCenterZ
  const vertexShader = `
    precision highp float;
    precision highp int;

    attribute vec3 position;
    attribute mat4 instanceMatrix;

    // custom per-instance data
    attribute float instanceState;
    attribute float instanceCenterZ;

    uniform mat4 projectionMatrix;
    uniform mat4 viewMatrix;

    // pass to fragment
    varying float vState;
    varying float vCenterZ;

    void main() {
      vState = instanceState;
      vCenterZ = instanceCenterZ;

      vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `;

  const fragmentShader = `
    precision mediump float;
    precision mediump int;

    varying float vState;
    varying float vCenterZ;

    uniform float uDimsD;
    uniform float uCellSize;
    uniform vec3 uSnakeFront;
    uniform vec3 uSnakeBack;
    uniform vec3 uSnakeHead;
    uniform vec3 uFood;
    uniform vec3 uBackground;
    uniform bool uHideEmpty; // if true, discard empties

    void main() {
      // vState: 0 empty, 1 body, 2 head, 3 food, 4 boundary (optional)
      if (vState < 0.5) {
        if (uHideEmpty) discard;
        gl_FragColor = vec4(uBackground, 1.0);
        return;
      }

      vec3 col = uBackground;

      if (abs(vState - 2.0) < 0.5) {
        // snake head
        col = uSnakeHead;
      } else if (abs(vState - 1.0) < 0.5) {
        float depthWorld = max(1.0, uDimsD * uCellSize);
        float minZ = 0.5 * uCellSize;
        float maxZ = depthWorld - 0.5 * uCellSize;
        float denom = max(1e-6, (maxZ - minZ));
        float t = clamp((vCenterZ - minZ) / denom, 0.0, 1.0);
        col = mix(uSnakeFront, uSnakeBack, t);
      } else if (abs(vState - 3.0) < 0.5) {
        // food
        col = uFood;
      } else {
        // boundary or others
        col = uBackground;
      }

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  const material = useMemo(
    () =>
      new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uSnakeFront: {
            value: new THREE.Color(
              colors.snakeFront ?? colors.snake ?? "#ffffff"
            ),
          },
          uSnakeBack: {
            value: new THREE.Color(
              colors.snakeBack ?? colors.snake ?? "#ffffff"
            ),
          },
          uSnakeHead: {
            value: new THREE.Color(
              colors.snakeHead ?? colors.snake ?? "#ffffff"
            ),
          },
          uFood: { value: new THREE.Color(colors.food ?? "#ff0000") },
          uBackground: {
            value: new THREE.Color(colors.background ?? "#000000"),
          },
          uDimsD: { value: dims.d },
          uCellSize: { value: CELL },
          uHideEmpty: { value: true }, // discard empty cells for performance
        },
        side: THREE.FrontSide,
        depthTest: true,
        depthWrite: true,
        transparent: true, // allows discard without writing depth
      }),
    [
      colors.background,
      colors.food,
      colors.snake,
      colors.snakeBack,
      colors.snakeFront,
      colors.snakeHead,
      dims.d,
      fragmentShader,
      vertexShader,
    ]
  );

  // Keep uniform colors and dims in sync
  useEffect(() => {
    (material.uniforms.uSnakeFront.value as THREE.Color).set(
      colors.snakeFront ?? colors.snake ?? "#ffffff"
    );
  }, [colors.snakeFront, colors.snake, material]);

  useEffect(() => {
    (material.uniforms.uSnakeBack.value as THREE.Color).set(
      colors.snakeBack ?? colors.snake ?? "#ffffff"
    );
  }, [colors.snakeBack, colors.snake, material]);

  useEffect(() => {
    (material.uniforms.uSnakeHead.value as THREE.Color).set(
      colors.snakeHead ?? colors.snake ?? "#ffffff"
    );
  }, [colors.snakeHead, colors.snake, material]);

  useEffect(() => {
    (material.uniforms.uFood.value as THREE.Color).set(
      colors.food ?? "#ff0000"
    );
  }, [colors.food, material]);

  useEffect(() => {
    (material.uniforms.uBackground.value as THREE.Color).set(
      colors.background ?? "#000000"
    );
  }, [colors.background, material]);

  useEffect(() => {
    material.uniforms.uDimsD.value = dims.d;
  }, [dims.d, material]);

  // Update per-instance state when the game changes.
  // Set all to empty, then mark snake head/body and food.
  useEffect(() => {
    const inst = instRef.current;
    if (!inst) return;

    // Reset to empty
    for (let i = 0; i < total; i++) instanceState.setX(i, 0);

    // Mark snake
    if (snake.length > 0) {
      // Mark as Head (2)
      {
        const [hx, hy, hz] = snake[0];
        if (
          hx >= 0 &&
          hy >= 0 &&
          hz >= 0 &&
          hx < dims.w &&
          hy < dims.h &&
          hz < dims.d
        ) {
          const hi = indexOf(hx, hy, hz);
          instanceState.setX(hi, 2);
        }
      }

      // Mar as Body (1)
      for (let k = 1; k < snake.length; k++) {
        const [x, y, z] = snake[k];
        if (
          x < 0 ||
          y < 0 ||
          z < 0 ||
          x >= dims.w ||
          y >= dims.h ||
          z >= dims.d
        )
          continue;
        const i = indexOf(x, y, z);
        instanceState.setX(i, 1);
      }
    }

    // Mark food (3)
    {
      const [fx, fy, fz] = food;
      if (
        fx >= 0 &&
        fy >= 0 &&
        fz >= 0 &&
        fx < dims.w &&
        fy < dims.h &&
        fz < dims.d
      ) {
        const fi = indexOf(fx, fy, fz);
        instanceState.setX(fi, 3);
      }
    }

    // Push to GPU to update before the next render
    instanceState.needsUpdate = true;

    // inst.computeBoundingSphere();
  }, [snake, food, dims.w, dims.h, dims.d, indexOf, total, instanceState]);

  return (
    <instancedMesh
      ref={instRef}
      args={[geometry, material, total]}
    />
  );
}
