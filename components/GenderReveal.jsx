"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────────────
   GenderReveal — main client component for the cinematic reveal experience.
   The result (girl / boy) is read from the URL: ?result=boy
   ───────────────────────────────────────────────────────────────────────── */

// Change this to "boy" if you want boy to be the default.
const DEFAULT_RESULT = "girl"; // it's a girl!

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const choose = (arr) => arr[Math.floor(Math.random() * arr.length)];

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO — heartbeat pulses + paw-click chime (synthesized via Web Audio)
// ─────────────────────────────────────────────────────────────────────────────
function useHeartbeat() {
  const ctxRef = useRef(null);
  const ensure = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }, []);

  const play = useCallback(
    (enabled) => {
      if (!enabled) return;
      const ctx = ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + 0.01;
      pulse(ctx, t0, 70, 0.22, 0.45);
      pulse(ctx, t0 + 0.2, 52, 0.28, 0.35);
    },
    [ensure]
  );

  const chime = useCallback(
    (enabled) => {
      if (!enabled) return;
      const ctx = ensure();
      if (!ctx) return;
      const t0 = ctx.currentTime + 0.005;
      chord(ctx, t0, 880, 0.1, 0.22);
      chord(ctx, t0 + 0.06, 1318, 0.14, 0.2);
      chord(ctx, t0 + 0.1, 1760, 0.22, 0.1);
    },
    [ensure]
  );

  return { play, chime, ensure };
}

function chord(ctx, when, freq, duration, gain) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6000;
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq * 0.6, when);
  osc.frequency.exponentialRampToValueAtTime(freq, when + 0.04);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(env).connect(lp).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

