"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* ── deep space ─────────────────────────────────────────────────────────────
   Real objects, drifting behind the page: NASA's own models of the
   International Space Station, the Space Shuttle orbiter, Hubble, the James
   Webb Space Telescope, Voyager and Cassini, and the measured shapes of four
   real asteroids — 216 Kleopatra, 4179 Toutatis, 4486 Mithra and 6489
   Golevka, from radar and spacecraft data. All from NASA's 3D Resources
   (free, without copyright), welded, texture-shrunk and Draco-compressed from
   7.7 MB to 1.45 MB.

   Lit the way space is photographed: one hard white sun from the upper right,
   shadows that fall nearly to black, a faint blue fill standing in for
   earthshine, and a simple studio of light shapes for the metal and foil to
   reflect. The asteroids get a rock shader on top of their real shapes —
   fine surface relief and patchy albedo — so they read as photographed rock,
   not smooth clay.

   Motion is slow on purpose. The field drifts and tumbles at different
   depths; one spacecraft at a time crosses on a long, shallow line, turning
   as it goes, and the next follows once it is on its way out. Scrolling
   moves the camera a little, so depth shows as parallax. */

const MODELS = "/models/space";
const DRACO = "/draco/";

/** Each craft: file, how long its longest side is in world units (so they
 *  sit at believable relative sizes on screen), and how it turns. */
const CRAFT = [
  { file: "iss.glb", size: 7, spin: [0.004, 0.03, 0.006] },
  { file: "hubble.glb", size: 4, spin: [0.02, 0.05, 0.01] },
  { file: "shuttle.glb", size: 5.2, spin: [0.01, 0.035, 0.02] },
  { file: "webb.glb", size: 4.8, spin: [0.006, 0.04, 0.008] },
  { file: "voyager.glb", size: 4.4, spin: [0.015, 0.05, 0.02] },
  { file: "cassini.glb", size: 4.4, spin: [0.02, 0.04, 0.012] },
] as const;

const ROCKS = ["kleopatra.glb", "toutatis.glb", "mithra.glb", "golevka.glb"];

/** Seconds for one craft to cross, and how long until the next sets off. */
const CROSSING = 70;
const HEADWAY = 38;

CRAFT.forEach((c) => useGLTF.preload(`${MODELS}/${c.file}`, DRACO));
ROCKS.forEach((r) => useGLTF.preload(`${MODELS}/${r}`, DRACO));

/* ── asteroid surface ───────────────────────────────────────────────────── */

/* Value-noise fBm in object space, used twice: its screen-space derivatives
   perturb the normal (surface relief that catches the hard light), and its
   value varies the albedo (the patchy darks and lights real regolith has).
   The perturbation is the same technique three's own bump map uses, driven
   by noise instead of a texture, so it holds up at any size. */
const ROCK_NOISE = /* glsl */ `
  varying vec3 vRockPos;
  float rh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float rn(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(rh(i), rh(i + vec3(1,0,0)), f.x), mix(rh(i + vec3(0,1,0)), rh(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(rh(i + vec3(0,0,1)), rh(i + vec3(1,0,1)), f.x), mix(rh(i + vec3(0,1,1)), rh(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  /* Octaves are added only while they are larger than a pixel: the finest
     detail fades out as a rock gets smaller on screen, which is what keeps a
     distant asteroid a quiet grey body instead of a sparkling one. */
  float rock(vec3 p, float px) {
    float s = 0.0, a = 0.5, f = 1.0;
    for (int i = 0; i < 4; i++) {
      float keep = 1.0 - smoothstep(0.25, 0.6, px * f);
      s += a * rn(p * f) * keep + a * 0.5 * (1.0 - keep);
      f *= 2.03; a *= 0.5;
    }
    // one ridged octave: pits and ridges rather than soft rolling hills
    s += 0.16 * (1.0 - abs(rn(p * 0.6) * 2.0 - 1.0));
    return s;
  }
  vec3 rockBump(vec3 pos, vec3 n, float h) {
    vec3 dpx = dFdx(pos); vec3 dpy = dFdy(pos);
    float dhx = dFdx(h); float dhy = dFdy(h);
    vec3 r1 = cross(dpy, n); vec3 r2 = cross(n, dpx);
    float det = dot(dpx, r1);
    vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
    return normalize(abs(det) * n - grad);
  }
`;

function makeRockMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: "#5f5a55", roughness: 1, metalness: 0 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRockPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRockPos = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${ROCK_NOISE}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         // how much object space one pixel covers, in noise cells
         float rockPx = length(fwidth(vRockPos)) * 4.5;
         float rockH = rock(vRockPos * 4.5, rockPx);
         diffuseColor.rgb *= mix(0.6, 1.15, smoothstep(0.3, 0.9, rock(vRockPos * 1.7 + 7.0, rockPx * 0.4)));`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
         normal = rockBump(-vViewPosition, normal, rockH * 0.28);`,
      );
  };
  return m;
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

/** A model normalised to a given longest side, centred on its own middle. */
function useNormalised(file: string, size: number) {
  const { scene } = useGLTF(`${MODELS}/${file}`, DRACO);
  return useMemo(() => {
    const obj = scene.clone(true);
    const box = new THREE.Box3().setFromObject(obj);
    const dims = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    obj.position.sub(centre);
    const holder = new THREE.Group();
    holder.add(obj);
    holder.scale.setScalar(size / Math.max(dims.x, dims.y, dims.z));
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          const std = (mat as THREE.MeshStandardMaterial).clone();
          if ("envMapIntensity" in std) std.envMapIntensity = 0.8;
          // white hulls glare against a black sky; take them down a stop
          std.color?.multiplyScalar(0.72);
          mesh.material = std;
        });
      }
    });
    return holder;
  }, [scene, size]);
}

type RockSpec = {
  file: string;
  pos: [number, number, number];
  size: number;
  drift: [number, number];
  spin: [number, number, number];
  rot: [number, number, number];
};

function Rock({ spec, material }: { spec: RockSpec; material: THREE.Material }) {
  const { scene } = useGLTF(`${MODELS}/${spec.file}`, DRACO);
  const geometry = useMemo(() => {
    let g: THREE.BufferGeometry | null = null;
    scene.traverse((o) => {
      if (!g && (o as THREE.Mesh).isMesh) g = (o as THREE.Mesh).geometry;
    });
    return g as THREE.BufferGeometry | null;
  }, [scene]);
  const ref = useRef<THREE.Mesh>(null);
  const span = 70;

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    // drift, wrapping across a band wider than any screen
    const x = spec.pos[0] + spec.drift[0] * t;
    m.position.x = ((((x + span / 2) % span) + span) % span) - span / 2;
    m.position.y = spec.pos[1] + spec.drift[1] * t;
    m.rotation.set(spec.rot[0] + spec.spin[0] * t, spec.rot[1] + spec.spin[1] * t, spec.rot[2] + spec.spin[2] * t);
  });

  if (!geometry) return null;
  return (
    <mesh ref={ref} geometry={geometry} material={material} position={spec.pos} scale={spec.size} />
  );
}

