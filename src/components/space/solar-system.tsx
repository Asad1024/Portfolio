"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { featuredStack } from "@/lib/data";
import { TechIcon, techColor } from "../tech-icon";

/* ── the hero solar system ──────────────────────────────────────────────────
   Every technology in the stack is a planet, tinted its own brand colour.
   Angular speed falls off as 1/√r so the inner shells genuinely outrun the
   outer ones, and the whole thing runs off a single clock in useFrame — there
   is no per-planet state, so the entire stack costs one render.

   This file is only ever reached through a dynamic() import with ssr:false;
   WebGL has no meaning on the server and drei's Stars will throw there. */

/** How many orbital shells the stack is spread across. */
const ORBITS = 8;

type Body = {
  tech: string;
  color: string;
  size: number;
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  ringed: boolean;
};

/* Deterministic layout — same every load, so the hero never reshuffles.

   The stack is wider than the number of orbits worth drawing, so shells are
   shared: consecutive technologies land on different orbits and wrap, which
   spreads co-orbiting bodies far apart in phase instead of bunching them. */
function buildBodies(): Body[] {
  return featuredStack.map((tech, i) => {
    const shell = i % ORBITS;
    const radius = 3.4 + shell * 1.25;
    return {
      tech,
      color: techColor(tech),
      size: 0.3 + (shell % 3) * 0.045,
      radius,
      // Kepler-flavoured: outer shells visibly lag the inner ones
      speed: 0.42 / Math.sqrt(radius),
      phase: (i * 2.399) % (Math.PI * 2), // golden angle — no clustering
      tilt: ((i % 5) - 2) * 0.045,
      ringed: i === 3 || i === 11,
    };
  });
}

/* ── sun ────────────────────────────────────────────────────────────────── */

const CORONA_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vLocal  = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

/* Photosphere: value-noise fBm sampled in object space and drifting on two
   different time scales, so the granulation churns instead of sliding. Without
   it the core is just a blown-out disc and reads as a moon, not a star. */
const SURFACE_FRAG = /* glsl */ `
  uniform vec3  uHot;
  uniform vec3  uCool;
  uniform float uTime;
  varying vec3  vNormal;
  varying vec3  vView;
  varying vec3  vLocal;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
  }
  float vnoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      s += a * vnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return s;
  }

  void main() {
    vec3 p = normalize(vLocal);
    float n = fbm(p * 3.2 + vec3(0.0, uTime * 0.06, 0.0));
    n = mix(n, fbm(p * 7.5 - vec3(uTime * 0.11, 0.0, uTime * 0.04)), 0.45);

    // limb darkening — the edge of a star is cooler than its centre
    float limb = pow(abs(dot(normalize(vView), normalize(vNormal))), 0.55);

    vec3 col = mix(uCool, uHot, smoothstep(0.22, 0.88, n));
    col *= 0.78 + 0.42 * limb;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Fresnel rim, brightest where the sphere turns away from the camera, with a
   slow breathing pulse. Additive + BackSide so it reads as atmosphere around
   the core rather than a shell in front of it. */
const CORONA_FRAG = /* glsl */ `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uPower;
  varying vec3  vNormal;
  varying vec3  vView;
  void main() {
    vec3  view  = normalize(vView);
    float fres  = 1.0 - abs(dot(view, normalize(vNormal)));
    float pulse = 0.82 + 0.18 * sin(uTime * 1.4);
    gl_FragColor = vec4(uColor, pow(fres, uPower) * pulse);
  }
