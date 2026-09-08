"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { stackOrbits, type StackBand } from "@/lib/data";
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

/* ── what a radius means ───────────────────────────────────────────────────
   Distance from the star is a layer of the stack, and it reads the same way
   every time: the further out a body sits, the further it is from the code
   being written.

     core        the language and the runtime everything else is written on
     frameworks  what the products are actually built with
     services    what those products talk to

   Anything added later goes in the band its role belongs to — the rule is
   only worth having if it survives the next technology.

   Radii, tilts and rates are render concerns and live here; which technology
   belongs to which band is content and lives in data.ts. */
const BANDS: Record<StackBand["band"], { radius: number; tilt: number; rate: number }> = {
  core: { radius: 3.6, tilt: 0.14, rate: 1.0 },
  frameworks: { radius: 5.3, tilt: -0.29, rate: 0.84 },
  services: { radius: 7.1, tilt: 0.4, rate: 0.72 },
};

/** Clear of the corona's outer shell (1.5 × 1.75 × 0.9 = 2.36) with room to
 *  spare, so nothing ever rides through the star. */
const MIN_RADIUS = 3.2;

/** One size for every body. Nothing else scales it but depth — see Planet. */
const BODY_SIZE = 0.3;

type Body = {
  tech: string;
  color: string;
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
};

/* Every body is placed by (band, index) and its position is solved from the
   ring's own parametric equation in useFrame, so an icon cannot drift off the
   ellipse drawn for it — there is only one definition of where the ring is.

   Angles are handed out evenly around the full circle rather than hashed:
   scattering by hash is what left the bottom-left crowded and the right-hand
   side empty. Each band starts at a different angle so the three do not line
   up along one spoke. */
function buildBodies(): Body[] {
  return stackOrbits.flatMap((band, bandIndex) => {
    const { radius, tilt, rate } = BANDS[band.band];
    if (radius < MIN_RADIUS) throw new Error(`${band.band} orbits inside the star`);

    return band.members.map((tech, i) => ({
      tech,
      color: techColor(tech),
      radius,
      tilt,
      phase: (i / band.members.length) * Math.PI * 2 + bandIndex * 0.7,
      // Kepler sets the baseline — inner bands genuinely outrun outer ones —
      // and each band is knocked off it so the field doesn't turn as one
      // rigid disc. Rate only: direction is shared, never reversed.
      speed: -(0.42 / Math.sqrt(radius)) * rate,
    }));
  });
}

