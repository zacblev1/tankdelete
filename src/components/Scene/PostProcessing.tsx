import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={2.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}