`;

/* Both colours are pushed past 1.0 on every channel. Bloom keys off luminance,
   so a sphere sitting inside the 0-1 range just reads as a flat teal disc — it
   has to actually blow out to look like a star.

   Keep hot and cool close together: a wide spread turns the fBm into
   high-contrast patches and the star starts reading as a planet with
   continents. Both ends blow out, only the degree differs. */
const hotOf = (c: string) =>
  new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.86).multiplyScalar(3.6);
const coolOf = (c: string) =>
  new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.5).multiplyScalar(2.25);

function Sun({ color }: { color: string }) {
  const core = useRef<THREE.Mesh>(null);

  /* The uniform objects are memoised (stable identity, safe to read while
     rendering) but the per-frame clock is written through each material's own
     ref inside useFrame. Driving it the other way — mutating the memo directly
     — is the usual R3F shorthand, but it reads as mutating render state and is
     genuinely harder to reason about; going through the material keeps every
     write outside of render. */
  const surfaceMat = useRef<THREE.ShaderMaterial>(null);
  const innerMat = useRef<THREE.ShaderMaterial>(null);
  const outerMat = useRef<THREE.ShaderMaterial>(null);

  const surfaceUniforms = useMemo(
    () => ({
      uHot: { value: hotOf(color) },
      uCool: { value: coolOf(color) },
      uTime: { value: 0 },
    }),
    [color],
  );
  const innerUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uPower: { value: 2.6 },
    }),
    [color],
  );
  const outerUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uPower: { value: 4.2 },
    }),
    [color],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (surfaceMat.current) surfaceMat.current.uniforms.uTime.value = t;
    if (innerMat.current) innerMat.current.uniforms.uTime.value = t;
    if (outerMat.current) outerMat.current.uniforms.uTime.value = t;
    if (core.current) core.current.rotation.y = t * 0.05;
  });

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <shaderMaterial
          vertexShader={CORONA_VERT}
          ref={surfaceMat}
          fragmentShader={SURFACE_FRAG}
          uniforms={surfaceUniforms}
          toneMapped={false}
        />
      </mesh>

      {/* two corona shells at different falloffs = a soft, layered edge */}
      <mesh scale={1.28}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <shaderMaterial
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          ref={innerMat}
          uniforms={innerUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.75}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <shaderMaterial
          vertexShader={CORONA_VERT}
          fragmentShader={CORONA_FRAG}
          ref={outerMat}
          uniforms={outerUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <pointLight intensity={220} distance={90} decay={2} color={color} />
    </group>
  );
}

/* ── orbits + planets ───────────────────────────────────────────────────── */

function OrbitPath({ radius, tilt, color }: { radius: number; tilt: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2 + tilt, 0, 0]}>
      <ringGeometry args={[radius - 0.006, radius + 0.006, 160]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.13}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function Planet({
  body,
  hovered,
  onHover,
}: {
  body: Body;
  hovered: boolean;
  onHover: (tech: string | null) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = body.phase + t * body.speed;
    if (group.current) {
      group.current.position.set(
        Math.cos(a) * body.radius,
        Math.sin(a) * body.radius * Math.sin(body.tilt),
        Math.sin(a) * body.radius * Math.cos(body.tilt),
      );
    }
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.6;
      const target = hovered ? 1.45 : 1;
      // eased toward target rather than snapped, so hover feels physical
      mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.14);
    }
  });

  return (
    <group ref={group}>
      {/* Hit proxy. The planets are small and permanently in motion, so aiming
          at the visible sphere is genuinely hard — and since hovering is the
          only way to read what a body is, a missed hover means the label is
          unreachable. This invisible sphere gives the pointer something much
          larger to catch. Opacity 0 rather than visible={false}, which some
          raycaster paths skip entirely. */}
      <mesh
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover(body.tech);
        }}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[body.size * 2.8, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={mesh} raycast={() => null}>
        <sphereGeometry args={[body.size, 32, 32]} />
        <meshStandardMaterial
          color={body.color}
          roughness={0.62}
          metalness={0.18}
          emissive={body.color}
          emissiveIntensity={hovered ? 0.85 : 0.22}
        />
      </mesh>

      {body.ringed && (
        <mesh rotation={[-Math.PI / 2.4, 0.3, 0]}>
          <ringGeometry args={[body.size * 1.5, body.size * 2.3, 64]} />
          <meshBasicMaterial
            color={body.color}
            transparent
            opacity={0.42}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 2.6, body.size * 2.72, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Labels are always on, not hover-only. These are small, fast-moving
          targets and reading the stack is the entire point of the scene — a
          name you can only reach by successfully chasing a planet with the
          cursor is a name nobody reads. Hover just promotes one. */}
      <Html
        center
        distanceFactor={17}
        zIndexRange={[20, 0]}
        position={[0, -body.size - 0.42, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex select-none items-center gap-1.5 whitespace-nowrap font-mono transition-all duration-300 ${
            hovered
              ? "rounded border border-accent/60 bg-black/80 px-2 py-1 text-[12px] text-white"
              : "text-[11px] text-white/55"
          }`}
        >
          <TechIcon name={body.tech} size={hovered ? 13 : 11} />
          {body.tech}
        </div>
      </Html>
    </group>
  );
}

