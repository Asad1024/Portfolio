/* ── procedural textures for the intro film ─────────────────────────────────
   Planets, rocks and nebula painted pixel by pixel from 3D noise, so they read
   as worlds rather than gradients: the planets are sampled on the sphere
   itself (no seams, no stretching at the poles) and lit with a soft
   terminator, the rocks are bump-lit from a height field, the nebula is
   domain-warped noise.

   Everything is produced by generators that paint a few rows at a time, so
   the film can pump them between frames without ever dropping one. */

type RGB = [number, number, number];

// ── noise ──────────────────────────────────────────────────────────────────

function hash3(x: number, y: number, z: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 3D value noise in [0, 1]. */
function noise3(x: number, y: number, z: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const zf = fade(z - zi);
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}

export function fbm(x: number, y: number, z: number, seed: number, octaves = 5) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise3(x * f, y * f, z * f, seed + i * 17);
    f *= 2.03;
    amp *= 0.5;
  }
  return sum / (1 - Math.pow(0.5, octaves));
}

/** sharp ridges, for cracks in ice and crater rims */
export function ridged(x: number, y: number, z: number, seed: number, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise3(x * f, y * f, z * f, seed + i * 31) * 2 - 1);
    sum += amp * n * n;
    f *= 2.1;
    amp *= 0.5;
  }
  return sum;
}

function ramp(stops: [number, RGB][], t: number): RGB {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [a, ca] = stops[i - 1];
      const [b, cb] = stops[i];
      const k = (t - a) / (b - a);
      return [lerp(ca[0], cb[0], k), lerp(ca[1], cb[1], k), lerp(ca[2], cb[2], k)];
    }
  }
  return stops[stops.length - 1][1];
}

// ── planets ────────────────────────────────────────────────────────────────

export type PlanetKind = "desert" | "giant" | "ice";

/** Light from the upper left, a little toward the viewer. */
const L = (() => {
  const v = [-0.62, -0.48, 0.62];
  const m = Math.hypot(v[0], v[1], v[2]);
  return v.map((c) => c / m) as [number, number, number];
})();

function surface(kind: PlanetKind, nx: number, ny: number, nz: number): RGB {
  if (kind === "desert") {
    const s = 2.4;
    const base = fbm(nx * s, ny * s, nz * s, 11, 6);
    const crater = ridged(nx * 5, ny * 5, nz * 5, 7, 3);
    const t = base * 0.85 + crater * 0.18;
    const col = ramp(
      [
        [0.0, [58, 24, 16]],
        [0.35, [124, 52, 30]],
        [0.55, [178, 88, 52]],
        [0.72, [206, 132, 86]],
        [1.0, [232, 186, 140]],
      ],
      t,
    );
    // polar frost
    const cap = Math.max(0, Math.abs(ny) - 0.82) * 5;
    return [lerp(col[0], 236, cap), lerp(col[1], 232, cap), lerp(col[2], 226, cap)];
  }
  if (kind === "giant") {
    // Jupiter-like: a handful of broad belts, their edges torn by turbulence
    // and smeared along the direction of spin, warm creams over browns
    const warp = fbm(nx * 2.2, ny * 2.2, nz * 2.2, 21, 5);
    const lat = ny + (warp - 0.5) * 0.2;
    const band = Math.sin(lat * 11) * 0.5 + 0.5;
    const swirl = fbm(nx * 6 + warp * 2.4, ny * 15, nz * 6 + warp * 2.4, 23, 5);
    let col = ramp(
      [
        [0.0, [86, 54, 38]],
        [0.35, [146, 100, 70]],
        [0.55, [200, 164, 126]],
        [0.75, [228, 210, 184]],
        [1.0, [244, 236, 222]],
      ],
      band * 0.45 + swirl * 0.55,
    );
    // the great storm in the southern belt
    const sx = nx - 0.28;
    const sy = ny - 0.3;
    const storm = Math.max(0, 1 - Math.hypot(sx * 3.4, sy * 7));
    if (storm > 0) col = [lerp(col[0], 196, storm * 0.85), lerp(col[1], 104, storm * 0.85), lerp(col[2], 76, storm * 0.85)];
    return col;
  }
  // ice: pale, cracked, with a thin haze
  const base = fbm(nx * 2, ny * 2, nz * 2, 41, 5);
  const crack = ridged(nx * 4, ny * 4, nz * 4, 43, 4);
  const t = base * 0.6 + 0.3;
  const col = ramp(
    [
      [0.0, [96, 150, 178]],
      [0.5, [168, 214, 230]],
      [1.0, [236, 248, 252]],
    ],
    t,
  );
  const c = Math.max(0, crack - 0.55) * 1.6;
  return [lerp(col[0], 70, c), lerp(col[1], 120, c), lerp(col[2], 150, c)];
}

