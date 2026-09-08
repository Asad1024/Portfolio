"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { featuredStack } from "@/lib/data";
import { techColor, techGlyph } from "../tech-icon";

/* ── the hero solar system ──────────────────────────────────────────────────
   Fourteen technologies across eleven orbit lines, each tinted its own
   brand colour and carrying its own inclination and rate. Every one travels
   the same way round — counterclockwise from above the plane, as every planet
   in the real solar system does; only the speed varies. Kepler sets the
   baseline (angular speed falling off as 1/√r) and each body is then knocked
   off it, so the field never turns as one rigid disc. It all runs off a single
   clock in useFrame; there is no per-body state, so the whole stack costs one
   render.

   This file is only ever reached through a dynamic() import with ssr:false;
   WebGL has no meaning on the server and drei's Stars will throw there. */

/** How many orbit lines are drawn. Fewer lines than technologies, so the
 *  busiest rings carry two — which buys back the radial room that fourteen
 *  separate rings had eaten. */
const ORBIT_LINES = 11;
/** Innermost orbit, and the gap to the next one out. */
const MIN_RADIUS = 2.8;
const RADIUS_STEP = 0.64;

/** Deterministic 0..1 from a string. Same value every load, so nothing
 *  reshuffles between renders or between server and client — "random" here
 *  means scattered, not actually unpredictable. */
