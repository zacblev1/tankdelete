import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { BACK_PORTAL_COLOR } from '../../lib/colors';

interface BackPortalProps {
  parentPath: string;
}

export function BackPortal({ parentPath }: BackPortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const scale = 0.8;
  const tunnelWidth = 2.0 * scale;
  const tunnelHeight = 2.5 * scale;
  const tunnelDepth = 3.0 * scale;
  const wallThickness = 0.08 * scale;
  const pillarWidth = 0.15 * scale;

  const pillarGeometry = useMemo(() => new THREE.BoxGeometry(pillarWidth, tunnelHeight, pillarWidth), [pillarWidth, tunnelHeight]);
  const pillarEdges = useMemo(() => new THREE.EdgesGeometry(pillarGeometry, 15), [pillarGeometry]);

  const wallGeometry = useMemo(() => new THREE.BoxGeometry(wallThickness, tunnelHeight, tunnelDepth), [wallThickness, tunnelHeight, tunnelDepth]);
  const wallEdges = useMemo(() => new THREE.EdgesGeometry(wallGeometry, 15), [wallGeometry]);

  const ceilingGeometry = useMemo(() => new THREE.BoxGeometry(tunnelWidth, wallThickness, tunnelDepth), [tunnelWidth, wallThickness, tunnelDepth]);
  const ceilingEdges = useMemo(() => new THREE.EdgesGeometry(ceilingGeometry, 15), [ceilingGeometry]);

  const archRadius = tunnelWidth / 2;
  const archThickness = 0.08 * scale;
  const archGeometry = useMemo(() => new THREE.TorusGeometry(archRadius, archThickness, 8, 32, Math.PI), [archRadius, archThickness]);
  const archEdges = useMemo(() => new THREE.EdgesGeometry(archGeometry, 15), [archGeometry]);

  const ribGeometry = useMemo(() => new THREE.TorusGeometry(archRadius, archThickness * 0.5, 8, 32, Math.PI), [archRadius, archThickness]);
  const ribEdges = useMemo(() => new THREE.EdgesGeometry(ribGeometry, 15), [ribGeometry]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    groupRef.current.traverse(child => {
      if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.7 + Math.sin(time * 2 + Math.PI) * 0.3;
      }
    });
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
  };

  const emissiveIntensity = hovered ? 2.0 : 1.0;
  const parentName = parentPath.split('/').filter(Boolean).pop() || '/';
  // Tunnel extends in -Z (behind the entrance, toward the back)
  const tunnelCenter = -tunnelDepth / 2;

  return (
    <group ref={groupRef} position={[0, 0.5, -15]}>
      {/* Front entrance pillars */}
      <group position={[-tunnelWidth / 2, tunnelHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>
      <group position={[tunnelWidth / 2, tunnelHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Front arch */}
      <group position={[0, tunnelHeight, 0]}>
        <lineSegments geometry={archEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Left tunnel wall */}
      <group position={[-tunnelWidth / 2, tunnelHeight / 2, tunnelCenter]}>
        <lineSegments geometry={wallEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[wallThickness, tunnelHeight, tunnelDepth]} />
          <meshStandardMaterial color={BACK_PORTAL_COLOR} emissive={BACK_PORTAL_COLOR} emissiveIntensity={emissiveIntensity * 0.3} transparent opacity={0.03} toneMapped={false} />
        </mesh>
      </group>

      {/* Right tunnel wall */}
      <group position={[tunnelWidth / 2, tunnelHeight / 2, tunnelCenter]}>
        <lineSegments geometry={wallEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[wallThickness, tunnelHeight, tunnelDepth]} />
          <meshStandardMaterial color={BACK_PORTAL_COLOR} emissive={BACK_PORTAL_COLOR} emissiveIntensity={emissiveIntensity * 0.3} transparent opacity={0.03} toneMapped={false} />
        </mesh>
      </group>

      {/* Ceiling */}
      <group position={[0, tunnelHeight, tunnelCenter]}>
        <lineSegments geometry={ceilingEdges}>
          <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[tunnelWidth, wallThickness, tunnelDepth]} />
          <meshStandardMaterial color={BACK_PORTAL_COLOR} emissive={BACK_PORTAL_COLOR} emissiveIntensity={emissiveIntensity * 0.3} transparent opacity={0.03} toneMapped={false} />
        </mesh>
      </group>

      {/* Interior ribs */}
      {[1, 2].map(i => (
        <group key={i} position={[0, tunnelHeight, -tunnelDepth * (i / 3)]}>
          <lineSegments geometry={ribEdges}>
            <lineBasicMaterial color={BACK_PORTAL_COLOR} toneMapped={false} transparent opacity={0.4} />
          </lineSegments>
        </group>
      ))}

      {/* Portal glow interior */}
      <mesh
        position={[0, tunnelHeight / 2, tunnelCenter]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[tunnelWidth, tunnelHeight, tunnelDepth]} />
        <meshStandardMaterial color={BACK_PORTAL_COLOR} emissive={BACK_PORTAL_COLOR} emissiveIntensity={emissiveIntensity} transparent opacity={0.02} toneMapped={false} />
      </mesh>

      {/* Back label */}
      <Text
        position={[0, tunnelHeight + 0.5 * scale, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.3 * scale}
        color={BACK_PORTAL_COLOR}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02 * scale}
        outlineColor="#000000"
      >
        BACK
      </Text>

      {/* Parent directory name */}
      <Text
        position={[0, tunnelHeight + 0.2 * scale, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.15 * scale}
        color="#00ffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.01 * scale}
        outlineColor="#000000"
      >
        {parentName}
      </Text>
    </group>
  );
}
