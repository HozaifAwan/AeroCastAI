// AI3DVisualization.jsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// Blue glowing orb with layered glow and rim light, slightly smaller
const GlowingNeuron = () => {
  return (
    <group>
      {/* Main orb - blue, slightly smaller */}
      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[1, 5]} />
        <meshPhysicalMaterial
          color="#b9f6ff"
          emissive="#8be9fd"
          emissiveIntensity={3.2}
          roughness={0.08}
          metalness={0.7}
          clearcoat={0.8}
          clearcoatRoughness={0.05}
          reflectivity={0.95}
        />
      </mesh>
      {/* Outer blue glow */}
      <mesh>
        <icosahedronGeometry args={[1.45, 5]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Rim light */}
      <mesh>
        <icosahedronGeometry args={[1.22, 5]} />
        <meshBasicMaterial
          color="#5BC0EB"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

const AI3DVisualization = () => {
  return (
    <div
      className="fixed left-0 right-0 w-screen h-[500px] md:h-[600px] mt-12 mb-12 bg-gradient-to-b from-[#0D1B2A] via-[#1B263B] to-[#415A77] overflow-hidden z-0"
      style={{
        top: 'unset', // Remove if you want it at the top
        marginLeft: 0,
        marginRight: 0,
        width: '100vw',
        position: 'relative', // Use 'fixed' or 'absolute' if needed
      }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} shadows>
        <ambientLight intensity={0.4} />
        <directionalLight intensity={1.2} position={[5, 5, 5]} color="#38bdf8" />
        <Suspense fallback={null}>
          <GlowingNeuron />
          {/* Sparkles with blue and purple tint */}
          <Sparkles count={120} speed={0.7} size={2.5} scale={[6, 6, 6]} color="#5BC0EB" />
          {/* Stars with color and size variation */}
          <Stars
            radius={90}
            depth={60}
            count={6000}
            factor={4}
            saturation={0.7}
            fade
            color="#b6d6f6"
          />
          <Stars
            radius={120}
            depth={80}
            count={800}
            factor={6}
            saturation={1}
            fade
            color="#a5b4fc"
          />
          <EffectComposer>
            <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.8} intensity={1.2} height={400} />
            <Vignette eskil={false} offset={0.18} darkness={0.7} />
          </EffectComposer>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2.2} />
      </Canvas>
    </div>
  );
};

export default AI3DVisualization;
