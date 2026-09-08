# Portfolio — Asad Shah

A personal site built as a piece of space hardware: a WebGL solar system whose
planets are the stack, a shell you can actually type into, and a nav computer
that jumps you anywhere in the site.

Live case studies for twelve shipped products, each with the problem, the
architecture, the decisions and real code from the repo it came from.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 ·
react-three-fiber / three.js with hand-written GLSL · framer-motion · Lenis ·
Shiki (build-time highlighting)

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build    # production build
npm run lint     # eslint
npx tsc --noEmit # types
```

## Configuration

Copy `.env.example` to `.env.local`. Both variables are optional; the site
runs without either.

| Variable | What it does |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The canonical origin. Open Graph image URLs, `sitemap.xml` and `robots.txt` are absolute and resolve against it — unset, shared links show a broken preview card. |
| `GITHUB_TOKEN` | A classic token with `read:user`. The contribution graph falls back to a public mirror without it, and a public mirror cannot see private repository activity — for an account whose work is mostly private that reports a small fraction of the real figure. Read server-side only; it never reaches the browser. |

## How it is put together

    src/app          routes, the route-transition veil, sitemap and robots
    src/components   sections, the two console dialogs, the loaders
    src/components/space   the WebGL solar system and the page-wide starfield
    src/lib          content, the GitHub client, shared hooks

A few things worth knowing before changing them:

- **`template.tsx`** is the route-transition curtain. A root template is keyed
  by its *first* path segment, so `/work/a → /work/b` does not remount it —
  the veil is keyed on the full pathname instead.
- **The solar system** is `dynamic()` with `ssr: false` and drops to
  `frameloop="never"` once the hero scrolls away, so eleven orbits are not
  drawn behind every other section.
- **`useScrollLock`** is reference counted. Four things freeze the page (the
  preloader, the mobile menu, and both dialogs) and two of them can be open at
  once, so the lock lifts when the last one leaves rather than the first.
- **`ConsolePanel`** is the chassis under both dialogs — hull, brackets,
  header, focus trap, dialog semantics. Change the chrome there, not twice.
- **The preloader runs once per session**, not per load: it is gated on
  `sessionStorage`, which survives a refresh.