/** Paints a lit planet, a few rows per step. Resolves to the finished canvas. */
export function* paintPlanet(kind: PlanetKind, size: number): Generator<void, HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = size / 2;
  const spin = kind === "giant" ? 0.25 : kind === "desert" ? 1.1 : 2.3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (x + 0.5 - r) / r;
      const py = (y + 0.5 - r) / r;
      const rr = px * px + py * py;
      const i = (y * size + x) * 4;
      if (rr > 1) {
        d[i + 3] = 0;
        continue;
      }
      const pz = Math.sqrt(1 - rr);
      // turn the sampling sphere so each world shows a different face
      const nx = px * Math.cos(spin) + pz * Math.sin(spin);
      const nz = -px * Math.sin(spin) + pz * Math.cos(spin);
      const col = surface(kind, nx, py, nz);
      const lambert = Math.max(0, px * L[0] + py * L[1] + pz * L[2]);
      const light = 0.03 + Math.pow(lambert, 0.85) * 1.05;
      // edge darkening plus a cool limb, the way atmosphere scatters
      const limb = Math.pow(1 - pz, 3);
      const tint: RGB = kind === "desert" ? [255, 150, 110] : kind === "giant" ? [255, 214, 170] : [150, 230, 255];
      d[i] = Math.min(255, col[0] * light + tint[0] * limb * 0.35 * lambert);
      d[i + 1] = Math.min(255, col[1] * light + tint[1] * limb * 0.35 * lambert);
      d[i + 2] = Math.min(255, col[2] * light + tint[2] * limb * 0.35 * lambert);
      // soft anti-aliased edge
      d[i + 3] = Math.min(255, (1 - Math.sqrt(rr)) * r * 255);
    }
    if (y % 12 === 11) yield;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A planetary ring: concentric bands with gaps, seen face on (squash on draw). */
export function* paintRing(size: number): Generator<void, HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x + 0.5 - r, y + 0.5 - r) / r;
      const i = (y * size + x) * 4;
      if (dist < 0.56 || dist > 1) continue;
      const t = (dist - 0.56) / 0.44;
      const bands = fbm(t * 26, 0.5, 0.5, 61, 3);
      const gap = t > 0.62 && t < 0.67 ? 0.1 : 1;
      const a = Math.pow(bands, 1.4) * gap * Math.sin(t * Math.PI) * 0.9;
      d[i] = 214;
      d[i + 1] = 200;
      d[i + 2] = 232;
      d[i + 3] = a * 255;
    }
    if (y % 24 === 23) yield;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** An irregular rock, bump-lit from its own height field, cratered, with a cool
 *  rim of backlight on its dark side. */
