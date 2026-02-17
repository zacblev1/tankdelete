import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FileEntry } from '../../lib/types';
import { formatBytes } from '../../lib/format';
import { PORTAL_COLOR } from '../../lib/colors';

interface FolderPortalProps {
  folder: FileEntry;
  position: [number, number, number];
  scale: number;
  childCount: number;
  totalSize: number;
  onHover: (data: any | null) => void;
}

export function FolderPortal({
  folder,
  position,
  scale,
  childCount,
  totalSize,
  onHover,
}: FolderPortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Tunnel dimensions
  const tunnelWidth = 2.0 * scale;
  const tunnelHeight = 2.5 * scale;
  const tunnelDepth = 4.0 * scale;
  const wallThickness = 0.08 * scale;
  const pillarWidth = 0.15 * scale;

  // Geometries
  const pillarGeometry = useMemo(() => new THREE.BoxGeometry(pillarWidth, tunnelHeight, pillarWidth), [pillarWidth, tunnelHeight]);
  const pillarEdges = useMemo(() => new THREE.EdgesGeometry(pillarGeometry, 15), [pillarGeometry]);

  // Tunnel wall geometry (side walls extending back)
  const wallGeometry = useMemo(() => new THREE.BoxGeometry(wallThickness, tunnelHeight, tunnelDepth), [wallThickness, tunnelHeight, tunnelDepth]);
  const wallEdges = useMemo(() => new THREE.EdgesGeometry(wallGeometry, 15), [wallGeometry]);

  // Tunnel ceiling
  const ceilingGeometry = useMemo(() => new THREE.BoxGeometry(tunnelWidth, wallThickness, tunnelDepth), [tunnelWidth, wallThickness, tunnelDepth]);
  const ceilingEdges = useMemo(() => new THREE.EdgesGeometry(ceilingGeometry, 15), [ceilingGeometry]);

  // Arch at entrance
  const archRadius = tunnelWidth / 2;
  const archThickness = 0.08 * scale;
  const archGeometry = useMemo(() => new THREE.TorusGeometry(archRadius, archThickness, 8, 32, Math.PI), [archRadius, archThickness]);
  const archEdges = useMemo(() => new THREE.EdgesGeometry(archGeometry, 15), [archGeometry]);

  // Tunnel ring ribs (cross-section rings inside tunnel)
  const ribGeometry = useMemo(() => new THREE.TorusGeometry(archRadius, archThickness * 0.5, 8, 32, Math.PI), [archRadius, archThickness]);
  const ribEdges = useMemo(() => new THREE.EdgesGeometry(ribGeometry, 15), [ribGeometry]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();

    groupRef.current.traverse(child => {
      if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial;
        material.opacity = 0.7 + Math.sin(time * 2) * 0.3;
      }
    });
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHover({ folder, childCount, totalSize });
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
  };

  const emissiveIntensity = hovered ? 2.0 : 1.0;
  const tunnelCenter = tunnelDepth / 2; // offset for tunnel extending forward (+Z)

  return (
    <group ref={groupRef} position={position}>
      {/* Front entrance pillars */}
      <group position={[-tunnelWidth / 2, tunnelHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>
      <group position={[tunnelWidth / 2, tunnelHeight / 2, 0]}>
        <lineSegments geometry={pillarEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Front arch */}
      <group position={[0, tunnelHeight, 0]}>
        <lineSegments geometry={archEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Left tunnel wall */}
      <group position={[-tunnelWidth / 2, tunnelHeight / 2, tunnelCenter]}>
        <lineSegments geometry={wallEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[wallThickness, tunnelHeight, tunnelDepth]} />
          <meshStandardMaterial
            color={PORTAL_COLOR}
            emissive={PORTAL_COLOR}
            emissiveIntensity={emissiveIntensity * 0.3}
            transparent
            opacity={0.03}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Right tunnel wall */}
      <group position={[tunnelWidth / 2, tunnelHeight / 2, tunnelCenter]}>
        <lineSegments geometry={wallEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[wallThickness, tunnelHeight, tunnelDepth]} />
          <meshStandardMaterial
            color={PORTAL_COLOR}
            emissive={PORTAL_COLOR}
            emissiveIntensity={emissiveIntensity * 0.3}
            transparent
            opacity={0.03}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Ceiling */}
      <group position={[0, tunnelHeight, tunnelCenter]}>
        <lineSegments geometry={ceilingEdges}>
          <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.6} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[tunnelWidth, wallThickness, tunnelDepth]} />
          <meshStandardMaterial
            color={PORTAL_COLOR}
            emissive={PORTAL_COLOR}
            emissiveIntensity={emissiveIntensity * 0.3}
            transparent
            opacity={0.03}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Interior ribs (2 rings inside tunnel) */}
      {[1, 2, 3].map(i => (
        <group key={i} position={[0, tunnelHeight, tunnelDepth * (i / 4)]} rotation={[0, 0, 0]}>
          <lineSegments geometry={ribEdges}>
            <lineBasicMaterial color={PORTAL_COLOR} toneMapped={false} transparent opacity={0.4} />
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
        <meshStandardMaterial
          color={PORTAL_COLOR}
          emissive={PORTAL_COLOR}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={0.02}
          toneMapped={false}
        />
      </mesh>

      {/* Folder name label */}
      <Text
        position={[0, tunnelHeight + 0.5 * scale, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.25 * scale}
        color={PORTAL_COLOR}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02 * scale}
        outlineColor="#000000"
      >
        {folder.name}
      </Text>

      {/* File count and size label */}
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
        {childCount} items - {formatBytes(totalSize)}
      </Text>
    </group>
  );
}
