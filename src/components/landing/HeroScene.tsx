"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function TicketStub({
  position,
  rotation,
  scale = 1,
  color = "#d4a574",
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.z =
      rotation[2] + Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.08;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.6}>
      <mesh ref={mesh} position={position} rotation={rotation} scale={scale}>
        <boxGeometry args={[1.6, 0.9, 0.05]} />
        <meshStandardMaterial
          color={color}
          roughness={0.35}
          metalness={0.25}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* perforation line */}
      <mesh position={[position[0] - 0.45 * scale, position[1], position[2] + 0.03]}>
        <boxGeometry args={[0.02, 0.85 * scale, 0.01]} />
        <meshStandardMaterial color="#08090c" roughness={1} />
      </mesh>
    </Float>
  );
}

function Orb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = state.clock.elapsedTime * 0.15;
    ref.current.rotation.y = state.clock.elapsedTime * 0.22;
  });

  return (
    <mesh ref={ref} scale={1.8} position={[0.2, 0.1, -0.5]}>
      <icosahedronGeometry args={[1, 8]} />
      <MeshDistortMaterial
        color="#3d9b8f"
        attach="material"
        distort={0.35}
        speed={1.6}
        roughness={0.2}
        metalness={0.4}
        emissive="#1a4a44"
        emissiveIntensity={0.45}
      />
    </mesh>
  );
}

function Particles() {
  const points = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return positions;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#e8c09a"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} color="#fff2e0" />
      <pointLight position={[-3, -1, 2]} intensity={0.8} color="#3d9b8f" />
      <Orb />
      <TicketStub position={[-2.2, 1.1, 0.6]} rotation={[0.3, 0.4, -0.35]} color="#d4a574" scale={0.95} />
      <TicketStub position={[2.1, -0.8, 0.8]} rotation={[-0.2, -0.5, 0.25]} color="#f4f0ea" scale={0.75} />
      <TicketStub position={[1.4, 1.4, -0.2]} rotation={[0.5, -0.2, 0.5]} color="#3d9b8f" scale={0.55} />
      <Particles />
      <Environment preset="city" />
    </>
  );
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
    </div>
  );
}