function hash01(s: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

type Body = {
  tech: string;
  color: string;
  size: number;
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
};

/* Eleven orbit lines carrying fourteen technologies, so three rings hold two.

   Sharing a ring is only safe if it is done deliberately. A shared ring means
   a shared speed, so two bodies on one hold whatever gap they start with
   forever — which is what made an earlier version collide permanently, when
   the phases happened to put a pair 19 degrees apart. Placed exactly opposite
   each other they stay exactly opposite, which is stable and looks intended.

   Tilt and rate therefore belong to the ring, not the body: bodies on one line
   have to actually travel that line.

   Inclination does the separating between neighbouring rings — orbits tilted
   differently pull apart vertically even where their radii are close, which is
   what stops the field reading as one flat disc. Everything is hashed, so the
   arrangement looks arbitrary but is identical on every load and on both sides
   of hydration. */
function buildBodies(): Body[] {
  // shuffle first so ring assignment doesn't track the order in data.ts
  const order = [...featuredStack].sort((a, b) => hash01(a, 7) - hash01(b, 7));
  const rings: string[][] = Array.from({ length: ORBIT_LINES }, () => []);
  order.forEach((tech, i) => rings[i % ORBIT_LINES].push(tech));

  return rings.flatMap((members, ring) => {
    const radius = MIN_RADIUS + ring * RADIUS_STEP;
    const key = `ring-${ring}`;
    // Kepler sets the baseline — inner rings genuinely outrun outer ones — and
    // each is then knocked off it so the field doesn't turn as one rigid disc.
    // Rate only: direction is shared, never reversed.
    const rate = 0.6 + hash01(key, 3) * 1.1;

    return members.map((tech, m) => ({
      tech,
      color: techColor(tech),
      size: 0.27 + hash01(tech, 11) * 0.1,
      radius,
      // Negative, so the system turns counterclockwise seen from above the
      // plane — the direction every planet in the real solar system travels.
      // +z projects downward from a camera sitting above, so a positive rate
      // would have run the whole field backwards.
      speed: -(0.42 / Math.sqrt(radius)) * rate,
      // spread this ring's own members evenly around it, and offset each ring
      // so they don't all line up along one spoke
      phase: (m / members.length) * Math.PI * 2 + ring * 2.399,
      tilt: (hash01(key, 23) - 0.5) * 0.98,
    }));
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

/* Both colours sit close to, but mostly within, 1.0. They used to be pushed
   several times over so a bloom pass had something to catch; with the glow
   done in-scene there is nothing to catch it, and everything above 1.0 simply
   clamps — which flattened the whole photosphere to a uniform white disc and
   threw away the fBm detail underneath.

   Keep hot and cool reasonably close: a wide spread turns the noise into
   high-contrast patches and the star starts reading as a planet with
   continents. */
const hotOf = (c: string) =>
  new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.86).multiplyScalar(1.14);
const coolOf = (c: string) =>
  new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.46);

/* The star's outer glow, drawn in-scene rather than by a bloom pass.

   Postprocessing renders through a composer that writes opaque pixels, which
   turns a transparent canvas into a visible rectangle — fine when the canvas
   filled the viewport, obvious the moment it sits in a column beside the type.
   An additive radial sprite gives the same soft falloff, keeps the canvas
   transparent so the page's own nebula shows through, and costs one quad
   instead of a full-screen multi-pass blur. */
function glowTexture(color: string) {
  const c = new THREE.Color(color);
  const rgb = `${(c.r * 255) | 0}, ${(c.g * 255) | 0}, ${(c.b * 255) | 0}`;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.12, `rgba(${rgb},0.8)`);
  g.addColorStop(0.3, `rgba(${rgb},0.34)`);
  g.addColorStop(0.6, `rgba(${rgb},0.07)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Sun({ color }: { color: string }) {
  const core = useRef<THREE.Mesh>(null);
  const glow = useMemo(() => glowTexture(color), [color]);
  useEffect(() => () => glow?.dispose(), [glow]);

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
      {/* Everything the star is made of scales together, so the corona shells
          keep their relationship to the core and the bloom keeps its
          relationship to both. The light stays outside it: its reach is in
          world units and has nothing to do with how big the sphere looks. */}
      <group scale={0.9}>
        {glow && (
          <sprite scale={[14, 14, 1]} raycast={() => null}>
            <spriteMaterial
              map={glow}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        )}

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
      </group>

      <pointLight intensity={220} distance={90} decay={2} color={color} />
    </group>
  );
}

/* ── orbits + planets ───────────────────────────────────────────────────── */

/* The sign of the tilt matters and is easy to get backwards. A ring lies in
   the XY plane, so Rx(-π/2 - tilt) sweeps (cos a, -sin a·sinθ, -sin a·cosθ),
   which is the same closed curve the planet walks in useFrame traced in the
   opposite direction. Rx(-π/2 + tilt) mirrors Z instead, and the planets then
   ride an ellipse that visibly isn't the one drawn for them. */
function OrbitPath({ radius, tilt, color }: { radius: number; tilt: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2 - tilt, 0, 0]}>
      <ringGeometry args={[radius - 0.009, radius + 0.009, 192]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.24}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* Paints a tech's glyph AND its name onto one canvas, so a body is a single
   sprite rather than a sprite plus a DOM label.

   The label used to be a drei <Html>, which writes a CSS transform to a real
   DOM node every frame. Nineteen of those is nineteen style writes per frame
   fighting the compositor, and it was the main source of the stutter. Baked
   into the texture the labels cost nothing to move, and they can no longer
   drift out of sync with the body they name. */
const CANVAS_W = 256;
const CANVAS_H = 168;
const ICON_PX = 96;
/** Icon height as a fraction of the sprite — used to size the sprite so the
 *  glyph itself lands at a predictable world size. */
const ICON_FRACTION = ICON_PX / CANVAS_H;

function useGlyphTexture(tech: string, color: string, labelColor: string) {
  const texture = useMemo(() => {
    const glyph = techGlyph(tech);
    if (!glyph) return null;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // glyph, centred across the top
    ctx.save();
    const scale = ICON_PX / 24;
    ctx.translate((CANVAS_W - ICON_PX) / 2, 6);
    ctx.scale(scale, scale);
    const path = new Path2D(glyph.path);
    if (glyph.stroked) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.9;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke(path);
    } else {
      ctx.fillStyle = color;
      ctx.fill(path);
    }
    ctx.restore();

    // name underneath, shrunk to fit rather than clipped — "OpenAI · Gemini"
    // and "React Native" are both wider than the icon
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = labelColor;
    let size = 26;
    const font = (n: number) => `500 ${n}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.font = font(size);
    while (ctx.measureText(tech).width > CANVAS_W - 16 && size > 12) {
      size -= 1;
      ctx.font = font(size);
    }
    ctx.fillText(tech, CANVAS_W / 2, ICON_PX + 32);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [tech, color, labelColor]);

  // textures hold GPU memory; a theme swap rebuilds them, so release the old
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

function Planet({
  body,
  hovered,
  onHover,
  labelColor,
}: {
  body: Body;
  hovered: boolean;
  onHover: (tech: string | null) => void;
  labelColor: string;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Object3D>(null);
  const texture = useGlyphTexture(body.tech, body.color, labelColor);

  // Sized from the glyph, not the sprite: the sprite is mostly transparent
  // padding and label, so scaling it directly makes the icons far bigger than
  // intended. Solve for the sprite height that lands the icon at iconWorld.
  const iconWorld = body.size * 2.5;
  const spriteH = iconWorld / ICON_FRACTION;
  const spriteW = spriteH * (CANVAS_W / CANVAS_H);

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
      // sprites always face the camera, so there's nothing to spin — only the
      // fallback sphere gets a rotation
      if (!texture) mesh.current.rotation.y = t * 0.6;
      const target = hovered ? 1.25 : 1;
      // eased toward target rather than snapped, so hover feels physical
      mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.14);
    }
  });

  return (
    <group ref={group}>
      {/* Hit proxy: the bodies are small and permanently in motion, so aiming
          at the glyph itself is hard. Opacity 0 rather than visible={false},
          which some raycaster paths skip entirely. */}
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

      {/* The body itself: the technology's own mark, billboarded so it always
          faces the camera. Hover scaling lives on this wrapper so the sprite
          keeps its own intrinsic size. A tech with no glyph at all falls back
          to a lit sphere. */}
      <group ref={mesh}>
        {texture ? (
          <sprite scale={[spriteW, spriteH, 1]} raycast={() => null}>
            <spriteMaterial
              map={texture}
              transparent
              toneMapped={false}
              depthWrite={false}
              opacity={hovered ? 1 : 0.88}
            />
          </sprite>
        ) : (
          <mesh raycast={() => null}>
            <sphereGeometry args={[body.size, 32, 32]} />
            <meshStandardMaterial
              color={body.color}
              roughness={0.62}
              metalness={0.18}
              emissive={body.color}
              emissiveIntensity={hovered ? 0.85 : 0.22}
            />
          </mesh>
        )}
      </group>

      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 2.6, body.size * 2.72, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

    </group>
  );
}

