import { shaderMaterial } from "@react-three/drei";

// Define your vertex shader as a string
const snakeVertexShader = /* glsl */ `
  attribute vec3 instanceColor; // Declare the instanceColor attribute
  varying vec3 vColor;         // Pass color to the fragment shader

  void main() {
    vColor = instanceColor;    // Assign instanceColor to vColor
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Define your fragment shader as a string
const snakeFragmentShader = /* glsl */ `
  varying vec3 vColor; // Receive color from the vertex shader

  void main() {
    gl_FragColor = vec4(vColor, 1.0); // Use the interpolated color
  }
`;

// Define your custom ShaderMaterial using shaderMaterial from drei
// We don't need uniforms if we're only using instanceColor for this basic example.
// If you wanted global uniforms, you'd define them here.
export const SnakeShaderMaterial = shaderMaterial(
  {}, // No uniforms needed for this simple case where we only use instanceColor
  snakeVertexShader,
  snakeFragmentShader
);

// This is crucial for @react-three/fiber to recognize your custom material as a JSX element
// You'll `extend` this in your main component file (e.g., SnakeMesh.tsx)
// export const SnakeMaterial = extend({ SnakeShaderMaterial }); // This is done in the component now