/** Sprite size of the halo, and the value a flare scales up from. */
const HALO_SIZE = 11.5;

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
  /* One continuous falloff to zero alpha, and nothing drawn on top of it.
     Two back-side corona shells used to sit over this, and a sphere's alpha
     necessarily stops at its own silhouette — so each shell ended on a hard
     circle and the star wore two or three concentric rims. A gradient has no
     silhouette to stop at.

     The curve is deliberately front-loaded: bright core, quick shoulder, then
     a long tail that is nearly gone by 55% of the sprite. That is what keeps
     the innermost band clear of the glare rather than swimming in it. */
  g.addColorStop(0.0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.08, `rgba(${rgb},0.85)`);
  g.addColorStop(0.16, `rgba(${rgb},0.42)`);
  g.addColorStop(0.26, `rgba(${rgb},0.17)`);
  g.addColorStop(0.4, `rgba(${rgb},0.06)`);
  g.addColorStop(0.62, `rgba(${rgb},0.015)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** How long a flare takes to fall back to nothing, in seconds. */
const FLARE_DECAY = 1.4;

function Sun({ color }: { color: string }) {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const lamp = useRef<THREE.PointLight>(null);

  /* Kept in a ref, not state: a flare is a value that changes every frame for
     a second and a half, and routing that through React would re-render the
     scene sixty times to say the star is slightly brighter. */
  const flare = useRef(0);
  useEffect(() => {
    const onCommand = () => {
      flare.current = 1;
    };
    window.addEventListener("shell-command", onCommand);
    return () => window.removeEventListener("shell-command", onCommand);
  }, []);
  const glow = useMemo(() => glowTexture(color), [color]);
  useEffect(() => () => glow?.dispose(), [glow]);

  /* The uniform objects are memoised (stable identity, safe to read while
     rendering) but the per-frame clock is written through each material's own
     ref inside useFrame. Driving it the other way — mutating the memo directly
     — is the usual R3F shorthand, but it reads as mutating render state and is
     genuinely harder to reason about; going through the material keeps every
     write outside of render. */
  const surfaceMat = useRef<THREE.ShaderMaterial>(null);

  const surfaceUniforms = useMemo(
    () => ({
      uHot: { value: hotOf(color) },
      uCool: { value: coolOf(color) },
      uTime: { value: 0 },
    }),
    [color],
  );
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (surfaceMat.current) surfaceMat.current.uniforms.uTime.value = t;
    if (core.current) core.current.rotation.y = t * 0.05;

    /* Decays on wall-clock delta rather than frame count, so a flare lasts
       the same second and a half on a 60Hz screen and a 144Hz one. Eased
       cubically: a flare should go off hard and fade slowly, not ramp down
       linearly like a dimmer. */
    if (flare.current > 0) {
      flare.current = Math.max(0, flare.current - delta / FLARE_DECAY);
      const f = flare.current * flare.current * flare.current;
      if (halo.current) halo.current.scale.setScalar(HALO_SIZE * (1 + f * 0.34));
      if (lamp.current) lamp.current.intensity = 220 + f * 460;
      if (core.current) core.current.scale.setScalar(1 + f * 0.06);
    }
  });

  return (
    <group>
      {/* The star is two things and only two: a photosphere that writes
          depth, so bodies genuinely pass behind it, and one gradient halo
          above it. They scale together so the bloom keeps its relationship to
          the sphere. The light stays outside that scaling — its reach is in
          world units and has nothing to do with how big the sphere looks. */}
      <group scale={0.9}>
        {glow && (
          <sprite ref={halo} scale={[HALO_SIZE, HALO_SIZE, 1]} raycast={() => null}>
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
      </group>

      <pointLight ref={lamp} intensity={220} distance={90} decay={2} color={color} />
    </group>
  );
}

type LabelSide = "below" | "above";

const FULL = new THREE.Color("#ffffff");
const RECEDED = new THREE.Color("#5a6b7a");
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/* Labels are baked into each body's texture, so a label can only be on one of
   two sides — and which side is free depends on where every other body has
   drifted to. This runs the check in screen space, which is the only place
   "overlapping" means anything: two bodies far apart in the world can print
   their names on top of each other, which is what put "TypeScript" underneath
   the Next.js icon.

   Four times a second, not every frame. The bodies move slowly enough that a
   250ms cadence is invisible, and a texture swap is not something to do at
   60Hz. Bodies are resolved nearest-first so the one in front keeps the side
   it wants and the one behind moves. */
function LabelPass({
  bodies,
  positions,
  onResolve,
}: {
  bodies: Body[];
  positions: React.RefObject<Map<string, THREE.Vector3>>;
  onResolve: (sides: Record<string, LabelSide>) => void;
}) {
  const next = useRef(0);
  const scratch = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (state.clock.elapsedTime < next.current) return;
    next.current = state.clock.elapsedTime + 0.25;

    const { camera, size } = state;
    const seen: { x: number; y: number; depth: number; tech: string }[] = [];

    for (const b of bodies) {
      const at = positions.current.get(b.tech);
      if (!at) continue;
      const p = scratch.current.copy(at).project(camera);
      seen.push({
        x: ((p.x + 1) / 2) * size.width,
        y: ((1 - p.y) / 2) * size.height,
        depth: p.z,
        tech: b.tech,
      });
    }

    // nearest first: the body in front states its preference, the one behind
    // is the one that has to give way
    seen.sort((a, b) => a.depth - b.depth);

    /* Boxes for both halves of a body, because a label does not only collide
       with other labels — the thing that put the OpenAI mark across the word
       "React" was an icon landing on a label, and a pass that only compares
       labels to labels cannot see that at all. Every body contributes two
       rectangles, and a candidate side is scored against all of them. */
    const LABEL_W = 96;
    const LABEL_H = 15;
    const ICON_W = 34;
    const ICON_H = 34;
    const OFFSET = 30;

    type Box = { x: number; y: number; w: number; h: number };
    const taken: Box[] = [];
    const sides: Record<string, LabelSide> = {};

    const hits = (a: Box) =>
      taken.filter(
        (b) =>
          Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
          Math.abs(a.y - b.y) < (a.h + b.h) / 2,
      ).length;

    for (const s of seen) {
      const icon: Box = { x: s.x, y: s.y, w: ICON_W, h: ICON_H };
      const below: Box = { x: s.x, y: s.y + OFFSET, w: LABEL_W, h: LABEL_H };
      const above: Box = { x: s.x, y: s.y - OFFSET, w: LABEL_W, h: LABEL_H };

      // the icon's own overlaps are unavoidable — it cannot move off its
      // orbit — so only the label's side is decided here, against everything
      // already placed, icons included
      const side: LabelSide = hits(below) <= hits(above) ? "below" : "above";
      sides[s.tech] = side;
      taken.push(icon, side === "below" ? below : above);
    }

    onResolve(sides);
  });

  return null;
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

/* A handful of brand marks are a filled tile with the wordmark knocked out
   of it, which puts a solid coloured square next to fourteen bare glyphs.
   Drawn as their letters instead, in the same brand colour, so every body on
   screen is a mark on transparent background and nothing carries a backdrop
   the others don't. */
const LETTERFORMS: Record<string, string> = { TypeScript: "TS" };

function useGlyphTexture(
  tech: string,
  color: string,
  labelColor: string,
  side: LabelSide,
) {
  const texture = useMemo(() => {
    const letters = LETTERFORMS[tech];
    const glyph = letters ? null : techGlyph(tech);
    if (!glyph && !letters) return null;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // the icon occupies the same box for every technology; only the label
    // moves, and it moves to whichever side is free
    const iconTop = side === "below" ? 6 : CANVAS_H - ICON_PX - 6;

    ctx.save();
    ctx.translate(0, iconTop);
    if (letters) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.font = `700 ${Math.round(ICON_PX * 0.62)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillText(letters, CANVAS_W / 2, ICON_PX / 2);
    } else {
      const scale = ICON_PX / 24;
      ctx.translate((CANVAS_W - ICON_PX) / 2, 0);
      ctx.scale(scale, scale);
      const path = new Path2D(glyph!.path);
      if (glyph!.stroked) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.9;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke(path);
      } else {
        ctx.fillStyle = color;
        ctx.fill(path);
      }
    }
    ctx.restore();

    // name on the free side, shrunk to fit rather than clipped — "React
    // Native" and "Tailwind CSS" are both wider than the icon
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
    /* Haloed before it is filled. Fourteen bodies on eleven rings will pass in
       front of each other — that is the system working — but two bare labels
       crossing turned both into an unreadable tangle, and the widest pair
       ("OpenAI · Gemini" and "React Native") did it most. The sprites blend
       normally and sort back to front, so a halo in the page's own background
       lets the nearer label cover the farther one cleanly instead. */
    ctx.strokeStyle = "rgba(4, 5, 10, 0.92)";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    const labelY = side === "below" ? ICON_PX + 32 : 22;
    ctx.strokeText(tech, CANVAS_W / 2, labelY);
    ctx.fillText(tech, CANVAS_W / 2, labelY);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [tech, color, labelColor, side]);

  // textures hold GPU memory; a theme swap rebuilds them, so release the old
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

