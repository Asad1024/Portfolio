"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { LAND_DOTS } from "@/lib/land-dots";

/* ── Where the work happens, on a globe ─────────────────────────────────────
   A quiet dotted planet with the places the experience section names lit up
   on it: home in Lahore, and arcs that draw themselves out to the teams in
   Dubai and Islamabad, a signal running along each with a fading trail. The
   land twinkles, now and then a spark of activity flashes somewhere on it,
   and a soft band of light drifts up and down; a satellite circles on a thin
   orbit with a fading trail. It eases back and forth over the region on its
   own and can be dragged.

   Points rather than a textured earth: the continents are a few thousand
   precomputed land samples (lib/land-dots), which read as a data globe at
   any size and cost one draw call, with a faint field over the oceans. A
   dark core sphere hides the far hemisphere's dots, and a thin shell of air
   gives it a cyan limb. */

const R = 2;
const ACCENT = "#22d3ee";

/** side: which way the label hangs off its marker, so close cities don't collide */
type Place = { name: string; note: string; lat: number; lon: number; home?: boolean; side: "left" | "right" };

const PLACES: Place[] = [
  { name: "Lahore", note: "home base", lat: 31.52, lon: 74.36, home: true, side: "right" },
  { name: "Dubai", note: "Spark AI", lat: 25.2, lon: 55.27, side: "left" },
  { name: "Islamabad", note: "GherTak", lat: 33.68, lon: 73.05, side: "left" },
];

/** lat/lon in degrees to a point on the sphere; longitude 0 faces +z */
function toVec(lat: number, lon: number, r = R) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const PASS_UV = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const DOT_VS = `
          uniform float uTime;
          uniform float uScale;
          uniform vec3 uHome;
          attribute float aRand;
          varying float vGlow;
          varying float vNear;
          varying float vFacing;
          varying float vTwinkle;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 n = normalize(normalMatrix * position);
            vFacing = dot(n, normalize(-mv.xyz));
            vec3 dir = normalize(position);
            float dHome = distance(dir, uHome);
            vNear = smoothstep(0.6, 0.0, dHome);
            vTwinkle = 0.75 + 0.25 * sin(uTime * 1.2 + aRand * 60.0);
            // now and then a dot flashes, like activity somewhere on the map
            float spark = smoothstep(0.972, 1.0, fract(uTime * 0.11 + aRand * 13.0));
            // a soft band of light drifting slowly up and down the planet
            float scan = smoothstep(0.06, 0.0, abs(dir.y - sin(uTime * 0.3) * 0.8));
            vGlow = vNear * 0.5 + spark * 1.3 + scan * 0.5;
            gl_PointSize = 0.042 * uScale / -mv.z * (1.0 + vNear * 0.35 + spark * 1.8 + scan * 0.35);
            gl_Position = projectionMatrix * mv;
          }`;

const DOT_FS = `
          uniform vec3 uBase;
          uniform vec3 uHot;
          uniform vec3 uWarm;
          varying float vGlow;
          varying float vNear;
          varying float vFacing;
          varying float vTwinkle;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float a = smoothstep(0.5, 0.05, d);
            vec3 col = mix(uBase, uWarm, vNear * 0.35);
            col = mix(col, uHot, clamp(vGlow, 0.0, 1.0) * 0.8);
            float facing = smoothstep(-0.1, 0.3, vFacing);
            gl_FragColor = vec4(col, a * facing * vTwinkle * (1.0 + vGlow * 0.5));
          }`;

const ARC_FS = `
          uniform float uTime;
          uniform float uReveal;
          uniform float uOffset;
          uniform vec3 uColor;
          varying vec2 vUv;
          float pulse(float head) {
            float d = head - vUv.x;
            return d > 0.0 ? exp(-d * 9.0) : smoothstep(0.015, 0.0, -d);
          }
          void main() {
            if (vUv.x > uReveal) discard;
            float t = fract(uTime * 0.28 + uOffset);
            float p = pulse(t * 1.5 - 0.25) + pulse(fract(t + 0.5) * 1.5 - 0.25) * 0.7;
            float a = 0.24 + p * 1.5;
            gl_FragColor = vec4(mix(uColor, vec3(1.0), clamp(p, 0.0, 1.0) * 0.8), a);
          }`;

/** The continents, drawn by a shader: soft round dots that twinkle, tint
 *  toward home, catch a band of light sweeping round the planet, and flare as
 *  a ripple spreads out from Lahore. Dots fade toward the limb. */
