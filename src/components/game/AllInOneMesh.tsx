import { useOneMeshWithShaders } from "../../game/materials/useOneMeshWithShaders";



export default function AllInOneMesh() {
  
  const {instRef, geometry, material, total} = useOneMeshWithShaders();

  return (
    <instancedMesh
      ref={instRef}
      args={[geometry, material, total]}
    />
  );
}