function pulse(ctx, when, freq, duration, gain) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 220;
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 2.2, when);
  osc.frequency.exponentialRampToValueAtTime(freq, when + duration * 0.35);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.linearRampToValueAtTime(gain, when + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(env).connect(lp).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASTEL PARTICLES — warm dust motes for the pre-reveal states
// ─────────────────────────────────────────────────────────────────────────────
function PastelParticles({ density = 60, hue = "warm" }) {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d");
    let raf, W = 0, H = 0, DPR = 1;
    const dots = [];
    const palette =
      hue === "warm"
        ? ["#FFE3C9", "#FFC9D7", "#F7D7FF", "#FFF1B8", "#D8E8FF"]
        : ["#BBE3FF", "#9CC7FF", "#E8F0FF"];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * DPR; c.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function seed() {
      dots.length = 0;
      for (let i = 0; i < density; i++) {
        dots.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(2, 7),
          vx: rand(-0.15, 0.15),
          vy: rand(-0.25, -0.05),
          a: rand(0.15, 0.55),
          c: choose(palette),
          ph: Math.random() * Math.PI * 2,
        });
      }
    }
    resize(); seed();

    let t = 0;
    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const d of dots) {
        d.x += d.vx + Math.sin(t + d.ph) * 0.1;
        d.y += d.vy;
        if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
        if (d.x < -10) d.x = W + 10;
        if (d.x > W + 10) d.x = -10;
        const alpha = d.a * (0.6 + 0.4 * Math.sin(t * 2 + d.ph));
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 3);
        g.addColorStop(0, hexA(d.c, alpha));
        g.addColorStop(1, hexA(d.c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    frame();

    const ro = new ResizeObserver(() => { resize(); seed(); });
    ro.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [density, hue]);

  return <canvas ref={cvs} className="layer particles" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// MYSTIC STARS — twinkling stars + drifting motes for the suspend scene
// ─────────────────────────────────────────────────────────────────────────────
function MysticStars() {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d");
    let raf, W, H, DPR;
    let stars = [], motes = [];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * DPR; c.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function seed() {
      stars = []; motes = [];
      const sCount = Math.min(140, Math.round((W * H) / 7500));
      for (let i = 0; i < sCount; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(0.5, 1.8),
          ph: Math.random() * Math.PI * 2,
          sp: rand(0.6, 2.2),
          c: choose(["#FFFFFF", "#FFE9B8", "#F8D3FF", "#BFE0FF"]),
        });
      }
      const mCount = Math.min(28, Math.round((W * H) / 38000));
      for (let i = 0; i < mCount; i++) {
        motes.push({
          x: Math.random() * W, y: Math.random() * H,
          r: rand(8, 22),
          vy: rand(-0.18, -0.04),
          vx: rand(-0.12, 0.12),
          a: rand(0.12, 0.32),
          ph: Math.random() * Math.PI * 2,
          c: choose(["#FFD89A", "#E2B6FF", "#FFB8E2", "#9CC7FF"]),
        });
      }
    }
    resize(); seed();

    let t = 0;
    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (const m of motes) {
        m.x += m.vx + Math.sin(t * 0.6 + m.ph) * 0.18;
        m.y += m.vy;
        if (m.y < -30) { m.y = H + 30; m.x = Math.random() * W; }
        if (m.x < -30) m.x = W + 30;
        if (m.x > W + 30) m.x = -30;
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
        g.addColorStop(0, hexA(m.c, m.a));
        g.addColorStop(1, hexA(m.c, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const s of stars) {
        const twink = 0.4 + 0.6 * Math.abs(Math.sin(t * s.sp + s.ph));
        ctx.fillStyle = hexA(s.c, twink);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.8 + 0.6 * twink), 0, Math.PI * 2);
        ctx.fill();
        if (twink > 0.85) {
          ctx.strokeStyle = hexA(s.c, (twink - 0.85) * 2);
          ctx.lineWidth = 0.6;
          const L = s.r * 6;
          ctx.beginPath();
          ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
          ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    }
    frame();
    const ro = new ResizeObserver(() => { resize(); seed(); });
    ro.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={cvs} className="layer mystic-stars" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFETTI — soft falling petals with depth-of-field blur
// ─────────────────────────────────────────────────────────────────────────────
function Confetti({ result }) {
  const cvs = useRef(null);
  useEffect(() => {
    const c = cvs.current;
    const ctx = c.getContext("2d");
    let raf, W, H, DPR;
    const parts = [];
    const palettes = {
      boy: ["#3FA9F5", "#2A6FDB", "#7AC8FF", "#B4E2FF", "#1F3F8E", "#FFFFFF"],
      girl: ["#FF7AB6", "#F04C8E", "#FFB6D5", "#FFD7E8", "#C12664", "#FFFFFF"],
    };
    const pal = palettes[result];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth; H = c.clientHeight;
      c.width = W * DPR; c.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function seed() {
      parts.length = 0;
      for (let i = 0; i < 220; i++) {
        const z = Math.pow(Math.random(), 1.4);
        parts.push({
          x: Math.random() * W,
          y: -Math.random() * H * 1.2,
          w: rand(6, 14) * (1.3 - z * 0.55),
          h: rand(10, 22) * (1.3 - z * 0.55),
          vy: rand(280, 540),
          vx0: rand(-50, 50),
          swayAmp: rand(40, 110),
          swayFreq: rand(0.6, 1.4),
          rot: rand(0, Math.PI * 2),
          vr: rand(-2.4, 2.4),
          c: choose(pal),
          z,
          ph: Math.random() * Math.PI * 2,
        });
      }
      parts.sort((a, b) => b.z - a.z);
    }
    resize(); seed();

    let last = performance.now();
    let tSec = 0;
    function frame(now) {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      tSec += dt;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y += p.vy * dt;
        p.x += (p.vx0 + p.swayAmp * Math.sin(tSec * p.swayFreq * Math.PI * 2 + p.ph)) * dt;
        p.rot += p.vr * dt;
        if (p.y > H + 40) { p.y = -20; p.x = Math.random() * W; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const blurAmt = p.z * 5.5 + 0.6;
        ctx.shadowColor = p.c;
        ctx.shadowBlur = blurAmt;
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.95 - p.z * 0.35;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.w * 0.55, p.h * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.32 - p.z * 0.18;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(-p.w * 0.18, -p.h * 0.18, p.w * 0.25, p.h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    }
    frame(performance.now());
    const ro = new ResizeObserver(() => { resize(); seed(); });
    ro.observe(c);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [result]);
  return <canvas ref={cvs} className="layer confetti" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING STICKERS — six per scene, drag-arranged via percent coordinates
// ─────────────────────────────────────────────────────────────────────────────
const STICKER_LAYOUTS = {
  trigger: [
    { src: "/stickers/good-morning.png", top: "3%",   left: "2%",  w: 130, rot: -8,  delay: 0.0 },
    { src: "/stickers/heart-wink.png",          top: "6%",   right: "3%", w: 120, rot: 6,   delay: 0.15 },
    { src: "/stickers/hey-you.png",     bottom: "3%",left: "3%",  w: 130, rot: 8,   delay: 0.3 },
    { src: "/stickers/good-night.png",     bottom: "4%",right: "3%", w: 125, rot: -6,  delay: 0.45 },
  ],
  suspend: [
    // { src: "/stickers/good-night.png", top: "4%",  left: "3%",   w: 130, rot: -10, delay: 0.10 },
    // { src: "/stickers/heart-wink.png", top: "6%",  right: "4%",  w: 120, rot: 8,   delay: 0.25 },
    // { src: "/stickers/wow.png",        top: "44%", left: "1%",   w: 110, rot: 14,  delay: 0.40, smHide: true },
    // { src: "/stickers/hey-you.png",    top: "46%", right: "1%",  w: 115, rot: -8,  delay: 0.55, smHide: true },
    // { src: "/stickers/approved.png",   bottom: "4%", left: "4%", w: 130, rot: 6,   delay: 0.70 },
    // { src: "/stickers/nice.png",       bottom: "5%", right: "3%",w: 125, rot: -10, delay: 0.85 },
  ],
  countdown: [
    { src: "/stickers/heart-wink.png", top: "5%",   left: "3%",  w: 120, rot: -10, delay: 0.0 },
    { src: "/stickers/hey-you.png",        top: "5%",   right: "3%", w: 120, rot: 8,   delay: 0.1 },
    { src: "/stickers/too-cute.png",   bottom: "5%",left: "3%",  w: 125, rot: 6,   delay: 0.2 },
    { src: "/stickers/nice.png",       bottom: "5%",right: "3%", w: 120, rot: -8,  delay: 0.3 },
  ],
  reveal: [
    { src: "/stickers/wow.png",   top: "4%",  left: "3%",   w: 135, rot: -12, delay: 0.40 },
    { src: "/stickers/nice.png",         top: "5%",  right: "3%",  w: 130, rot: 10,  delay: 0.55 },
    { src: "/stickers/heart-wink.png",          top: "44%", left: "1%",   w: 115, rot: -16, delay: 0.70, smHide: true },
    { src: "/stickers/good-morning.png", top: "44%", right: "1%",  w: 120, rot: 14,  delay: 0.85, smHide: true },
    { src: "/stickers/too-cute.png",     bottom: "4%", left: "4%", w: 140, rot: 6,   delay: 1.00 },
    { src: "/stickers/approved.png",     bottom: "5%", right: "4%",w: 130, rot: -8,  delay: 1.15 },
  ],
};

function FloatingStickers({ which }) {
  const items = STICKER_LAYOUTS[which] || [];
  return (
    <div className="stickers" aria-hidden="true">
      {items.map((s, i) => (
        <span
          key={s.src + i}
          className="sticker"
          data-sm-hide={s.smHide ? "" : undefined}
          style={{
            top: s.top, left: s.left, right: s.right, bottom: s.bottom,
            width: s.w,
            "--r": `${s.rot}deg`,
            transform: `rotate(${s.rot}deg)`,
            animationDelay: `${s.delay}s, ${s.delay + 0.7}s`,
          }}
        >
          <img src={s.src} alt="" draggable={false} />
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CAT PAW BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function PawButton({ onClick, leaving }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className={"paw-btn" + (pressed ? " is-pressed" : "") + (leaving ? " is-leaving" : "")}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={leaving ? undefined : onClick}
      aria-label="Reveal the gender of the baby"
      disabled={leaving}
    >
      <span className="paw-halo" aria-hidden="true" />
      <span className="paw-halo paw-halo--2" aria-hidden="true" />
      {leaving && (
        <>
          <span className="paw-sparkle paw-sparkle--1" aria-hidden="true">✦</span>
          <span className="paw-sparkle paw-sparkle--2" aria-hidden="true">✧</span>
          <span className="paw-sparkle paw-sparkle--3" aria-hidden="true">✦</span>
          <span className="paw-sparkle paw-sparkle--4" aria-hidden="true">✺</span>
          <span className="paw-sparkle paw-sparkle--5" aria-hidden="true">✧</span>
          <span className="paw-sparkle paw-sparkle--6" aria-hidden="true">✦</span>
        </>
      )}
      <span className="paw-disc" aria-hidden="true">
        <svg viewBox="0 0 220 220" className="paw-svg">
          <defs>
            <radialGradient id="bean" cx="40%" cy="32%" r="80%">
              <stop offset="0%" stopColor="#FFD0BC" />
              <stop offset="55%" stopColor="#F4937D" />
              <stop offset="100%" stopColor="#D86B5A" />
            </radialGradient>
            <radialGradient id="padShine" cx="42%" cy="34%" r="78%">
              <stop offset="0%" stopColor="#FFC9B0" />
              <stop offset="55%" stopColor="#F08C72" />
              <stop offset="100%" stopColor="#C75A4A" />
            </radialGradient>
            <radialGradient id="fur" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#FFFCF4" />
              <stop offset="70%" stopColor="#FBEFD8" />
              <stop offset="100%" stopColor="#EDD9B6" />
            </radialGradient>
          </defs>
          <path
            d="M110 30 C 78 28, 56 42, 44 64 C 28 70, 22 88, 30 104 C 18 116, 22 140, 38 148 C 32 168, 50 190, 74 196 C 84 210, 110 212, 132 204 C 156 210, 184 196, 188 174 C 204 168, 208 142, 196 130 C 204 110, 196 90, 178 86 C 178 64, 158 46, 134 46 C 128 32, 120 28, 110 30 Z"
            fill="url(#fur)" stroke="#5C3621" strokeWidth="3" strokeLinejoin="round"
          />
          <path
            d="M110 188 C 78 188, 58 168, 60 144 C 62 122, 86 110, 110 110 C 134 110, 158 122, 160 144 C 162 168, 142 188, 110 188 Z"
            fill="url(#padShine)" stroke="#7A3225" strokeWidth="2.5" strokeLinejoin="round"
          />
          <ellipse cx="96" cy="148" rx="20" ry="7" fill="#fff" opacity="0.42" />
          <ellipse cx="74"  cy="86" rx="16" ry="20" fill="url(#bean)" stroke="#7A3225" strokeWidth="2.4" transform="rotate(-22 74 86)" />
          <ellipse cx="112" cy="68" rx="16" ry="19" fill="url(#bean)" stroke="#7A3225" strokeWidth="2.4" transform="rotate(-4 112 68)" />
          <ellipse cx="148" cy="86" rx="14" ry="17" fill="url(#bean)" stroke="#7A3225" strokeWidth="2.4" transform="rotate(20 148 86)" />
          <ellipse cx="68"  cy="76" rx="3.5" ry="2.2" fill="#fff" opacity="0.6" transform="rotate(-22 68 76)" />
          <ellipse cx="106" cy="58" rx="3.5" ry="2.2" fill="#fff" opacity="0.6" />
          <ellipse cx="142" cy="78" rx="3"   ry="2"   fill="#fff" opacity="0.6" transform="rotate(20 142 78)" />
        </svg>
      </span>
      <span className="paw-cta">点我揭晓宝宝性别</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COSMIC CLOUD
// ─────────────────────────────────────────────────────────────────────────────
const COSMIC_GLYPHS = [
  "♂", "♀", "π", "∑", "∞", "Σ", "∫", "θ", "Δ", "λ",
  "e=mc²", "P(X)", "½", "♂×♀", "XY", "XX", "n!", "φ", "Ψ", "Ω",
  "✦", "✧", "❀", "❋", "✺", "✸",
];

function CosmicCloud({ exiting }) {
  const items = useMemo(() => {
    const n = 38;
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = rand(140, 360);
      const ang = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
      out.push({
        i,
        glyph: choose(COSMIC_GLYPHS),
        x: Math.cos(ang) * r,
        y: Math.sin(ang) * r * 0.7,
        rot: rand(-30, 30),
        delay: rand(0, 1.2),
        dur: rand(3.5, 6),
        scale: rand(0.55, 1.4),
        hue: choose(["#E18AC7", "#7AB8FF", "#FFB785", "#C4A6FF", "#86E3C3"]),
      });
    }
    return out;
  }, []);
  return (
    <div className={"cosmic-cloud" + (exiting ? " is-exiting" : "")}>
      <div className="cosmic-core" />
      <div className="cosmic-ring cosmic-ring--1" />
      <div className="cosmic-ring cosmic-ring--2" />
      <div className="cosmic-ring cosmic-ring--3" />
      {items.map((it) => (
        <span
          key={it.i}
          className="cosmic-glyph"
          style={{
            transform: `translate(-50%,-50%) translate(${it.x}px, ${it.y}px) rotate(${it.rot}deg) scale(${it.scale})`,
            color: it.hue,
            animationDelay: `${it.delay}s`,
            animationDuration: `${it.dur}s`,
            textShadow: `0 0 18px ${it.hue}88, 0 0 6px ${it.hue}`,
            "--tx": `${it.x}px`,
            "--ty": `${it.y}px`,
            "--r": `${it.rot}deg`,
            "--s": it.scale,
          }}
        >
          {it.glyph}
        </span>
      ))}
      <DnaHelix />
      <div className="cosmic-label">生命正在自然中诞生…</div>
    </div>
  );
}

function DnaHelix() {
  const dots = useMemo(() => Array.from({ length: 22 }, (_, i) => i), []);
  return (
    <div className="dna">
      {dots.map((i) => {
        const t = i / 22;
        return (
          <span key={i}>
            <span
              className="dna-dot dna-dot--a"
              style={{ top: `${t * 100}%`, animationDelay: `${-t * 2}s` }}
            />
            <span
              className="dna-dot dna-dot--b"
              style={{ top: `${t * 100}%`, animationDelay: `${-t * 2 + 1}s` }}
            />
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN
// ─────────────────────────────────────────────────────────────────────────────
function Countdown({ onDone, from = 10, onTick }) {
  const [n, setN] = useState(from);
  useEffect(() => { setN(from); }, [from]);
  useEffect(() => {
    if (n === 0) { onDone(); return; }
    if (onTick) onTick(n);
    const t = setTimeout(() => setN((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [n, onDone, onTick]);
  if (n === 0) return null;
  return (
    <div className="countdown">
      <span key={n} className={"cd-num" + (n >= 10 ? " cd-num--wide" : "")}>{n}</span>
      <span key={`r1-${n}`} className="cd-ripple" />
      <span key={`r2-${n}`} className="cd-ripple cd-ripple--2" />
      <span key={`r3-${n}`} className="cd-ripple cd-ripple--3" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUSPEND — glowing orb + typing text
// ─────────────────────────────────────────────────────────────────────────────
function Suspend({ message }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    setShown("");
    const id = setInterval(() => {
      i++;
      setShown(message.slice(0, i));
      if (i >= message.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [message]);
  return (
    <div className="suspend">
      <div className="orb">
        <div className="orb-core" />
        <div className="orb-ring orb-ring--1" />
        <div className="orb-ring orb-ring--2" />
        <div className="orb-ring orb-ring--3" />
        <div className="orb-bokeh" />
      </div>
      <div className="suspend-text">
        {shown}
        <span className="caret">▎</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HORSE SILHOUETTE — Year of the Horse line art
// ─────────────────────────────────────────────────────────────────────────────
function HorseSilhouette({ tint }) {
  return (
    <svg className="horse" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g fill="none" stroke={tint} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        <path d="M310 150 C 280 130, 250 120, 220 140 C 200 155, 200 180, 220 200 C 200 210, 195 230, 220 245 C 200 255, 200 275, 230 285" />
        <path d="M320 140 C 305 110, 285 95, 260 100 C 245 105, 240 125, 255 140" />
        <path d="M295 175 C 270 175, 250 195, 250 220" />
        <path d="M330 130 C 360 100, 410 95, 445 115 C 470 130, 485 160, 475 195 L 470 245 C 465 270, 455 290, 430 295 L 380 300 C 360 300, 345 285, 340 265 L 335 225 C 330 200, 320 180, 310 165 Z" />
        <path d="M380 100 L 395 70 L 415 110" />
        <path d="M395 100 L 405 88 L 410 105" />
        <circle cx="425" cy="170" r="3.5" fill={tint} stroke="none" />
        <path d="M455 240 C 462 245, 462 255, 455 258" />
        <path d="M445 250 L 460 250" />
        <path d="M340 280 C 330 320, 340 360, 370 390 L 420 420" />
        <path d="M450 290 C 480 320, 510 350, 540 360 L 600 370" />
        <path d="M420 420 C 470 430, 540 425, 600 405 C 660 385, 700 360, 720 340" />
        <path d="M600 370 C 640 360, 680 345, 720 320" />
        <path d="M720 320 C 740 335, 745 360, 735 380 C 720 410, 700 430, 690 460" />
        <path d="M735 380 C 750 395, 760 420, 755 450 C 750 480, 735 500, 715 510" />
        <path d="M740 410 C 760 430, 775 460, 770 490" />
        <path d="M430 420 L 425 530 L 432 545" />
        <path d="M455 425 L 460 535 L 467 548" />
        <path d="M650 405 L 645 470 L 655 535 L 665 548" />
        <path d="M685 395 L 690 470 L 700 540 L 710 550" />
        <path d="M418 548 L 445 548" />
        <path d="M455 552 L 480 552" />
        <path d="M650 552 L 678 552" />
        <path d="M695 555 L 722 555" />
        <path d="M470 445 C 530 460, 590 455, 640 440" />
        <path d="M340 280 C 360 290, 380 305, 395 320" />
        <path d="M355 270 C 380 280, 400 295, 415 315" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSIC INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
function MusicIndicator({ on, onToggle }) {
  return (
    <button className={"music " + (on ? "is-on" : "is-off")} onClick={onToggle} aria-label="Toggle music">
      <span className="music-note">♪</span>
      <span className="music-bars">
        <span /><span /><span /><span /><span />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
const COUNTDOWN_FROM = 10;
const PAW_EXIT_MS = 1500;
const CLOUD_DURATION = 4.2; // seconds
const SUSPEND_DURATION = 6.6; // seconds
const SUSPEND_TEXT = "即将揭晓";

export default function GenderReveal() {
  // Read ?result=boy|girl from the URL once on mount
  const result = DEFAULT_RESULT;

  const [stage, setStage] = useState("trigger");
  const [pawLeaving, setPawLeaving] = useState(false);
  const [cosmicExiting, setCosmicExiting] = useState(false);
  const [bloom, setBloom] = useState(false);
  const [music, setMusic] = useState(true);
  const heartbeat = useHeartbeat();

  // ── Background music ────────────────────────────────────────
  const audioRef = useRef(null);
  useEffect(() => {
    const a = new Audio("/music/bgm.wav");
    a.loop = true;
    a.volume = 0.1;
    audioRef.current = a;
    return () => { a.pause(); a.src = ""; };
  }, []);

  // Plays during cosmic + countdown; fades out gracefully when suspend begins.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const fadeTo = (target, ms) => {
      if (a._fadeId) clearInterval(a._fadeId);
      const start = a.volume;
      const t0 = performance.now();
      a._fadeId = setInterval(() => {
        const k = Math.min(1, (performance.now() - t0) / ms);
        a.volume = start + (target - start) * k;
        if (k >= 1) {
          clearInterval(a._fadeId);
          a._fadeId = null;
          if (target === 0) a.pause();
        }
      }, 40);
    };
    if (!music) { fadeTo(0, 400); return; }
    if (stage === "cosmic" || stage === "countdown") {
      a.volume = 0.14;
      a.play().catch(() => {});
    } else if (stage === "suspend" || stage === "reveal") {
      if (!a.paused) fadeTo(0, 2500);
    } else {
      a.pause();
    }
  }, [music, stage]);

  useEffect(() => {
    if (stage === "cosmic") {
      const a = setTimeout(() => setCosmicExiting(true), CLOUD_DURATION * 1000 - 700);
      const b = setTimeout(() => {
        setCosmicExiting(false);
        setStage("countdown");
      }, CLOUD_DURATION * 1000);
      return () => { clearTimeout(a); clearTimeout(b); };
    }
  }, [stage]);

  useEffect(() => {
    if (stage === "suspend") {
      const reveal = setTimeout(() => {
        setBloom(true);
        setTimeout(() => setStage("reveal"), 700);
      }, SUSPEND_DURATION * 1000);

      const effects = process.env.NEXT_PUBLIC_LOCAL_FEATURES ? setTimeout(() => {
        fetch("/api/lifx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gender: result }),
        }).catch(() => {});
        fetch("/api/play-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gender: result }),
        }).catch(() => {});
      }, SUSPEND_DURATION * 1000 - 800) : null;

      return () => {
        clearTimeout(reveal);
        clearTimeout(effects);
      };
    }
  }, [stage, result]);

  useEffect(() => {
    if (stage === "reveal") {
      const id = setTimeout(() => setBloom(false), 0);
      return () => clearTimeout(id);
    }
  }, [stage]);

  const startRef = useRef(null);

  const start = () => {
    if (pawLeaving) return;
    heartbeat.ensure();
    heartbeat.chime(music);
    setPawLeaving(true);
    setTimeout(() => { setStage("cosmic"); setPawLeaving(false); }, PAW_EXIT_MS);
  };
  startRef.current = start;

  // ── SSE remote trigger ──────────────────────────────────────
  useEffect(() => {
    const es = new EventSource("/api/reveal-trigger");
    es.onmessage = (e) => {
      if (e.data === "trigger") startRef.current?.();
    };
    return () => es.close();
  }, []);

  const restart = () => { setStage("trigger"); setBloom(false); setPawLeaving(false); };

  const isBoy = result === "boy";

  return (
    <div className={"stage stage--" + stage + " stage--" + result}>
      {/* State 1: TRIGGER */}
      <section className={"scene scene--trigger " + (stage === "trigger" ? "is-in" : "is-out")}>
        <div className="bg bg--pastel" />
        <PastelParticles density={70} hue="warm" />
        <img className="scan scan--left" src="/stickers/scan-top.png" alt="" aria-hidden="true" />
        <img className="scan scan--right" src="/stickers/scan-bottom.png" alt="" aria-hidden="true" />
        {stage === "trigger" && <FloatingStickers which="trigger" />}
        <div className="trigger-wrap">
          <div className="eyebrow">a baby is coming in 2026</div>
          <h1 className="display title-1">
            <span className="ink">老白的爪爪</span>
            <br />
            <span className="ink ink--accent">藏有秘密!</span>
          </h1>
          <PawButton onClick={start} leaving={pawLeaving} />
          <div className="hint">let&apos;s witness this together!</div>
        </div>
      </section>

      {/* State 2: COSMIC CLOUD */}
      <section className={"scene scene--cosmic " + (stage === "cosmic" ? "is-in" : "is-out")}>
        <div className="bg bg--cosmic" />
        <PastelParticles density={40} hue="warm" />
        {stage === "cosmic" && <CosmicCloud exiting={cosmicExiting} />}
      </section>

      {/* State 3: COUNTDOWN */}
      <section className={"scene scene--countdown " + (stage === "countdown" ? "is-in" : "is-out")}>
        <div className="bg bg--cosmic" />
        <PastelParticles density={30} hue="warm" />
        {stage === "countdown" && <FloatingStickers which="countdown" />}
        {stage === "countdown" && (
          <Countdown
            onDone={() => setStage("suspend")}
            from={COUNTDOWN_FROM}
            onTick={() => heartbeat.play(music)}
          />
        )}
      </section>

      {/* State 4: SUSPEND */}
      <section className={"scene scene--suspend " + (stage === "suspend" ? "is-in" : "is-out")}>
        <div className="bg bg--mystic" />
        <MysticStars />
        {stage === "suspend" && <Suspend message={SUSPEND_TEXT + " …"} />}
      </section>

      {/* State 5: REVEAL */}
      <section className={"scene scene--reveal " + (stage === "reveal" ? "is-in" : "is-out")}>
        <div className={"bg bg--reveal " + (isBoy ? "bg--boy" : "bg--girl")} />
        {stage === "reveal" && (
          <>
            <HorseSilhouette tint="rgba(255,255,255,0.22)" />
            <FloatingStickers which="reveal" />
            <Confetti result={result} />
            <div className="reveal-wrap">
              <div className="reveal-eyebrow">🐎 马宝宝是</div>
              <h2 className="display reveal-title">
                {/* <span className="rt-line rt-line--small">宝宝是</span> */}
                <span className="rt-line rt-line--big">{isBoy ? "男孩" : "女孩"}</span>
                <br />
                <span className="rt-line rt-line--emoji">🍼👶🏻🐣💖</span>
              </h2>
              <div className="heart-note">我们迫不及待想见到你 ^_^</div>
            </div>
          </>
        )}
      </section>

      {/* Bloom flash overlay */}
      <div className={"bloom " + (bloom ? "is-on" : "") + " " + (isBoy ? "bloom--boy" : "bloom--girl")} />

      {/* Music toggle */}
      <MusicIndicator on={music} onToggle={() => setMusic((v) => !v)} />
    </div>
  );
}
