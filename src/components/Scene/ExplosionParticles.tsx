import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Explosion } from '../../hooks/useExplosionPool';

const MAX_PARTICLES = 2000;

interface ParticleData {
  active: boolean;
  explosionId: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  baseScale: number;
  life: number;
  maxLife: number;
}

interface ExplosionParticlesProps {
  explosions: Explosion[];
  onExplosionComplete: (id: number) => void;
}

export function ExplosionParticles({ explosions, onExplosionComplete }: ExplosionParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-allocated temp objects for matrix operations
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // Pre-allocated particle data array
  const particleData = useMemo<ParticleData[]>(() => {
    return Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      explosionId: -1,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      color: new THREE.Color(),
      baseScale: 0,
      life: 0,
      maxLife: 0,
    }));
  }, []);

  // Track which explosions we've spawned particles for
  const spawnedExplosionsRef = useRef<Set<number>>(new Set());

  // Initialize instance colors
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      meshRef.current.setColorAt(i, new THREE.Color(1, 1, 1));
    }

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const now = performance.now();

    // Spawn particles for new explosions
    for (const explosion of explosions) {
      if (spawnedExplosionsRef.current.has(explosion.id)) continue;

      const age = (now - explosion.spawnTime) / 1000;
      if (age >= delta) continue; // Already past first frame

      spawnedExplosionsRef.current.add(explosion.id);

      // Calculate particle count based on scale: 20-500
      const particleCount = Math.min(
        Math.max(Math.floor(explosion.scale * 200), 20),
        500
      );

      let spawned = 0;

      for (let i = 0; i < MAX_PARTICLES && spawned < particleCount; i++) {
        if (particleData[i].active) continue;

        // Activate particle
        particleData[i].active = true;
        particleData[i].explosionId = explosion.id;
        particleData[i].position.copy(explosion.position);

        // Random scatter velocity: outward in XZ plane + upward bias
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3; // 2-5 units/sec
        const vx = Math.cos(angle) * speed;
        const vz = Math.sin(angle) * speed;
        const vy = 0.5 + Math.random() * 1.5; // 0.5-2.0 upward

        particleData[i].velocity.set(vx, vy, vz);

        // Color from explosion
        particleData[i].color.set(explosion.color);

        // Particle size and lifetime
        particleData[i].baseScale = 0.08 + Math.random() * 0.08;
        particleData[i].life = 0;
        particleData[i].maxLife = 1.0 + Math.random() * 0.5;

        spawned++;
      }
    }

    // Update all active particles
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const particle = particleData[i];

      if (!particle.active) {
        // Hide inactive particles
        tempScale.set(0, 0, 0);
        tempMatrix.compose(tempPosition.set(0, -1000, 0), tempQuaternion, tempScale);
        meshRef.current.setMatrixAt(i, tempMatrix);
        continue;
      }

      // Apply half-gravity for floaty digital feel
      particle.velocity.y -= 4.9 * delta;

      // Advance position
      particle.position.x += particle.velocity.x * delta;
      particle.position.y += particle.velocity.y * delta;
      particle.position.z += particle.velocity.z * delta;

      // Advance life
      particle.life += delta;

      // Check if particle should die
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        continue;
      }

      // Fade scale for dissolve effect
      const lifeProgress = particle.life / particle.maxLife;
      const scale = particle.baseScale * (1 - lifeProgress);

      // Update matrix
      tempScale.set(scale, scale, scale);
      tempMatrix.compose(particle.position, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(i, tempMatrix);

      // Update color
      meshRef.current.setColorAt(i, particle.color);
    }

    // Check for completed explosions
    for (const explosion of explosions) {
      const age = (now - explosion.spawnTime) / 1000;
      if (age <= 2.5) continue; // Not old enough to check

      // Check if any particles still active for this explosion
      const hasActiveParticles = particleData.some(
        (p) => p.active && p.explosionId === explosion.id
      );

      if (!hasActiveParticles) {
        spawnedExplosionsRef.current.delete(explosion.id);
        onExplosionComplete(explosion.id);
      }
    }

    // Mark for update
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshStandardMaterial
        vertexColors
        emissive="white"
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
