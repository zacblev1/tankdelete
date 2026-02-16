import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 80;

  // Pre-allocated objects
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // Initialize particle positions
  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * 60,
      y: Math.random() * 7.5 + 0.5,
      z: (Math.random() - 0.5) * 60,
      speedY: Math.random() * 0.02 + 0.01,
      wanderSpeed: Math.random() * 0.5 + 0.5,
      wanderAmplitude: Math.random() * 0.3 + 0.1,
    }));
  }, []);

  // Animate particles
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      const particle = particleData[i];

      // Drift upward
      particle.y += particle.speedY;

      // Wrap around when reaching top
      if (particle.y > 8) {
        particle.y = 0.5;
        particle.x = (Math.random() - 0.5) * 60;
        particle.z = (Math.random() - 0.5) * 60;
      }

      // Sine wave horizontal wander
      const wanderX = Math.sin(time * particle.wanderSpeed + i) * particle.wanderAmplitude;
      const wanderZ = Math.cos(time * particle.wanderSpeed + i * 0.7) * particle.wanderAmplitude;

      tempPosition.set(particle.x + wanderX, particle.y, particle.z + wanderZ);
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <sphereGeometry args={[0.02, 4, 4]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={1.5}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
