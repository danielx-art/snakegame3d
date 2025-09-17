import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useStore } from "../../game/store/store";
import { cellToWorld } from "../../game/helpers";
import { CELL } from "../../game/defaults";

export default function SnakeMesh() {
  const snake = useStore((s) => s.game.snake);
  const colors = useStore((s) => s.colors);
  const instRef = useRef<THREE.InstancedMesh>(null!);

  const geometry = useMemo(() => new THREE.BoxGeometry(CELL, CELL, CELL), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colors.snake }),
    [colors.snake]
  );
  const headColor = useMemo(() => new THREE.Color(colors.snakeHead), [colors.snakeHead]);
  const bodyColor = useMemo(() => new THREE.Color(colors.snake), [colors.snake]);

useFrame(() => {
  if (!instRef.current) return;
  const dummy = new THREE.Object3D();
  instRef.current.count = Math.max(0, snake.length);
  for (let i = 0; i < snake.length; i++) {
    const [x, y, z] = cellToWorld(snake[i]);
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    instRef.current.setMatrixAt(i, dummy.matrix);
    instRef.current.setColorAt(i, i === 0 ? headColor : bodyColor);
  }
  instRef.current.instanceMatrix.needsUpdate = true;

  const anyInst = instRef.current;
  if (anyInst.instanceColor) {
    anyInst.instanceColor.needsUpdate = true;
  }
});

  return <instancedMesh ref={instRef} args={[geometry, material, Math.max(1, snake.length)]} />;
}