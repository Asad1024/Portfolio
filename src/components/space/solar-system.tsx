"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { techColor, techGlyph } from "../tech-icon";

/* ── the hero solar system ──────────────────────────────────────────────────
   Every technology in the stack is a planet on its own orbit, tinted its own
   brand colour, with its own inclination and its own rate — a few of them
   retrograde. Kepler sets the baseline (angular speed falling off as 1/√r) but
   each body is deliberately knocked off it, so the field never turns as one
   rigid disc. It all runs off a single clock in useFrame; there is no
   per-planet state, so the whole stack costs one render.

   This file is only ever reached through a dynamic() import with ssr:false;
   WebGL has no meaning on the server and drei's Stars will throw there. */

/* ── the nine ──────────────────────────────────────────────────────────────
   Nine headline skills carried by the nine classical planets, using each
   planet's real orbital elements. Semi-major axis in AU, eccentricity,
   inclination to the ecliptic in degrees, sidereal period in years, and
   equatorial radius in km, and longitude of perihelion in degrees — all
   actual values.

   Two things have to be compressed or the picture is unusable, and both are
   compressed the way every observatory diagram does it:

   • Distance. Real axes run 0.39 AU to 39.5 AU, a hundredfold spread that
     would bury the four inner planets inside the star's glow. Radius is
     placed on a log scale, which preserves the ordering and the sense of a
     crowded inner system against a sparse outer one.
   • Period. Real periods run 88 days to 248 years, a thousandfold spread that
     would leave Pluto motionless. Periods are taken to the fourth root, which
     keeps the real ranking — Mercury fastest, Pluto slowest — inside a range
     you can actually watch.

   Everything else is untouched and does real work: eccentricity puts the star
   at a focus rather than the centre and makes each planet genuinely quicker at
   perihelion, and inclination tilts each orbit to its true angle. */
type Planet = {
  name: string;
  tech: string;
  au: number;
  ecc: number;
  incl: number;
  years: number;
  km: number;
  /** longitude of perihelion — which way this orbit's long axis points */
  peri: number;
  color: string;
  ringed?: boolean;
};

const PLANETS: Planet[] = [
  { name: "Mercury", tech: "PostgreSQL",     au: 0.387, ecc: 0.2056, incl: 7.0,   years: 0.241, km: 2440,  peri: 77.46,  color: "#9a938c" },
  { name: "Venus",   tech: "React Native",   au: 0.723, ecc: 0.0068, incl: 3.39,  years: 0.615, km: 6052,  peri: 131.60, color: "#e8cda2" },
  { name: "Earth",   tech: "TypeScript",     au: 1.0,   ecc: 0.0167, incl: 0.0,   years: 1.0,   km: 6371,  peri: 102.95, color: "#5b8fd4" },
  { name: "Mars",    tech: "Electron",       au: 1.524, ecc: 0.0934, incl: 1.85,  years: 1.881, km: 3390,  peri: 336.06, color: "#c1552e" },
  { name: "Jupiter", tech: "React",          au: 5.203, ecc: 0.0484, incl: 1.30,  years: 11.86, km: 69911, peri: 14.75,  color: "#d9a066" },
  { name: "Saturn",  tech: "Next.js",        au: 9.537, ecc: 0.0539, incl: 2.49,  years: 29.45, km: 58232, peri: 92.43,  color: "#e6d7a8", ringed: true },
  { name: "Uranus",  tech: "Node.js",        au: 19.19, ecc: 0.0473, incl: 0.77,  years: 84.02, km: 25362, peri: 170.96, color: "#a8dfe6" },
  { name: "Neptune", tech: "NestJS",         au: 30.07, ecc: 0.0086, incl: 1.77,  years: 164.8, km: 24622, peri: 44.97,  color: "#4361c9" },
  { name: "Pluto",   tech: "OpenAI · Gemini", au: 39.48, ecc: 0.2488, incl: 17.16, years: 248.0, km: 1188,  peri: 224.07, color: "#cdb9a4" }
];

/** Innermost and outermost drawn semi-major axis. */
const R_INNER = 3.0;
const R_OUTER = 8.4;
/** Seconds for one Earth year, before the fourth-root period compression. */
const YEAR_SECONDS = 19;

type Body = {
  name: string;
  tech: string;
  /** semi-major and semi-minor axes, in scene units */
  a: number;
  b: number;
  /** distance from ellipse centre to the focus the star sits on */
  focus: number;
  ecc: number;
  size: number;
  color: string;
  ringed: boolean;
  /** inclination in radians */
  tilt: number;
  /** longitude of perihelion in radians — the orbit's orientation */
  peri: number;
  /** seconds per revolution, and the mean anomaly at t=0 */
  period: number;
  phase: number;
};

function buildBodies(): Body[] {
  const logs = PLANETS.map((p) => Math.log10(p.au));
  const lo = Math.min(...logs);
  const hi = Math.max(...logs);
  const biggest = Math.max(...PLANETS.map((p) => p.km));

  return PLANETS.map((p, i) => {
    const a = R_INNER + ((Math.log10(p.au) - lo) / (hi - lo)) * (R_OUTER - R_INNER);
    return {
      name: p.name,
      tech: p.tech,
      a,
      b: a * Math.sqrt(1 - p.ecc * p.ecc),
      focus: a * p.ecc,
      ecc: p.ecc,
      // radii span Jupiter to Pluto 59:1, so these are compressed too — the
      // ranking survives, Jupiter still obviously dominates
      size: 0.17 + 0.5 * Math.pow(p.km / biggest, 0.42),
      color: p.color,
      ringed: Boolean(p.ringed),
      tilt: (p.incl * Math.PI) / 180,
      peri: (p.peri * Math.PI) / 180,
      period: Math.pow(p.years, 0.25) * YEAR_SECONDS,
      // spread the starting positions so the nine don't line up on one spoke
      phase: (i / PLANETS.length) * Math.PI * 2,
    };
  });
}

