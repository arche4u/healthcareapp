/**
 * Utility functions for Three.js / @react-three/fiber interactions.
 */
import * as THREE from "three";

/**
 * Create a smooth color transition between two colors.
 */
export function lerpColor(
  start: THREE.Color,
  end: THREE.Color,
  t: number
): THREE.Color {
  return start.clone().lerp(end, t);
}

/**
 * Create a glowing material for nodes.
 */
export function createGlowMaterial(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Create a standard node material with emissive properties.
 */
export function createNodeMaterial(
  color: string,
  emissiveIntensity: number = 0.3
): THREE.MeshStandardMaterial {
  const c = new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: c,
    emissive: c.clone().multiplyScalar(0.4),
    emissiveIntensity,
    roughness: 0.2,
    metalness: 0.8,
  });
}

/**
 * Generate Fibonacci sphere points for evenly distributed 3D positions.
 */
export function fibonacciSphere(
  count: number,
  radius: number = 1
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const inverseGoldenRatio = 1 / goldenRatio;

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = Math.acos(y);
    const phi = (i * 2 * Math.PI * inverseGoldenRatio) % (2 * Math.PI);

    const x = Math.cos(phi) * radiusAtY;
    const z = Math.sin(phi) * radiusAtY;

    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }

  return points;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random float between min and max.
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Convert HSL to RGB color string.
 */
export function hslToRgb(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}