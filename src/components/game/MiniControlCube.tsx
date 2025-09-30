import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useStore } from "../../game/store/store";
import { mainCameraPos, mainTarget } from "../../cameraSync";
import type { Vec3 } from "../../game/store/types";
import { humanizeKey } from "../../game/helpers";

type FaceInfo = {
  key: string;
  dir: Vec3;
  labelPos: Vec3;
};

function useBindings(): Record<string, string> {
  const b = useStore((s) => s.settings.controls);
  return {
    UP: b.UP,
    DOWN: b.DOWN,
    LEFT: b.LEFT,
    RIGHT: b.RIGHT,
    IN: b.IN,
    OUT: b.OUT,
  };
}

function FaceLabels({ size = 0.9 }: { size?: number }) {
  const bindings = useBindings();
  const { camera } = useThree();
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const half = size / 2;
  const faces: FaceInfo[] = useMemo(
    () => [
      {
        key: bindings.UP ?? "?",
        dir: [0, 1, 0],
        labelPos: [0, half + 0.02, 0],
      },
      {
        key: bindings.DOWN ?? "?",
        dir: [0, -1, 0],
        labelPos: [0, -half - 0.02, 0],
      },
      {
        key: bindings.RIGHT ?? "?",
        dir: [1, 0, 0],
        labelPos: [half + 0.02, 0, 0],
      },
      {
        key: bindings.LEFT ?? "?",
        dir: [-1, 0, 0],
        labelPos: [-half - 0.02, 0, 0],
      },
      {
        key: bindings.OUT ?? "?",
        dir: [0, 0, 1],
        labelPos: [0, 0, half + 0.02],
      },
      {
        key: bindings.IN ?? "?",
        dir: [0, 0, -1],
        labelPos: [0, 0, -half - 0.02],
      },
    ],
    [bindings, half]
  );

  const spanRefs = useRef<HTMLSpanElement[]>([]);
  useFrame(() => {
    camera.getWorldDirection(camDir);
    for (let i = 0; i < faces.length; i++) {
      tmp.set(faces[i].dir[0], faces[i].dir[1], faces[i].dir[2]).normalize();
      const dot = camDir.dot(tmp);
      const opacity = 1-Math.max((dot + 1) / 2, 0);
      const el = spanRefs.current[i];
      if (el) el.style.opacity = String(opacity);
    }
  });

  return (
    <group>
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial
          color="#94a3b8"
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {faces.map((f, i) => (
        <Html key={i} position={f.labelPos} center distanceFactor={6}>
          <span
            ref={(el) => {
              if (el) spanRefs.current[i] = el;
            }}
            style={{
              pointerEvents: "none",
              fontFamily: "system-ui, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              opacity: 1, // initial; will be overridden per-frame
              transition: "opacity 0.05s linear", // optional smoothing
            }}
          >
            {humanizeKey(f.key)}
          </span>
        </Html>
      ))}
    </group>
  );
}

export default function MiniControlCube() {
  const camRef = useRef<THREE.PerspectiveCamera>(null!);
  const set = useThree((s) => s.set);
  const r = 3; // mini camera radius for size=1 cube

  useLayoutEffect(() => {
    if (camRef.current) {
      set({ camera: camRef.current });
      camRef.current.name = "MINI_VIEW_CAM";
    }
  }, [set]);

  useFrame(() => {
    const cam = camRef.current;

    // Vector from main target to main camera
    const dx = mainCameraPos.x - mainTarget.x;
    const dy = mainCameraPos.y - mainTarget.y;
    const dz = mainCameraPos.z - mainTarget.z;

    // Spherical angles
    const theta = Math.atan2(dx, dz); // azimuth around Y
    const phi = Math.atan2(dy, Math.hypot(dx, dz)); // elevation

    // Rebuild mini camera position around origin with same angles
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const x = r * sinTheta * cosPhi;
    const y = r * sinPhi;
    const z = r * cosTheta * cosPhi;

    cam.position.set(x, y, z);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);

    cam.fov = 35;
    cam.near = 0.1;
    cam.far = 1000;
    cam.updateProjectionMatrix();
  });

  return (
    <>
      <perspectiveCamera ref={camRef} args={[35, 1, 0.1, 1000]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} />
      <FaceLabels size={1} />
    </>
  );
}
