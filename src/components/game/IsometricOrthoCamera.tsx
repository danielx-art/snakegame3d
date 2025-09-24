import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

export default function IsometricOrthoCamera({
  center,
  zoom,
}: {
  center: [number, number, number];
  zoom: number;
}) {
  const yaw = THREE.MathUtils.degToRad(45);
  const pitch = Math.atan(1 / Math.SQRT2);

  const dir = new THREE.Vector3(
    Math.cos(pitch) * Math.cos(yaw),
    Math.sin(pitch),
    Math.cos(pitch) * Math.sin(yaw)
  ).normalize();

  const distance = 100; // arbitrary; only affects OrbitControls feel
  const pos = new THREE.Vector3(...center).add(dir.multiplyScalar(distance));


  return (
    <OrthographicCamera
      makeDefault
      position={[pos.x, pos.y, pos.z]}
      zoom={zoom}
      // Important for correct pixel ratio; R3F will update left/right/top/bottom
      near={-1000}
      far={1000}
      onUpdate={(cam) => cam.lookAt(center[0], center[1], center[2])}
    />
  );
}