export function* paintRock(size: number, seed: number): Generator<void, HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = size / 2;
  // potato, not pebble: each rock stretched and turned its own way
  const stretch = 0.6 + hash3(seed, 1, 2, 9) * 0.35;
  const turn = hash3(seed, 3, 4, 9) * Math.PI;
  const ct = Math.cos(turn);
  const st = Math.sin(turn);
  const height = (u: number, v: number) =>
    fbm(u * 2.6, v * 2.6, seed, seed, 5) * 0.8 -
    // craters: pits where the ridged field peaks
    Math.max(0, ridged(u * 4.5, v * 4.5, seed * 0.7, seed + 3, 2) - 0.55) * 0.9;
  // the outline, sampled once per angle rather than per pixel
  const ANG = 256;
  const outline = Array.from({ length: ANG }, (_, k) => {
    const a = (k / ANG) * Math.PI * 2;
    return 0.6 + fbm(Math.cos(a) * 1.3 + 5, Math.sin(a) * 1.3 + 5, seed, seed + 9, 4) * 0.42;
  });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ux = (x + 0.5 - r) / r;
      const vy = (y + 0.5 - r) / r;
      // into the rock's own frame: unturned, unstretched
      const u = ux * ct + vy * st;
      const v = (-ux * st + vy * ct) / stretch;
      const ang = Math.atan2(v, u);
      const edge = outline[(((ang / (Math.PI * 2)) * ANG) | 0 + ANG) % ANG];
      const dist = Math.hypot(u, v);
      const i = (y * size + x) * 4;
      if (dist > edge) continue;
      const h = height(u, v);
      const e = 0.018;
      const gx = (height(u - e, v) - height(u + e, v)) * 11;
      const gy = (height(u, v - e) - height(u, v + e)) * 11;
      // treat the body as a lumpy ellipsoid so it shades as a solid
      const bz = Math.sqrt(Math.max(0, 1 - (dist / edge) ** 2));
      // back into screen space so the light comes from the same place for all
      const sx = (gx + u) * ct - (gy + v * stretch) * st;
      const sy = (gx + u) * st + (gy + v * stretch) * ct;
      const n = [sx * 0.9, sy * 0.9, bz + 0.2];
      const m = Math.hypot(n[0], n[1], n[2]);
      const ndl = (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / m;
      const lambert = Math.max(0, ndl);
      // cool light wrapping the dark edge, from the nebula behind
      const rim = Math.pow(1 - bz, 2.2) * Math.max(0, -ndl) * 0.9;
      // pits hold shadow
      const ao = 0.55 + Math.min(0.45, Math.max(0, h) * 0.6);
      const albedo = 0.75 + fbm(u * 9, v * 9, seed + 1, seed + 21, 3) * 0.5;
      const light = (0.03 + lambert * 1.15) * ao * albedo;
      d[i] = Math.min(255, 104 * light + 90 * rim);
      d[i + 1] = Math.min(255, 92 * light + 170 * rim);
      d[i + 2] = Math.min(255, 82 * light + 210 * rim);
      d[i + 3] = Math.min(255, (edge - dist) * r * 255);
    }
    if (y % 16 === 15) yield;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A small, far spiral galaxy for the background of the voyage. */
export function* paintGalaxy(size: number): Generator<void, HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x - r) / r;
      const v = (y - r) / r; // face-on; the film tilts it as it draws, so it can turn
      const dist = Math.hypot(u, v);
      const i = (y * size + x) * 4;
      if (dist > 1) continue;
      const ang = Math.atan2(v, u);
      // two arms winding out from the core
      const arm = Math.pow(Math.max(0, Math.cos(2 * (ang - Math.log(dist + 0.05) * 2.4))), 3);
      const dust = fbm(u * 6, v * 6, 0.3, 77, 4);
      const core = Math.exp(-dist * 9);
      const glow = (arm * 0.55 * (1 - dist) + core * 1.4) * (0.6 + dust * 0.6);
      d[i] = Math.min(255, 180 + core * 75);
      d[i + 1] = Math.min(255, 200 + core * 40);
      d[i + 2] = 255;
      d[i + 3] = Math.min(255, glow * 255 * Math.pow(1 - dist, 0.6));
    }
    if (y % 20 === 19) yield;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A tile of fine grain, laid over the film like stock. */
export function grainTile(size = 192) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const g = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = g;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A nebula cloud: domain-warped noise in two colours, transparent at the edge. */
export function* paintNebula(size: number, a: RGB, b: RGB, seed: number): Generator<void, HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x - r) / r;
      const v = (y - r) / r;
      const fall = Math.max(0, 1 - Math.hypot(u, v));
      const i = (y * size + x) * 4;
      if (fall <= 0) continue;
      const wx = fbm(u * 1.6, v * 1.6, 0.3, seed, 4);
      const wy = fbm(u * 1.6 + 4, v * 1.6 + 4, 0.7, seed + 5, 4);
      const n = fbm(u * 2.2 + wx * 1.8, v * 2.2 + wy * 1.8, 0.5, seed + 9, 5);
      const k = Math.max(0, n - 0.38) * 1.9;
      const mixK = fbm(u * 1.2, v * 1.2, 2.1, seed + 13, 3);
      d[i] = lerp(a[0], b[0], mixK);
      d[i + 1] = lerp(a[1], b[1], mixK);
      d[i + 2] = lerp(a[2], b[2], mixK);
      d[i + 3] = Math.min(255, k * fall * fall * 255);
    }
    if (y % 10 === 9) yield;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
