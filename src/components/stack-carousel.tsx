"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { featuredStack } from "@/lib/data";
import { TechIcon } from "./tech-icon";

/* A 3D ring of the surfaces I build on, using CSS transforms — no Three.js, so
   it costs nothing in bundle size and composites on the GPU.

   Rotation is written straight to the DOM in the animation loop rather than
   through React state, and the initial inline transforms already position every
   card correctly if that loop never runs. */
const AUTO_SPEED = 0.19; // degrees per frame — a full turn in roughly 32s
const DRAG_SENSITIVITY = 0.3;
const FRICTION = 0.94;

export function StackCarousel() {
  const ringRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  const [radius, setRadius] = useState(806);
  const [cardW, setCardW] = useState(265);
  const [front, setFront] = useState(0);
  const [hint, setHint] = useState(true);
  const [showJson, setShowJson] = useState(false);

  const count = featuredStack.length;
  const step = 360 / count;

  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth;
      const width = w < 640 ? 170 : w < 1024 ? 215 : 265;
      setCardW(width);
      // exact circumscribed radius — adjacent faces meet edge to edge
      setRadius(width / 2 / Math.tan(Math.PI / featuredStack.length));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastFront = -1;

    const tick = () => {
      if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > 0.02) {
          angleRef.current += velocityRef.current;
          velocityRef.current *= FRICTION;
        } else if (!reduced) {
          angleRef.current += AUTO_SPEED;
        }
      }
      const ring = ringRef.current;
      if (ring) ring.style.transform = `translateZ(-${radius}px) rotateY(${angleRef.current}deg)`;

      const idx = ((Math.round(-angleRef.current / step) % count) + count) % count;
      if (idx !== lastFront) {
        lastFront = idx;
        setFront(idx);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [radius, step, count]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX;
    velocityRef.current = 0;
    setHint(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    angleRef.current += dx * DRAG_SENSITIVITY;
    velocityRef.current = dx * DRAG_SENSITIVITY;
  }, []);

  const endDrag = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <section
      aria-label="Core stack"
      className="relative select-none overflow-hidden py-16"
      onPointerLeave={endDrag}
    >
      <div
        className="relative mx-auto h-[220px] cursor-grab active:cursor-grabbing"
        style={{ perspective: "1300px" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* centring lives on the wrapper so the ring's transform stays free for
            rotation — a fixed negative margin mis-centres at breakpoints */}
        <div
          className="absolute left-1/2 top-0 h-full"
          style={{ width: cardW, transform: "translateX(-50%)", transformStyle: "preserve-3d" }}
        >
          <div
            ref={ringRef}
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateZ(-${radius}px)`,
            }}
          >
            {featuredStack.map((tech, i) => (
              <div
                key={tech}
                className="absolute inset-0"
                style={{
                  transform: `rotateY(${i * step}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                }}
              >
                <div
                  className={`flex h-full flex-col items-center justify-center gap-4 rounded-xl border bg-bg px-4 text-center transition-all duration-500 ${
                    i === front
                      ? "border-accent bg-accent/5 shadow-[0_0_40px_-6px_var(--ring)]"
                      : "border-line"
                  }`}
                >
                  <TechIcon name={tech} size={58} />
                  <span className="font-mono text-sm leading-tight text-muted">{tech}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-10 flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 font-mono text-[11px] text-muted">
        <button
          onClick={() => setShowJson((v) => !v)}
          className="transition-colors hover:text-fg"
          aria-expanded={showJson}
        >
          <span className="text-accent">$</span> cat stack.json{" "}
          <span className="text-accent">{showJson ? "▾" : "▸"}</span>
        </button>
        <span className="text-fg">{featuredStack[front]}</span>
        <span className="text-muted/70">core stack · full list below</span>
        <span className={`transition-opacity duration-500 ${hint ? "opacity-100" : "opacity-0"}`}>
          ← drag to spin →
        </span>
      </div>

      {/* the prompt above is real: this is the array the ring is built from */}
      {showJson && (
        <div className="relative mx-auto mt-6 max-w-2xl overflow-hidden rounded-xl border border-line bg-bg px-5 py-4 font-mono text-[11px] leading-relaxed">
          <p className="line-in text-muted">{"{"}</p>
          <p className="line-in text-muted" style={{ animationDelay: "30ms" }}>
            {"  "}&quot;<span className="text-accent">stack</span>&quot;: [
          </p>
          {featuredStack.map((tech, i) => (
            <p
              key={tech}
              className="line-in pl-8 text-fg"
              style={{ animationDelay: `${60 + i * 22}ms` }}
            >
              &quot;{tech}&quot;{i < featuredStack.length - 1 ? "," : ""}
            </p>
          ))}
          <p
            className="line-in text-muted"
            style={{ animationDelay: `${60 + featuredStack.length * 22}ms` }}
          >
            {"  ],"}
          </p>
          <p
            className="line-in text-muted"
            style={{ animationDelay: `${82 + featuredStack.length * 22}ms` }}
          >
            {"  "}&quot;<span className="text-accent">count</span>&quot;:{" "}
            <span className="text-fg">{featuredStack.length}</span>
          </p>
          <p
            className="line-in text-muted"
            style={{ animationDelay: `${104 + featuredStack.length * 22}ms` }}
          >
            {"}"}
          </p>
        </div>
      )}
    </section>
  );
}