function DotField({ reduced }: { reduced: boolean }) {
  const { gl, size } = useThree();
  const { land, ocean } = useMemo(() => {
    // continents: the precomputed land samples, lifted a hair off the core
    const count = LAND_DOTS.length / 2;
    const lp = new Float32Array(count * 3);
    const rnd = new Float32Array(count);
    for (let i = 0; i < LAND_DOTS.length; i += 2) {
      const v = toVec(LAND_DOTS[i] / 10, LAND_DOTS[i + 1] / 10, R * 1.002);
      lp.set([v.x, v.y, v.z], (i / 2) * 3);
      rnd[i / 2] = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    }
    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    landGeo.setAttribute("aRand", new THREE.BufferAttribute(rnd, 1));

    // oceans: a sparse, faint Fibonacci field so the sphere keeps its shape
    const N = 1400;
    const op = new Float32Array(N * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      op.set([Math.cos(th) * rad * R, y * R, Math.sin(th) * rad * R], i * 3);
    }
    const oceanGeo = new THREE.BufferGeometry();
    oceanGeo.setAttribute("position", new THREE.BufferAttribute(op, 3));
    return { land: landGeo, ocean: oceanGeo };
  }, []);

  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: 300 },
      uHome: { value: toVec(PLACES[0].lat, PLACES[0].lon, 1) },
      uBase: { value: new THREE.Color("#6fd8ee") },
      uHot: { value: new THREE.Color("#ffffff") },
      uWarm: { value: new THREE.Color("#a78bfa") },
    }),
    [],
  );

  useEffect(
    () => () => {
      land.dispose();
      ocean.dispose();
    },
    [land, ocean],
  );

  useFrame((state) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value = reduced ? 2 : state.clock.elapsedTime;
    mat.current.uniforms.uScale.value = (size.height * gl.getPixelRatio()) / 2;
  });

  return (
    <>
      <points geometry={land}>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={DOT_VS}
          fragmentShader={DOT_FS}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={ocean}>
        <pointsMaterial color="#9fdcea" size={0.016} sizeAttenuation transparent opacity={0.14} depthWrite={false} />
      </points>
    </>
  );
}

function Graticule() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const seg = 96;
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let i = 0; i < seg; i++) {
        const a = toVec(lat, (i / seg) * 360, R * 1.001);
        const b = toVec(lat, ((i + 1) / seg) * 360, R * 1.001);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    for (let lon = 0; lon < 360; lon += 30) {
      for (let i = 0; i < seg; i++) {
        const a = toVec(-90 + (i / seg) * 180, lon, R * 1.001);
        const b = toVec(-90 + ((i + 1) / seg) * 180, lon, R * 1.001);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={ACCENT} transparent opacity={0.05} depthWrite={false} />
    </lineSegments>
  );
}

/** Air: a thin bright rim on the limb, and a soft halo just beyond it. */
function Atmosphere() {
  const mats = useMemo(() => {
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`;
    const rimMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(ACCENT) } },
      vertexShader,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float rim = 1.0 - max(dot(vNormal, vView), 0.0);
          gl_FragColor = vec4(uColor, pow(rim, 5.0) * 0.5);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // seen from inside, the far wall of a larger shell: brightest just off
    // the limb and gone by its own edge
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(ACCENT) } },
      vertexShader,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float glow = pow(smoothstep(0.0, 0.55, -dot(vNormal, vView)), 2.6);
          gl_FragColor = vec4(uColor, glow * 0.16);
        }`,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return [rimMat, haloMat] as const;
  }, []);
  const [rimMat, haloMat] = mats;
  useEffect(
    () => () => {
      rimMat.dispose();
      haloMat.dispose();
    },
    [rimMat, haloMat],
  );
  return (
    <>
      <mesh material={rimMat} scale={1.015}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
      <mesh material={haloMat} scale={1.17}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
    </>
  );
}

function Marker({ place, reduced }: { place: Place; reduced: boolean }) {
  const pos = useMemo(() => toVec(place.lat, place.lon, R * 1.005), [place]);
  const ring = useRef<THREE.Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const world = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  // the ring lies flat on the surface, facing out along the normal
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()),
    [pos],
  );

  useFrame((state) => {
    if (ring.current && !reduced) {
      const p = (state.clock.elapsedTime * 0.6 + (place.home ? 0 : 0.5)) % 1;
      ring.current.scale.setScalar(1 + p * 2.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7;
    }
    // labels fade out as their city turns to the far side
    if (ring.current && label.current) {
      ring.current.getWorldPosition(world);
      const facing = world.clone().normalize().dot(camera.position.clone().normalize());
      label.current.style.opacity = String(THREE.MathUtils.clamp((facing - 0.15) * 3, 0, 1));
    }
  });

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[place.home ? 0.045 : 0.034, 16, 16]} />
        <meshBasicMaterial color={place.home ? "#ffffff" : ACCENT} toneMapped={false} />
      </mesh>
      <mesh ref={ring} quaternion={quat}>
        <ringGeometry args={[0.05, 0.065, 40]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html
        position={pos.clone().normalize().multiplyScalar(0.08)}
        center={false}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={label}
          className={`-mt-3 whitespace-nowrap rounded-full border border-line bg-bg/80 px-2.5 py-1 font-sans text-[10px] text-fg/90 backdrop-blur-sm transition-opacity ${
            place.side === "left" ? "-translate-x-[calc(100%+0.5rem)]" : "ml-2"
          } ${place.name === "Islamabad" ? "-mt-8" : ""}`}
        >
          <span className={place.home ? "text-fg" : "text-accent"}>{place.name}</span>
          <span className="text-muted"> · {place.note}</span>
        </div>
      </Html>
    </group>
  );
}

