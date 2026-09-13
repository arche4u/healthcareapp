"use client";

/**
 * HealthScene - 3D animated visualization for the OneHealth landing page.
 *
 * Renders a constellation of interconnected spheres (hospitals / health nodes)
 * linked by glowing lines, slowly rotating with gentle interactivity.
 * Built with @react-three/fiber and @react-three/drei.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, Sparkles, Text, Html, Line } from "@react-three/drei";
import { Color } from "three";
import { motion } from "framer-motion";
import * as THREE from "three";

// Extend for any custom shaders
extend({
  // Custom post-processing shaders could go here
});

// Number of hospitals/nodes in the visualization
const NUM_HOSPITALS: number = 12;
const NUM_LINKED_NODES = 4; // secondary patient nodes

/**
 * Single hospital node sphere with a glow effect.
 */
function HospitalNode({
  position,
  color,
  label,
  idx,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  idx: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const { viewport } = useThree();

  // Gentle floating animation
  useFrame((state, delta) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.x = position[0] + Math.sin(t * 0.8 + idx) * 0.05;
      ref.current.position.y = position[1] + Math.cos(t * 0.6 + idx) * 0.05;
    }
  });

  const sphereScale = hovered ? 0.35 : 0.3;

  return (
    <group position={position}>
      {/* Main sphere */}
      <mesh
        ref={ref}
        castShadow
        receiveShadow
        scale={sphereScale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={hovered ? new Color(color).multiplyScalar(0.8) : new Color(color).multiplyScalar(0.4)}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Inner core - smaller white sphere */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 8, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>

      {/* Glow */}
      <mesh scale={hovered ? 0.55 : 0.45}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.4 : 0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Label on hover */}
      {hovered && (
        <Html
          position={[0, 1.8, 0]}
          style={{
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
          }}
        >
          {label}
        </Html>
      )}
    </group>
  );
}

/**
 * Patient node - smaller sphere connected to hospital nodes.
 */
function PatientNode({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const { clock } = useThree();

  useFrame(() => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.rotation.x = t * 0.3;
      ref.current.rotation.z = t * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        roughness={0.3}
        metalness={0.7}
      />
    </mesh>
  );
}

/**
 * Animated line connecting two nodes, pulsing with data flow.
 */
function ConnectionLine({
  start,
  end,
  color,
  pulseSpeed = 1,
}: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  pulseSpeed?: number;
}) {
  const ref = useRef<any>(null!);
  const { clock } = useThree();

  useFrame(() => {
    if (ref.current && ref.current.material) {
      const t = clock.elapsedTime * pulseSpeed;
      // Drei's Line uses LineMaterial from three/examples/jsm/lines/LineMaterial
      // which has a dashOffset property when dashed=true
      ref.current.material.dashOffset = -t * 0.5;
    }
  });

  return (
    <Line
      ref={ref}
      points={[start, end]}
      color={color}
      dashed={true}
      dashSize={0.15}
      gapSize={0.1}
      transparent
      opacity={0.5}
      lineWidth={1}
    />
  );
}

/**
 * Central "OneHealth" branded core at the center of the scene.
 */
function CoreOrb() {
  const ref = useRef<THREE.Group>(null!);
  const { clock } = useThree();

  useFrame(() => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.rotation.y = t * 0.15;
      ref.current.rotation.x = Math.sin(t * 0.3) * 0.03;
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0]}>
      {/* Central sphere */}
      <mesh>
        <sphereGeometry args={[0.8, 64, 64]} />
        <meshStandardMaterial
          color="#0088ff"
          emissive="#0088ff"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Pulse ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.03, 16, 100]} />
        <meshBasicMaterial color="#00c2cb" transparent opacity={0.6} />
      </mesh>

      {/* Outer pulse ring */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[1.6, 0.02, 16, 100]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      {/* Sparkles around core */}
      <Sparkles count={20} scale={3} size={0.02} speed={0.5} opacity={0.6} />

      {/* 3D Text label (behind the sphere, subtle) */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.25}
        color="#00c2cb"
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
      >
        ONEHEALTH
      </Text>
    </group>
  );
}