function Craft({ index, lane }: { index: number; lane: number }) {
  const spec = CRAFT[index % CRAFT.length];
  const model = useNormalised(spec.file, spec.size);
  const ref = useRef<THREE.Group>(null);
  const started = useRef<number | null>(null);
  // each crossing gets its own line: which way, how high, how deep
  const line = useMemo(() => {
    const seed = Math.sin(lane * 12.9898) * 43758.5453;
    const r = (k: number) => {
      const v = Math.sin(seed + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const dir = r(1) < 0.5 ? 1 : -1;
    const z = -26 - r(2) * 14;
    const halfW = Math.abs(z) * Math.tan((35 / 2) * (Math.PI / 180)) * 2.1 + spec.size;
    const y0 = (r(3) - 0.5) * 10;
    return {
      from: new THREE.Vector3(-dir * halfW, y0, z),
      to: new THREE.Vector3(dir * halfW, y0 + (r(4) - 0.5) * 6, z - 4 + r(5) * 8),
      tilt: [r(6) * Math.PI * 2, r(7) * Math.PI * 2, r(8) * Math.PI * 2] as const,
    };
  }, [lane, spec.size]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (started.current === null) started.current = t;
    // the very first craft starts partway across, so the sky is never empty
    const head = lane === 0 ? 0.3 : 0;
    const p = Math.min(1, head + (t - started.current) / CROSSING);
    g.position.lerpVectors(line.from, line.to, p);
    g.rotation.set(line.tilt[0] + spec.spin[0] * t, line.tilt[1] + spec.spin[1] * t, line.tilt[2] + spec.spin[2] * t);
  });

  return (
    <group ref={ref} position={line.from}>
      <primitive object={model} />
    </group>
  );
}

/** Keeps crossings going: a new craft sets off every HEADWAY seconds, and
 *  only the crossings that can still be on screen are kept mounted. */
function Traffic() {
  const [launched, setLaunched] = useState(1);
  const launchedRef = useRef(1);

  useFrame((state) => {
    const due = Math.floor(state.clock.elapsedTime / HEADWAY) + 1;
    if (due !== launchedRef.current) {
      launchedRef.current = due;
      setLaunched(due);
    }
  });

  const onScreen = Math.ceil(CROSSING / HEADWAY) + 1;
  const lanes = Array.from({ length: Math.min(launched, onScreen) }, (_, i) => launched - 1 - i);
  return (
    <>
      {lanes.map((lane) => (
        <Suspense key={lane} fallback={null}>
          <Craft index={lane} lane={lane} />
        </Suspense>
      ))}
    </>
  );
}

function Field() {
  const material = useMemo(() => makeRockMaterial(), []);
  const rocks = useMemo<RockSpec[]>(() => {
    const out: RockSpec[] = [];
    // seeded, so the field is laid out the same on every visit
    const rng = { seed: 7 };
    const r = () => {
      rng.seed = (rng.seed * 16807) % 2147483647;
      return rng.seed / 2147483647;
    };
    for (let i = 0; i < 11; i++) {
      const near = i < 3;
      const z = near ? -14 - r() * 6 : -28 - r() * 40;
      out.push({
        file: ROCKS[i % ROCKS.length],
        pos: [(r() - 0.5) * 60, (r() - 0.5) * 22, z],
        size: near ? 1.6 + r() * 1.4 : 0.6 + r() * 2.2,
        drift: [(r() < 0.5 ? -1 : 1) * (0.12 + r() * 0.3), (r() - 0.5) * 0.04],
        spin: [(r() - 0.5) * 0.18, (r() - 0.5) * 0.22, (r() - 0.5) * 0.14],
        rot: [r() * 6.28, r() * 6.28, r() * 6.28],
      });
    }
    return out;
  }, []);
  return (
    <>
      {rocks.map((spec, i) => (
        <Suspense key={i} fallback={null}>
          <Rock spec={spec} material={material} />
        </Suspense>
      ))}
    </>
  );
}

/** Scrolling lifts the camera a little; depth shows as parallax. */
function Rig() {
  useFrame((state) => {
    // bounded and smooth however long the page is: a slow swell, never a jump
    const target = Math.sin(window.scrollY / 1800) * 1.4;
    state.camera.position.y += (target - state.camera.position.y) * 0.06;
  });
  return null;
}

export default function DeepSpaceScene({ running }: { running: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 35, near: 0.1, far: 200 }}
      frameloop={running ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
    >
      {/* the sun: hard, white, from the upper right, where the hero's star is */}
      <directionalLight position={[10, 7, 4]} intensity={3.4} color="#fff5ea" />
      {/* earthshine: just enough to keep the dark sides from pure black */}
      <hemisphereLight args={["#2a4a7c", "#000000", 0.14]} />

      {/* a studio for reflections: the sun as a hot disc, a cool rim behind */}
      <Environment resolution={128} frames={1}>
        <Lightformer form="circle" intensity={12} position={[10, 7, 4]} scale={3} color="#fff5ea" />
        <Lightformer form="rect" intensity={0.6} position={[-8, -2, -6]} scale={[10, 4, 1]} color="#3a6ab0" />
      </Environment>

      <Rig />
      <Field />
      <Traffic />
    </Canvas>
  );
}