function Arc({ from, to, reduced, offset = 0 }: { from: Place; to: Place; reduced: boolean; offset?: number }) {
  const tube = useMemo(() => {
    const a = toVec(from.lat, from.lon, R * 1.005);
    const b = toVec(to.lat, to.lon, R * 1.005);
    // short hops still get a visible arch; long ones rise further
    const lift = 1.14 + a.distanceTo(b) * 0.4;
    const m = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * lift);
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 96, 0.009, 8, false);
  }, [from, to]);
  // the arc draws itself in, then signals run along it, each with a fading trail
  const mat = useRef<THREE.ShaderMaterial>(null);
  const born = useRef<number | null>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uReveal: { value: 0 }, uOffset: { value: offset }, uColor: { value: new THREE.Color(ACCENT) } }),
    [offset],
  );
  useEffect(() => () => tube.dispose(), [tube]);
  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;
    mat.current.uniforms.uTime.value = reduced ? 0.3 : t;
    mat.current.uniforms.uReveal.value = reduced ? 1 : Math.min(1, (t - born.current - 0.4 - offset) / 1.6);
  });
  return (
    <mesh geometry={tube}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={PASS_UV}
        fragmentShader={ARC_FS}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/** One satellite on a thin tilted orbit, a short fading trail behind it. */
function Satellite({ reduced }: { reduced: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const r = R * 1.32;
  useFrame((state) => {
    if (spin.current && !reduced) spin.current.rotation.y = state.clock.elapsedTime * 0.32;
  });
  return (
    <group rotation={[0.5, 0, 0.32]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.003, 8, 220]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={spin}>
        <mesh position={[r, 0, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[r, 0, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* the trail: the angles it has just come from */}
        {Array.from({ length: 14 }, (_, k) => {
          const a = (k + 1) * 0.045;
          return (
            <mesh key={k} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
              <sphereGeometry args={[0.022 * (1 - k / 16), 8, 8]} />
              <meshBasicMaterial color={ACCENT} transparent opacity={0.55 * (1 - k / 14)} depthWrite={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Planet({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  // turned so South Asia and the Gulf face the camera
  const base = useMemo(() => ({ x: 0.42, y: -THREE.MathUtils.degToRad(68) }), []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.x = base.x;
    group.current.rotation.y = base.y + (reduced ? 0 : Math.sin(t * 0.12) * 0.22);
  });

  const home = PLACES[0];
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color="#04060c" />
      </mesh>
      <DotField reduced={reduced} />
      <Graticule />
      {PLACES.map((p) => (
        <Marker key={p.name} place={p} reduced={reduced} />
      ))}
      {PLACES.slice(1).map((p, i) => (
        <Arc key={p.name} from={home} to={p} reduced={reduced} offset={i * 0.5} />
      ))}
    </group>
  );
}

export default function Globe({ paused = false }: { paused?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 40 }}
      frameloop={paused ? "never" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      fallback={null}
    >
      <Planet reduced={reduced} />
      <Atmosphere />
      <Satellite reduced={reduced} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </Canvas>
  );
}