/* ── scene ──────────────────────────────────────────────────────────────── */

function Scene({
  bodies,
  accent,
  onHover,
  hovered,
}: {
  bodies: Body[];
  accent: string;
  onHover: (tech: string | null) => void;
  hovered: string | null;
}) {
  /* Shells are shared between technologies, so rings are drawn from the
     deduplicated set — one per shell — rather than one per body, which would
     stack a dozen coincident rings and blow out their opacity. */
  const shells = useMemo(() => {
    const seen = new Map<number, { radius: number; tilt: number }>();
    for (const b of bodies) if (!seen.has(b.radius)) seen.set(b.radius, { radius: b.radius, tilt: b.tilt });
    return [...seen.values()];
  }, [bodies]);

  return (
    <>
      <ambientLight intensity={0.16} />
      <Sun color={accent} />

      {shells.map((s) => (
        <OrbitPath key={s.radius} radius={s.radius} tilt={s.tilt} color={accent} />
      ))}

      {bodies.map((b) => (
        <Planet
          key={b.tech}
          body={b}
          hovered={hovered === b.tech}
          onHover={onHover}
        />
      ))}

      <Stars radius={110} depth={55} count={2600} factor={4.2} saturation={0} fade speed={0.7} />

      <EffectComposer>
        <Bloom intensity={2.1} luminanceThreshold={0.06} luminanceSmoothing={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.2} darkness={0.9} />
      </EffectComposer>
    </>
  );
}

/* ── canvas wrapper ─────────────────────────────────────────────────────── */

export default function SolarSystem({ paused = false }: { paused?: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [accent, setAccent] = useState("#22d3ee");
  const bodies = useMemo(() => buildBodies(), []);

  // follow the site's theme rather than hard-coding the sun's colour
  useEffect(() => {
    const read = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      if (v) setAccent(v);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 11, 22.5], fov: 48 }}
      /* Stop the render loop entirely once the hero scrolls away. Left on
         "always" the scene keeps drawing twelve orbits behind every other
         section — burning battery and competing with the rest of the page for
         the compositor the whole way down. */
      frameloop={paused ? "never" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // a machine without WebGL still gets a hero, just a flat one
      fallback={
        <div className="flex size-full items-center justify-center font-mono text-xs text-muted">
          WebGL unavailable — solar view offline
        </div>
      }
    >
      <Scene bodies={bodies} accent={accent} hovered={hovered} onHover={setHovered} />
      {/* Target sits above the sun, which drops the whole system into the lower
          half of the frame and leaves the headline clean air. The target stays
          on the sun's own vertical axis so autoRotate still spins around it
          rather than swinging it across the screen. */}
      <OrbitControls
        target={[0, 3.4, 0]}
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced}
        autoRotateSpeed={0.24}
        minPolarAngle={Math.PI * 0.16}
        maxPolarAngle={Math.PI * 0.52}
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
