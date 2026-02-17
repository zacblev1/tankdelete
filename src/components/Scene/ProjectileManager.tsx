import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Projectile } from '../../hooks/useProjectilePool';
import { PROJECTILE_SPEED, PROJECTILE_MAX_LIFETIME } from '../../lib/constants';
import { BlockData } from '../../hooks/useFileBlocks';

const MAX_PROJECTILES = 20;
const HIT_RADIUS = 1.5; // Distance threshold for projectile-block collision

interface ProjectileManagerProps {
  pool: React.RefObject<Projectile[]>;
  despawn: (index: number) => void;
  onHit: (filePath: string) => void;
  allBlocks: BlockData[];
}

export function ProjectileManager({
  pool,
  despawn,
  onHit,
  allBlocks,
}: ProjectileManagerProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Pre-allocate temp vectors
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const tempScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  useFrame((_state, delta) => {
    if (!pool.current || !meshRef.current) return;

    let visibleCount = 0;

    for (let i = 0; i < pool.current.length; i++) {
      const projectile = pool.current[i];
      if (!projectile.active) continue;

      // Move projectile
      projectile.position.addScaledVector(projectile.direction, PROJECTILE_SPEED * delta);
      projectile.lifetime += delta;

      // Despawn if too old
      if (projectile.lifetime > PROJECTILE_MAX_LIFETIME) {
        despawn(i);
        continue;
      }

      // Proximity-based hit detection — find nearest block within hit radius
      let hitBlock: BlockData | null = null;
      let minDist = Infinity;

      for (const block of allBlocks) {
        const dist = tempPosition.set(...block.position).distanceTo(projectile.position);
        if (dist < minDist && dist < HIT_RADIUS) {
          minDist = dist;
          hitBlock = block;
        }
      }

      if (hitBlock) {
        onHit(hitBlock.path);
        despawn(i);
        continue;
      }

      // Update instance matrix for visible projectile
      tempScale.set(1, 1, 1);
      tempMatrix.compose(projectile.position, tempQuaternion, tempScale);
      meshRef.current.setMatrixAt(visibleCount, tempMatrix);
      visibleCount++;
    }

    meshRef.current.count = visibleCount;
    if (visibleCount > 0) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PROJECTILES]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshBasicMaterial color="#00ffff" toneMapped={false} />
    </instancedMesh>
  );
}
