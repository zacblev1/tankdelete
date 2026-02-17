import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROAD_GRID_SPACING } from '../../lib/constants';

const vertexShader = /* glsl */ `
  varying vec2 vWorldPos;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uGridSpacing;
  uniform vec3 uColor;

  varying vec2 vWorldPos;

  void main() {
    float spacing = uGridSpacing;

    // Distance to nearest grid line
    float dX = abs(mod(vWorldPos.x + spacing * 0.5, spacing) - spacing * 0.5);
    float dZ = abs(mod(vWorldPos.y + spacing * 0.5, spacing) - spacing * 0.5);

    // Thin road line (0.15 unit half-width) with soft edges
    float roadX = 1.0 - smoothstep(0.1, 0.25, dX);
    float roadZ = 1.0 - smoothstep(0.1, 0.25, dZ);

    // Subtle ambient glow near roads
    float glowX = (1.0 - smoothstep(0.0, 2.0, dX)) * 0.06;
    float glowZ = (1.0 - smoothstep(0.0, 2.0, dZ)) * 0.06;

    // Combine — roads are additive, glow is soft background
    float road = max(roadX, roadZ) * 0.5;
    float glow = max(glowX, glowZ);

    // Brighter nodes at intersections
    float node = roadX * roadZ * 0.8;

    // Slow animated energy pulse along roads
    float pulseX = (sin(vWorldPos.x * 0.3 + uTime * 1.2) * 0.5 + 0.5) * roadX;
    float pulseZ = (sin(vWorldPos.y * 0.3 - uTime * 0.9) * 0.5 + 0.5) * roadZ;
    float pulse = max(pulseX, pulseZ) * 0.15;

    float total = road + glow + node + pulse;

    // Distance fade
    float dist = length(vWorldPos) / 120.0;
    total *= 1.0 - smoothstep(0.4, 1.0, dist);

    if (total < 0.005) discard;

    gl_FragColor = vec4(uColor * total, total * 0.7);
  }
`;

export function TronGrid() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGridSpacing: { value: ROAD_GRID_SPACING },
    uColor: { value: new THREE.Color('#00ffff') },
  }), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[250, 250]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
