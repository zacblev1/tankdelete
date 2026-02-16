export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#4488ff" />
    </>
  );
}
