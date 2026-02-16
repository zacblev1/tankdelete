import { useMemo } from 'react';
import InfiniteGridHelper from '@plackyfantacky/three.infinitegridhelper';
import * as THREE from 'three';

export function Grid() {
  const grid = useMemo(() => {
    return new (InfiniteGridHelper as any)(
      1,                              // Size 1: minor grid lines every 1 unit
      10,                             // Size 2: major grid lines every 10 units
      new THREE.Color('#00ffff'),     // Cyan grid color
      150,                            // Distance to fade
      'xzy'                           // Axes (y-up scene)
    );
  }, []);

  return <primitive object={grid} />;
}