/**
 * Floating particles in the background.
 */
function BackgroundParticles() {
  const count = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        attach="material"
        size={0.04}
        sizeAttenuation={true}
        color="#0088ff"
        transparent
        opacity={0.4}
      />
    </points>
  );
}

/**
 * Main HealthScene component.
 */
export function HealthScene() {
  const { viewport } = useThree();

  // Generate hospital node positions in a sphere around center
  const hospitalPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const radius = 4.5;
    const goldenRatio = 1.618033988749;

    for (let i = 0; i < NUM_HOSPITALS; i++) {
      // Correct Fibonacci sphere mapping to avoid NaN
      const t = i / (NUM_HOSPITALS - 1);
      const inclination = Math.acos(1 - (2 * t)); // t is between 0 and 1, so 1-2t is between 1 and -1
      const azimuth = 2 * Math.PI * goldenRatio * i;

      const x = radius * Math.sin(inclination) * Math.cos(azimuth);
      const y = radius * Math.sin(inclination) * Math.sin(azimuth);
      const z = radius * Math.cos(inclination);

      positions.push([x, y, z]);
    }

    return positions;
  }, []);

  // Secondary patient nodes inside
  const patientPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const radius = 2.5;

    for (let i = 0; i < NUM_LINKED_NODES; i++) {
      const angle = (i / NUM_LINKED_NODES) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const y = Math.sin(i * 1.5) * 0.3;
      const z = radius * Math.sin(angle);
      positions.push([x, y, z]);
    }

    return positions;
  }, []);

  const hospitalNames = [
    "Hospital A", "Hospital B", "Clinic C", "Center D",
    "Hospital E", "Policlinic F", "Center G", "Hospital H",
    "Clinic I", "Center J", "Hospital K", "Clinic L",
  ];

  const colors = ["#0088ff", "#00c2cb", "#10b981", "#ffffff"];
  const connectionColors = ["#0088ff", "#00c2cb", "#10b981"];

  return (
    <>
      {/* Background particles */}
      <BackgroundParticles />

      {/* Central core */}
      <CoreOrb />

      {/* Hospital nodes */}
      {hospitalPositions.map((pos, idx) => (
        <HospitalNode
          key={`hospital-${idx}`}
          position={pos}
          color={colors[idx % colors.length]}
          label={hospitalNames[idx]}
          idx={idx}
        />
      ))}

      {/* Patient nodes */}
      {patientPositions.map((pos, idx) => (
        <PatientNode
          key={`patient-${idx}`}
          position={pos}
          color={colors[(idx + 1) % colors.length]}
        />
      ))}

      {/* Connection lines from hospitals to core */}
      {hospitalPositions.map((pos, idx) => (
        <ConnectionLine
          key={`conn-hospital-${idx}`}
          start={[0, 0, 0]}
          end={pos}
          color={connectionColors[idx % connectionColors.length]}
          pulseSpeed={0.5 + idx * 0.1}
        />
      ))}

      {/* Connection lines from patients to core */}
      {patientPositions.map((pos, idx) => (
        <ConnectionLine
          key={`conn-patient-${idx}`}
          start={[0, 0, 0]}
          end={pos}
          color={connectionColors[(idx + 2) % connectionColors.length]}
          pulseSpeed={0.8}
        />
      ))}

      {/* Ambient and directional lighting */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight
        position={[5, 10, 7]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight
        position={[-5, -5, -5]}
        intensity={0.4}
        color="#00c2cb"
      />

      {/* Orbit controls for subtle user interaction */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

/**
 * Wrapper that sets up camera and lighting for the scene.
 */
export function HealthSceneWrapper({ className }: { className?: string }) {
  return (
    <motion.div
      className={className || "h-full w-full"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 0.3 }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        onCreated={(state) => {
          state.gl.setClearColor(new Color(0x000000), 0);
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <HealthScene />
      </Canvas>
    </motion.div>
  );
}