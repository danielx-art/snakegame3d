import * as THREE from "three";

export const mainCameraQuat = new THREE.Quaternion();
export const mainCameraPos = new THREE.Vector3();
export const mainTarget = new THREE.Vector3(); // OrbitControls target

export function setMainCamera(from: {
  quat: THREE.Quaternion;
  pos: THREE.Vector3;
  target: THREE.Vector3;
}) {
  mainCameraQuat.copy(from.quat);
  mainCameraPos.copy(from.pos);
  mainTarget.copy(from.target);
}