function Planet({
  body,
  hovered,
  onHover,
  labelColor,
  side,
  report,
}: {
  body: Body;
  hovered: boolean;
  onHover: (tech: string | null) => void;
  labelColor: string;
  side: LabelSide;
  /** hands this body's world position to the label pass each frame */
  report: (tech: string, at: THREE.Vector3) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Object3D>(null);
  const material = useRef<THREE.SpriteMaterial>(null);
  const texture = useGlyphTexture(body.tech, body.color, labelColor, side);

  // Sized from the glyph, not the sprite: the sprite is mostly transparent
  // padding and label, so scaling it directly makes the icons far bigger than
  // intended. Solve for the sprite height that lands the icon at iconWorld.
  const iconWorld = BODY_SIZE * 2.5;
  const spriteH = iconWorld / ICON_FRACTION;
  const spriteW = spriteH * (CANVAS_W / CANVAS_H);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const a = body.phase + t * body.speed;
    if (!group.current) return;

    /* The one definition of where this body is: the parametric point on its
       own ring, at its own angle. OrbitPath draws the same curve from the
       same radius and tilt, so the two cannot disagree. */
    group.current.position.set(
      Math.cos(a) * body.radius,
      Math.sin(a) * body.radius * Math.sin(body.tilt),
      Math.sin(a) * body.radius * Math.cos(body.tilt),
    );
    report(body.tech, group.current.position);

    /* Depth is the only thing that changes a body's size or brightness. The
       far half of a ring is further from the camera than the star is, so it
       reads as being behind it — dimmer and smaller — and the near half comes
       forward at full strength. The star's own sphere writes depth, so the
       bodies genuinely pass behind it rather than being faded by hand. */
    const distance = group.current.position.distanceTo(state.camera.position);
    const centre = state.camera.position.length();
    const depth = clamp01((centre + body.radius - distance) / (2 * body.radius));

    if (material.current) {
      material.current.opacity = hovered ? 1 : 0.5 + depth * 0.42;
      // multiplying toward a cool grey rather than tinting: what recedes
      // should lose presence, not gain a colour
      material.current.color.lerpColors(RECEDED, FULL, 0.35 + depth * 0.65);
    }

    if (mesh.current) {
      if (!texture) mesh.current.rotation.y = t * 0.6;
      const target = (0.84 + depth * 0.32) * (hovered ? 1.25 : 1);
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
        <sphereGeometry args={[BODY_SIZE * 2.8, 12, 12]} />
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
              ref={material}
              map={texture}
              transparent
              toneMapped={false}
              depthWrite={false}
            />
          </sprite>
        ) : (
          <mesh raycast={() => null}>
            <sphereGeometry args={[BODY_SIZE, 32, 32]} />
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
          <ringGeometry args={[BODY_SIZE * 2.6, BODY_SIZE * 2.72, 64]} />
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
  /* Written every frame by the bodies, read four times a second by the label
     pass. A ref rather than state: this is a channel between two things
     inside the canvas, and routing it through React would re-render the
     whole scene sixty times a second to say nothing new. */
  const positions = useRef(new Map<string, THREE.Vector3>());
  const report = useCallback((tech: string, at: THREE.Vector3) => {
    const held = positions.current.get(tech);
    if (held) held.copy(at);
    else positions.current.set(tech, at.clone());
  }, []);

  const [sides, setSides] = useState<Record<string, LabelSide>>({});
  const onResolve = useCallback((resolved: Record<string, LabelSide>) => {
    setSides((prev) => {
      const changed = Object.keys(resolved).some((k) => prev[k] !== resolved[k]);
      return changed ? resolved : prev;
    });
  }, []);

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
          side={sides[b.tech] ?? "below"}
          report={report}
        />
      ))}

      <LabelPass bodies={bodies} positions={positions} onResolve={onResolve} />

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
         moves out to keep the visible height identical, so the system fills
         the same space while sitting evenly around the star.

         Distance is 36 for an outermost ring of 7.1: half the visible height
         is 36·tan(17°) = 11.0, and the widest thing on screen is that ring
         plus an icon, about 7.6 — so every ellipse closes inside the canvas
         at any aspect down to 0.69, instead of the outer ones running off the
         edge as they did when the bands reached 9.2. */
      camera={{ position: [0, 24.32, 26.53], fov: 34 }}
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
