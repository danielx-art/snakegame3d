import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, View } from "@react-three/drei";
import { useStore } from "../../game/store/store";

import MiniControlCube from "./MiniControlCube";
import { setMainCamera } from "../../cameraSync";
import type { Vec3 } from "../../game/store/types";
import FaceGridLines from "./FaceGridLines";
import { useRef } from "react";
import * as THREE from "three";
import { CELL } from "../../game/defaults";
import AllInOneMesh from "./AllInOneMesh";
import UniverseLines from "./UniverseLines";
import UniverseLinesV2 from "./UniverseLinesV2";

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

export default function Scene3D() {
  const {cameraMode, dims, showControlsInMinicube} = useStore(s=>s.settings);
  const bg = useStore((s) => s.colors.background);

  const sx = dims.w * CELL;
  const sy = dims.h * CELL;
  const sz = dims.d * CELL;
  const center: Vec3 = [sx / 2, sy / 2, sz / 2];

  const maxDim = Math.max(sx, sy, sz);
  const camPos: Vec3 = [
    center[0] + maxDim * 1.2,
    center[1] + maxDim * 1.2,
    center[2] + maxDim * 1.2,
  ];

  const container = useRef<HTMLDivElement>(null);

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
        {/* <FaceGridLines /> */}
        <UniverseLines />
        <AllInOneMesh />
        {/* <UniverseLinesV2 /> */}
        <OrbitControls target={center} enablePan={false} />
        {cameraMode == "free" && <OrbitControls target={center} enablePan={false} />}
      </View>
      {showControlsInMinicube && <View
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
      </View>}
      {container.current && (
        <Canvas
          camera={{ position: camPos, fov: 35 }}
          eventSource={container.current}
          style={{ position: "absolute", inset: 0 }}
        >
          <View.Port />
        </Canvas>
      )}
    </div>
  );
}