/** Kepler's equation, M = E - e·sin E, solved for the eccentric anomaly.
 *  Newton converges in a couple of steps at planetary eccentricities; this is
 *  what makes a body genuinely faster at perihelion than at aphelion rather
 *  than sweeping the ellipse at a constant angular rate. */
function eccentricAnomaly(meanAnomaly: number, ecc: number) {
  let E = meanAnomaly;
  for (let i = 0; i < 4; i++) {
    E -= (E - ecc * Math.sin(E) - meanAnomaly) / (1 - ecc * Math.cos(E));
  }
  return E;
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
/* A real orbital path: an ellipse with the star at one focus, not a circle
   centred on it. That offset is the whole reason a planet is nearer and
   quicker at one end of its year than the other, so drawing circles would
   contradict the motion. */
function OrbitPath({ body, color, lit }: { body: Body; color: string; lit: boolean }) {
  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(-body.focus, 0, body.a, body.b, 0, Math.PI * 2, false, 0);
    const pts = curve.getPoints(180).map((pt) => new THREE.Vector3(pt.x, 0, pt.y));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [body.a, body.b, body.focus]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group rotation={[0, body.peri, 0]}>
      <lineLoop geometry={geometry} rotation={[body.tilt, 0, 0]} raycast={() => null}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={lit ? 0.45 : 0.16}
          depthWrite={false}
        />
      </lineLoop>
    </group>
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
  // the sphere wears the planet's real colour, but the mark under it keeps
  // the technology's own brand colour
  const texture = useGlyphTexture(body.tech, techColor(body.tech), labelColor);

  // Sized from the glyph, not the sprite: the sprite is mostly transparent
  // padding and label, so scaling it directly makes the mark far bigger than
  // intended. Solve for the sprite height that lands the glyph at iconWorld.
  // Fixed, not derived from the planet — Jupiter is four times Pluto, and
  // labels that scaled with that would be unreadable at the small end.
  const iconWorld = 0.62;
  const spriteH = iconWorld / ICON_FRACTION;
  const spriteW = spriteH * (CANVAS_W / CANVAS_H);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (group.current) {
      // mean anomaly advances at a constant rate; the true position does not
      const M = body.phase + (t / body.period) * Math.PI * 2;
      const E = eccentricAnomaly(M, body.ecc);
      // in the orbital plane, with the star at the focus
      const x = body.a * Math.cos(E) - body.focus;
      const z = body.b * Math.sin(E);
      // tip the plane to the orbit's real inclination
      group.current.position.set(x, -z * Math.sin(body.tilt), z * Math.cos(body.tilt));
    }

    if (mesh.current) {
      mesh.current.rotation.y = t * 0.35;
      const target = hovered ? 1.3 : 1;
      // eased toward target rather than snapped, so hover feels physical
      mesh.current.scale.lerp(new THREE.Vector3(target, target, target), 0.14);
    }
  });

  return (
    <group rotation={[0, body.peri, 0]}>
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

      {/* The planet itself: a lit sphere in the body's real colour, sized off
          its real equatorial radius. Only the star emits, so each one carries
          a day side and a night side and the phase changes as it comes round —
          which is most of what makes the system read as physical. */}
      <group ref={mesh}>
        <mesh raycast={() => null}>
          <sphereGeometry args={[body.size, 32, 32]} />
          <meshStandardMaterial
            color={body.color}
            roughness={0.85}
            metalness={0.05}
            emissive={body.color}
            emissiveIntensity={hovered ? 0.35 : 0.12}
          />
        </mesh>

        {body.ringed && (
          <mesh rotation={[-Math.PI / 2 + 0.42, 0, 0.22]} raycast={() => null}>
            <ringGeometry args={[body.size * 1.45, body.size * 2.25, 72]} />
            <meshBasicMaterial
              color={body.color}
              transparent
              opacity={0.55}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* the skill it carries, billboarded under the planet */}
      {texture && (
        <sprite
          position={[0, -body.size - spriteH * 0.42, 0]}
          scale={[spriteW, spriteH, 1]}
          raycast={() => null}
        >
          <spriteMaterial
            map={texture}
            transparent
            toneMapped={false}
            depthWrite={false}
            opacity={hovered ? 1 : 0.85}
          />
        </sprite>
      )}

      {hovered && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 2.6, body.size * 2.72, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.75} side={THREE.DoubleSide} />
        </mesh>
      )}

     </group>
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
  return (
    <>
      <ambientLight intensity={0.2} />
      <Sun color={accent} />

      {/* one path per planet, its own ellipse — the hovered one lights up */}
      {bodies.map((b) => (
        <OrbitPath key={b.name} body={b} color={accent} lit={hovered === b.tech} />
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
         collapsing toward a line. */
      camera={{ position: [0, 15, 21], fov: 48 }}
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