/* ── scene ──────────────────────────────────────────────────────────────── */

function Scene({
  bodies,
  accent,
  labelColor,
  onHover,
  hovered,
}: {
  bodies: Body[];
  accent: string;
  labelColor: string;
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
          labelColor={labelColor}
        />
      ))}

      <Stars radius={110} depth={55} count={1500} factor={3.6} saturation={0} fade speed={0.5} />

    </>
  );
}

/* ── canvas wrapper ─────────────────────────────────────────────────────── */

export default function SolarSystem({ paused = false }: { paused?: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [accent, setAccent] = useState("#22d3ee");
  const [labelColor, setLabelColor] = useState("rgba(232,236,245,0.75)");
  const bodies = useMemo(() => buildBodies(), []);

  // follow the site's theme rather than hard-coding the sun's colour
  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      const v = style.getPropertyValue("--accent").trim();
      if (v) setAccent(v);
      // baked labels can't inherit a CSS colour, so the foreground is sampled
      // and passed into the texture instead
      const fg = style.getPropertyValue("--fg").trim();
      if (fg) setLabelColor(fg);
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
      /* Framed for the hero's right-hand column, which is near square rather
         than letterboxed. Distance sets how much of that column the system
         fills; elevation sets how far the orbital plane opens up instead of
         collapsing toward a line. The two move independently: the length of
         this vector sets how much of the column the system fills, and its
         angle sets how open the ellipses are, at 42.5°.

         The field of view is the third control and the one that fixes the
         lopsidedness: at 48° the near half of the plane was projecting much
         larger than the far half, so every ellipse hung below the star with
         its top edge crushed toward it. Narrowing to 34° flattens that
         near/far difference — the standard long-lens trick — and the camera
         moves out from 27.9 to 40.6 to keep the visible height identical, so
         the system fills the same space while sitting evenly around the
         star. */
      camera={{ position: [0, 27.45, 29.95], fov: 34 }}
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
      <Scene
        bodies={bodies}
        accent={accent}
        labelColor={labelColor}
        hovered={hovered}
        onHover={setHovered}
      />
      {/* Centred on the star. It used to sit high to push the system clear of
          the hero headline; in its own section there's nothing to dodge. */}
      <OrbitControls
        target={[0, 0, 0]}
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
