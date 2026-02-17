import { Canvas } from '@react-three/fiber';
import { TronGrid } from './TronGrid';
import { Lighting } from './Lighting';
import { PostProcessing } from './PostProcessing';

interface SceneProps {
  children?: React.ReactNode;
}

export function Scene({ children }: SceneProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 12, 20], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 50, 150]} />
        <Lighting />
        <TronGrid />
        {children}
        <PostProcessing />
      </Canvas>
    </div>
  );
}
