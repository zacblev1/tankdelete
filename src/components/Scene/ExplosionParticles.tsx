import { useRef, useMemo } from 'react';
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
  const initializedRef = useRef(false);

  // Pre-allocated temp objects for matrix operations
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const hiddenMatrix = useMemo(() => {
    const m = new THREE.Matrix4();
    m.compose(new THREE.Vector3(0, -1000, 0), new THREE.Quaternion(), new THREE.Vector3(0, 0, 0));
    return m;
  }, []);

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
  // Track indices of active particles for efficient iteration
  const activeIndicesRef = useRef<Set<number>>(new Set());

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // One-time initialization: hide all instances
    if (!initializedRef.current) {
      initializedRef.current = true;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        meshRef.current.setMatrixAt(i, hiddenMatrix);
        meshRef.current.setColorAt(i, new THREE.Color(1, 1, 1));
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
      // Set count to 0 initially so nothing renders
      meshRef.current.count = 0;
      return;
    }

    // Early exit if no explosions and no active particles
    if (explosions.length === 0 && activeIndicesRef.current.size === 0) return;

    const now = performance.now();
    let needsMatrixUpdate = false;
    let needsColorUpdate = false;

    // Spawn particles for new explosions
    for (const explosion of explosions) {
      if (spawnedExplosionsRef.current.has(explosion.id)) continue;

      // Allow spawning within the first 100ms (not just first frame)
      const age = (now - explosion.spawnTime) / 1000;
      if (age >= 0.1) continue;

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
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vz = Math.sin(angle) * speed;
        const vy = 0.5 + Math.random() * 1.5;

        particleData[i].velocity.set(vx, vy, vz);
        particleData[i].color.set(explosion.color);
        particleData[i].baseScale = 0.08 + Math.random() * 0.08;
        particleData[i].life = 0;
        particleData[i].maxLife = 1.0 + Math.random() * 0.5;

        activeIndicesRef.current.add(i);
        spawned++;
      }
    }

    // Update active particles only
    let maxActiveIndex = 0;
    for (const i of activeIndicesRef.current) {
      const particle = particleData[i];

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
        meshRef.current.setMatrixAt(i, hiddenMatrix);
        activeIndicesRef.current.delete(i);
        needsMatrixUpdate = true;
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

      if (i > maxActiveIndex) maxActiveIndex = i;
      needsMatrixUpdate = true;
      needsColorUpdate = true;
    }

    // Set instance count to cover only used range
    meshRef.current.count = activeIndicesRef.current.size > 0 ? maxActiveIndex + 1 : 0;

    // Check for completed explosions
    for (const explosion of explosions) {
      const age = (now - explosion.spawnTime) / 1000;
      if (age <= 2.5) continue;

      const hasActiveParticles = particleData.some(
        (p) => p.active && p.explosionId === explosion.id
      );

      if (!hasActiveParticles) {
        spawnedExplosionsRef.current.delete(explosion.id);
        onExplosionComplete(explosion.id);
      }
    }

    // Mark for update only when needed
    if (needsMatrixUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (needsColorUpdate && meshRef.current.instanceColor) {
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
