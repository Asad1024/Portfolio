/* ── the real sky over Lahore ───────────────────────────────────────────────
   The page's background stars are not scattered at random: they are where the
   actual stars are above Lahore at the moment the page is open, projected as
   if you were lying on your back looking straight up.

   Nothing here needs more than a few lines of spherical trigonometry, and the
   accuracy target is "a star lands on the right pixel", not an observatory —
   precession since J2000, nutation and refraction all move a star by far less
   than a pixel at this scale, so they are left out. */

export const LAHORE = { lat: 31.5204, lon: 74.3587 };

const RAD = Math.PI / 180;

/** Local sidereal time at a longitude, in degrees: which right ascension is
 *  crossing the meridian overhead right now. */
export function localSiderealDeg(date: Date, lonDeg = LAHORE.lon) {
  const daysSinceJ2000 = date.getTime() / 86_400_000 + 2_440_587.5 - 2_451_545.0;
  const gmst = 280.46061837 + 360.98564736629 * daysSinceJ2000;
  return (((gmst + lonDeg) % 360) + 360) % 360;
}

/** Altitude and azimuth (degrees; azimuth from north through east) of a star
 *  for an observer at `latDeg` when the local sidereal time is `lstDeg`. */
export function toHorizontal(raDeg: number, decDeg: number, lstDeg: number, latDeg = LAHORE.lat) {
  const h = (lstDeg - raDeg) * RAD;
  const dec = decDeg * RAD;
  const lat = latDeg * RAD;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(
    -Math.sin(h) * Math.cos(dec),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(h),
  );
  return { alt: alt / RAD, az: ((az / RAD) + 360) % 360 };
}

/** Stereographic projection centred on the zenith, looking up: north at the
 *  top and — because you are underneath the sky, not above a map of it — east
 *  on the LEFT. The zenith lands at (0, 0) and the horizon on a circle of
 *  radius 2. Stereographic keeps constellation shapes true, which is the
 *  whole point: Orion has to look like Orion. */
export function projectZenith(altDeg: number, azDeg: number) {
  const r = 2 * Math.tan(((90 - altDeg) * RAD) / 2);
  const az = azDeg * RAD;
  return { x: -r * Math.sin(az), y: -r * Math.cos(az) };
}

/* A short list of constellations people actually know by name, with the
   centre of each figure. Used for the one line of copy that tells a visitor
   what is overhead — "Orion is up" lands; "Camelopardalis is up" does not. */
const FAMOUS: { name: string; ra: number; dec: number }[] = [
  { name: "Orion", ra: 83.8, dec: 5.9 },
  { name: "the Great Bear", ra: 165, dec: 56 },
  { name: "Cassiopeia", ra: 15, dec: 60.5 },
  { name: "Scorpius", ra: 253, dec: -30 },
  { name: "Cygnus", ra: 310, dec: 42 },
  { name: "Leo", ra: 160, dec: 16 },
  { name: "Gemini", ra: 108, dec: 23 },
  { name: "Taurus", ra: 66, dec: 17 },
  { name: "Lyra", ra: 284, dec: 36.5 },
  { name: "Sagittarius", ra: 285, dec: -28 },
  { name: "Pegasus", ra: 340, dec: 20 },
  { name: "Andromeda", ra: 12, dec: 38 },
  { name: "Aquila", ra: 297, dec: 5 },
  { name: "Boötes", ra: 218, dec: 30 },
  { name: "Canis Major", ra: 104, dec: -22 },
  { name: "Virgo", ra: 200, dec: -3 },
];

/** The best-known constellation standing highest over Lahore right now, or
 *  null if none of them is comfortably clear of the horizon. */
export function highestFamous(date: Date) {
  const lst = localSiderealDeg(date);
  let best: { name: string; alt: number } | null = null;
  for (const c of FAMOUS) {
    const { alt } = toHorizontal(c.ra, c.dec, lst);
    if (alt > 25 && (!best || alt > best.alt)) best = { name: c.name, alt };
  }
  return best?.name ?? null;
}
