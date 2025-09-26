import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, View } from "@react-three/drei";
import { useStore } from "../../game/store/store";

import MiniControlCube from "./MiniControlCube";
import { setMainCamera } from "../../cameraSync";
import type { Vec3 } from "../../game/store/types";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CELL } from "../../game/defaults";
import AllInOneMesh from "./AllInOneMesh";
import UniverseLines from "./UniverseLines";

function CameraSync({ target }: { target: Vec3 }) {
  const { camera } = useThree();
  useFrame(() => {
    setMainCamera({
      quat: camera.quaternion,
      pos: camera.position,
      target: new THREE.Vector3(target[0], target[1], target[2]),
    });
  });
  return null;
}

// Classic isometric view direction (yaw 45°, pitch ~35.264°)
function getIsoDirection(): THREE.Vector3 {
  const yaw = THREE.MathUtils.degToRad(45);
  const pitch = Math.atan(1 / Math.SQRT2);
  return new THREE.Vector3(
    Math.cos(pitch) * Math.cos(yaw),
    Math.sin(pitch),
    Math.cos(pitch) * Math.sin(yaw)
  ).normalize();
}

// Fit distance for perspective camera using a bounding-sphere approximation
function fitPerspectiveDistance({
  fovDeg,
  aspect,
  bboxSize, // [sx, sy, sz]
  margin = 1.8,
}: {
  fovDeg: number;
  aspect: number;
  bboxSize: [number, number, number];
  margin?: number;
}): number {
  const hx = bboxSize[0] / 2;
  const hy = bboxSize[1] / 2;
  const hz = bboxSize[2] / 2;
  const radius = Math.sqrt(hx * hx + hy * hy + hz * hz);

  const vFov = (fovDeg * Math.PI) / 180;
  const halfV = Math.tan(vFov / 2);
  const halfH = halfV * aspect;

  const distV = radius / halfV;
  const distH = radius / halfH;
  return Math.max(distV, distH) * margin;
}

function fitOrthoZoom({
  viewportWidthPx,
  viewportHeightPx,
  bboxSize, // [sx, sy, sz]
  margin = 1.8,
}: {
  viewportWidthPx: number;
  viewportHeightPx: number;
  bboxSize: [number, number, number];
  margin?: number;
}): number {
  const sx = bboxSize[0];
  const sy = bboxSize[1];
  const zoomX = (viewportWidthPx / sx) / margin;
  const zoomY = (viewportHeightPx / sy) / margin;
  return Math.min(zoomX, zoomY);
}


function IsometricOrthoCameraAuto({
  center,
  bbox,
  margin = 1.8,
}: {
  center: [number, number, number];
  bbox: [number, number, number];
  margin?: number;
}) {
  const { size } = useThree();
  const zoom = useMemo(
    () =>
      fitOrthoZoom({
        viewportWidthPx: size.width,
        viewportHeightPx: size.height,
        bboxSize: bbox,
        margin,
      }),
    [size.width, size.height, bbox, margin]
  );

  const dir = getIsoDirection();
  const distance = 100;
  const pos = new THREE.Vector3(center[0], center[1], center[2]).add(
    dir.multiplyScalar(distance)
  );

  return (
    <OrthographicCamera
      makeDefault
      position={[pos.x, pos.y, pos.z]}
      zoom={zoom}
      near={-1000}
      far={1000}
      onUpdate={(cam) => cam.lookAt(center[0], center[1], center[2])}
    />
  );
}

// Effect-only refit for perspective camera on dependency changes
function FitPerspectiveOnChange({
  center,
  bbox,
  fovDeg,
  margin = 1.8,
  active,
}: {
  center: [number, number, number];
  bbox: [number, number, number];
  fovDeg: number;
  margin?: number;
  active: boolean;
}) {
  const { camera, size } = useThree();
  const dir = useMemo(() => getIsoDirection(), []);

  useEffect(() => {
    if (!active) return;
    const aspect = size.width / size.height || 1;
    const dist = fitPerspectiveDistance({
      fovDeg,
      aspect,
      bboxSize: bbox,
      margin,
    });
    const pos = new THREE.Vector3(center[0], center[1], center[2]).add(
      dir.clone().multiplyScalar(dist)
    );
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(pos.x, pos.y, pos.z);
    cam.lookAt(center[0], center[1], center[2]);
    if (cam.fov !== fovDeg) {
      cam.fov = fovDeg;
    }
    cam.updateProjectionMatrix();
  }, [active, size.width, size.height, fovDeg, margin, camera, dir, bbox, center]);

  return null;
}

export default function Scene3D() {
  const { cameraMode, cameraType, dims, showControlsInMinicube } = useStore(
    (s) => s.settings
  );
  const bg = useStore((s) => s.colors.background);

  const sx = dims.w * CELL;
  const sy = dims.h * CELL;
  const sz = dims.d * CELL;
  const center: Vec3 = [sx / 2, sy / 2, sz / 2];
  const bbox: [number, number, number] = [sx, sy, sz];

  const container = useRef<HTMLDivElement>(null);

  // Perspective camera initial placeholder; effect will refit on mount/changes
  const fov = 35;
  const initialCamPos: Vec3 = [center[0] + 1, center[1] + 1, center[2] + 1];

  return (
    <div
      ref={container}
      style={{
        width: "100vw",
        height: "100%",
        background: bg,
        overflow: "hidden",
      }}
    >
      <View id="main-view" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <CameraSync target={center} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 7]} intensity={0.9} />
        <UniverseLines />
        <AllInOneMesh />

        {cameraType === "isometric" ? (
          <IsometricOrthoCameraAuto center={center} bbox={bbox} />
        ) : null}

        {cameraType === "perspective" ? (
          <FitPerspectiveOnChange
            center={center}
            bbox={bbox}
            fovDeg={fov}
            active={true}
          />
        ) : null}

        {cameraMode === "free" && (
          <OrbitControls enableZoom={true} minZoom={20} maxZoom={160} target={center} />
        )}
      </View>

      {showControlsInMinicube && (
        <View
          id="controls-view"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 160,
            height: 160,
            borderRadius: 10,
            overflow: "hidden",
            pointerEvents: "none",
            boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
          }}
        >
          <MiniControlCube />
        </View>
      )}

      <Canvas
        eventSource={container.current ?? undefined}
        style={{ position: "absolute", inset: 0 }}
        camera={
          cameraType === "perspective" ? { position: initialCamPos, fov } : undefined
        }
      >
        <View.Port />
      </Canvas>
    </div>
  );
}