import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap";

// ─── i18n ──────────────────────────────────────
const strings = {
  es: {
    chooseGame: "Elegí tu juego ✨", more: "Más juegos próximamente ✨", feedback: "Feedback", suggest: "¿Sugerencia o bug?",
    write: "Escribí acá...", close: "Cerrar", send: "Enviar", settings: "Ajustes", darkMode: "Modo oscuro",
    soundVib: "Sonidos/vibración", lang: "Idioma", contGame: "Continuar partida de", unfinished: "Tenés una partida sin terminar",
    howMany: "¿A cuántos puntos?", names: "Nombres", next: "Siguiente →", back: "← Atrás", start: "Empezar",
    newGame: "¿Nueva partida?", savesHist: "Se guarda en historial.", resetQ: "¿Reiniciar a cero?", losesAll: "Se pierde todo.",
    cancel: "Cancelar", yesNew: "Sí, nueva", reset: "Reiniciar", resetNoSave: "Reiniciar sin guardar",
    undoQ: "¿Deshacer última mano?", undoDesc: "Se borra la última mano.", undo: "Deshacer", yesUndo: "Sí, deshacer",
    remain: "faltan", toWin: "para ganar", wins: "ganan", hist: "Historial", newHand: "+ Nueva mano",
    editHand: "Editar mano", save: "Guardar", chooseClosed: "Elegí quién cerró",
    puras: "Puras", canastas: "Canastas", puntos: "Puntos", playedDead: "¿Jugó muerto?", closed: "Cerró",
    notClosed: "No cerró", sub: "Subtotal", dropWith: "Baja con",
    howPlay: "¿Cómo juegan?", pairs: "2 Parejas", threePlayers: "3 Jugadores", target: "Objetivo",
    custom: "Personalizado", values: "Valores", penaltyDead: "Penalidad muerto",
    howManyPlayers: "¿Cuántos jugadores?", turnsLeft: "turnos restantes", done: "¡Terminado!",
    chooseScore: "Elegí el puntaje", cross: "Tachar", erase: "Borrar", share: "Compartir", shareResult: "Compartir resultado",
    category: "Categoría", total: "TOTAL",
    upTo: "Hasta", staircase: "Escalera", poker: "Póker", generala: "Generala", doubleGen: "Doble Gen.",
    served: "servida",
    turnWarningTitle: "Atención", turnWarning: "Le toca a {expected}. ¿Seguir?",
    rematch: "Revancha", continueLast: "Continuar última partida", openNow: "Abrir ahora", handNum: "Mano", redo: "Rehacer",
  },
  en: {
    chooseGame: "Choose your game ✨", more: "More games coming soon ✨", feedback: "Feedback", suggest: "Suggestion or bug?",
    write: "Write here...", close: "Close", send: "Send", settings: "Settings", darkMode: "Dark mode",
    soundVib: "Sound/vibration", lang: "Language", contGame: "Continue game of", unfinished: "You have an unfinished game",
    howMany: "How many points?", names: "Names", next: "Next →", back: "← Back", start: "Start",
    newGame: "New game?", savesHist: "Saves to history.", resetQ: "Reset to zero?", losesAll: "Loses everything.",
    cancel: "Cancel", yesNew: "Yes, new", reset: "Reset", resetNoSave: "Reset without saving",
    undoQ: "Undo last hand?", undoDesc: "Removes last hand.", undo: "Undo", yesUndo: "Yes, undo",
    remain: "left", toWin: "to win", wins: "win!", hist: "History", newHand: "+ New hand",
    editHand: "Edit hand", save: "Save", chooseClosed: "Choose who closed",
    puras: "Pure runs", canastas: "Runs", puntos: "Points", playedDead: "Played dead hand?", closed: "Closed",
    notClosed: "Didn't close", sub: "Subtotal", dropWith: "Opens with",
    howPlay: "How do you play?", pairs: "2 Pairs", threePlayers: "3 Players", target: "Target",
    custom: "Custom", values: "Values", penaltyDead: "Dead hand penalty",
    howManyPlayers: "How many players?", turnsLeft: "turns left", done: "Done!",
    chooseScore: "Choose score", cross: "Cross out", erase: "Clear", share: "Share", shareResult: "Share result",
    category: "Category", total: "TOTAL",
    upTo: "Up to", staircase: "Straight", poker: "Four of a kind", generala: "Generala", doubleGen: "Double Gen.",
    served: "served",
    turnWarningTitle: "Heads up", turnWarning: "{expected}'s turn. Continue?",
    rematch: "Rematch", continueLast: "Continue last game", openNow: "Open now", handNum: "Hand", redo: "Redo",
  }
};

// ─── THEMES ────────────────────────────────────
const light = {
  bg:"#F7F3EE",bgS:"#F0E8DE",card:"#FFF",pri:"#6B4E30",priL:"#B4946A",priD:"#3C2A15",
  txt:"#2C1810",txtM:"#9C8B7A",txtF:"#C4B4A0",brd:"#E8E0D6",
  err:"#C0392B",errBg:"#FCEAE8",ok:"#27764E",okBg:"#E8F5ED",
  sh:"0 1px 6px rgba(80,50,20,.06)",shH:"0 4px 16px rgba(80,50,20,.12)",
};
const dark = {
  bg:"#1A1714",bgS:"#242018",card:"#2C2720",pri:"#C49A6C",priL:"#DEB98E",priD:"#8B6B45",
  txt:"#E8E0D6",txtM:"#9C8E7E",txtF:"#5C5248",brd:"#3A3530",
  err:"#E8695E",errBg:"#3A2220",ok:"#5CB880",okBg:"#1E2E22",
  sh:"0 1px 6px rgba(0,0,0,.2)",shH:"0 4px 16px rgba(0,0,0,.3)",
};

const Ctx = createContext();
const useApp = () => useContext(Ctx);

// ─── HELPERS ───────────────────────────────────
const vib = (ms = 15) => { try { navigator?.vibrate?.(ms) } catch (e) {} };
const vibWin = () => { try { navigator?.vibrate?.([50, 50, 50, 50, 100]) } catch (e) {} };
async function initWakeLock() { try { if ("wakeLock" in navigator) return await navigator.wakeLock.request("screen"); } catch (e) {} return null; }

const ST = {
  async save(k, v) {
    const json = JSON.stringify(v);
    try { localStorage.setItem(k, json) } catch (e) {}
    try { await window.storage?.set?.(k, json) } catch (e) {}
  },
  async load(k) {
    // Try window.storage first (Claude artifacts), fallback to localStorage
    try { const r = await window.storage?.get?.(k); if (r?.value) return JSON.parse(r.value); } catch (e) {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  },
  async del(k) {
    try { localStorage.removeItem(k) } catch (e) {}
    try { await window.storage?.delete?.(k) } catch (e) {}
  },
};

const bajadaReq = (score) => score >= 2000 ? 120 : score >= 1000 ? 90 : 50;
const clone = (v) => JSON.parse(JSON.stringify(v));
const fmtDate = () => { const d = new Date(); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}` };

// Share result - with multiple fallbacks
async function shareResult(title, lines, opts = {}) {
  // opts: { includeFooter?: boolean }
  const includeFooter = !!opts.includeFooter;

  // Text share (no link, no "Puntos App" unless you want it)
  const text = title + "\n" + lines.join("\n") + (includeFooter ? "\n\n— Puntos" : "");

  // Helper: word-wrap for canvas
  const wrap = (ctx, str, maxWidth) => {
    const words = String(str).split(" ");
    const out = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const test = line ? (line + " " + words[i]) : words[i];
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { if (line) out.push(line); line = words[i]; }
    }
    if (line) out.push(line);
    return out;
  };

  // Try 1: Share API with image (nice 1200x630 card)
  try {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 630;
    const ctx = c.getContext("2d");

    // Background
    ctx.fillStyle = "#F7F3EE";
    ctx.fillRect(0, 0, c.width, c.height);

    // Title
    ctx.fillStyle = "#2C1810";
    ctx.font = "800 72px system-ui, -apple-system, sans-serif";
    const titleLines = wrap(ctx, title, 1040);
    let y = 140;
    titleLines.slice(0, 2).forEach((ln) => {
      const w = ctx.measureText(ln).width;
      ctx.fillText(ln, (c.width - w) / 2, y);
      y += 84;
    });

    // Divider
    ctx.strokeStyle = "#D8CFC5";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(140, y + 10); ctx.lineTo(c.width - 140, y + 10); ctx.stroke();
    y += 70;

    // Lines (scoreboard)
    ctx.fillStyle = "#6B4E30";
    ctx.font = "600 44px system-ui, -apple-system, sans-serif";
    const maxLines = 8;
    let shown = 0;
    for (let i = 0; i < lines.length && shown < maxLines; i++) {
      const wrapped = wrap(ctx, lines[i], 980);
      for (let j = 0; j < wrapped.length && shown < maxLines; j++) {
        const ln = wrapped[j];
        const w = ctx.measureText(ln).width;
        ctx.fillText(ln, (c.width - w) / 2, y);
        y += 58;
        shown++;
      }
    }

    // Small brand (no URL)
    ctx.fillStyle = "#B9AA9A";
    ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    const brand = "puntos";
    ctx.fillText(brand, c.width - 220, c.height - 48);

    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const file = new File([blob], "marcador.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return { ok: true, mode: "image" };
    }
  } catch (e) {
    // User cancelled share sheet -> no-op
    if (e && (e.name === "AbortError" || e.message === "AbortError")) return { ok: false, cancelled: true };
  }

  // Try 2: Share API with text only
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return { ok: true, mode: "text" };
    }
  } catch (e) {
    if (e && (e.name === "AbortError" || e.message === "AbortError")) return { ok: false, cancelled: true };
  }

  // Try 3: Copy to clipboard (only if available; no alert spam on failure)
  try {
    await navigator.clipboard.writeText(text);
    alert("Copiado ✓");
    return { ok: true, mode: "clipboard" };
  } catch (e) {}

  // Try 4: Prompt with text to copy manually
  prompt("Copiá el resultado:", text);
  return { ok: true, mode: "prompt" };
}

// ─── UI ATOMS ──────────────────────────────────
function B({ children, onClick, disabled, v = "pri", s, ...r }) {
  const { t, sounds } = useApp();
  const vars = { pri: { background: t.pri, color: "#fff", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,.1)" },
    out: { background: "transparent", color: t.pri, border: `1.5px solid ${t.pri}`, boxShadow: "none" },
    err: { background: "transparent", color: t.err, border: `1.5px solid ${t.err}`, boxShadow: "none" },
    gh: { background: t.bgS, color: t.txt, border: `1px solid ${t.brd}`, boxShadow: "none" } };
  const handle = () => { if (!disabled && onClick) { if (sounds) vib(); onClick() } };
  return <button onClick={handle} disabled={disabled} style={{ borderRadius: 12, padding: "12px 18px", minHeight: 44, fontSize: 15, fontWeight: 700,
    fontFamily: "'DM Sans'", cursor: disabled ? "default" : "pointer", transition: "all .15s", opacity: disabled ? .35 : 1, touchAction: "manipulation", ...vars[v], ...s }} {...r}>{children}</button>;
}

function EN({ name, onSave, sz = 18 }) { const { t } = useApp(); const [ed, setEd] = useState(false); const [val, setVal] = useState(name);
  useEffect(() => setVal(name), [name]);
  if (ed) return <input autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={() => { onSave(val); setEd(false) }}
    onKeyDown={e => { if (e.key === "Enter") { onSave(val); setEd(false) } }}
    style={{ background: t.bgS, border: `1.5px solid ${t.pri}`, color: t.txt, fontSize: sz, fontWeight: 600, fontFamily: "'Playfair Display'",
      borderRadius: 8, padding: "2px 8px", outline: "none", width: "100%" }} />;
  return <span onClick={() => setEd(true)} style={{ fontSize: sz, fontWeight: 600, color: t.txt, cursor: "pointer",
    fontFamily: "'Playfair Display'" }}>{name} <span style={{ fontSize: 10, color: t.txtF }}>✎</span></span>;
}

const IcoBtn = ({ onClick, children, t }) => <button onClick={onClick} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt,
  borderRadius: 12, width: 48, height: 48, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>{children}</button>;

function Hdr({ title, emoji, onBack, sub, icons }) {
  const { t } = useApp();
  return <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.brd}` }}>
    <button onClick={onBack} style={{ background: t.card, border: `1px solid ${t.brd}`, color: t.txt, fontSize: 16, borderRadius: 10,
      width: 48, height: 48, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>←</button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontFamily: "'Playfair Display'", fontSize: 20, color: t.pri, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      {sub && <p style={{ margin: "1px 0 0 26px", fontSize: 11, color: t.txtM }}>{sub}</p>}
    </div>
    {icons && <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>{icons}</div>}
  </div>;
}

function NI({ label, value, onChange, step = 1, min, hint }) { const { t } = useApp();
  const [raw, setRaw] = useState(String(value)); useEffect(() => setRaw(String(value)), [value]);
  const commit = (v) => { const n = v === "" || v === "-" ? 0 : Number(v); onChange(min !== undefined ? Math.max(min, n) : n) };
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
    <div><span style={{ fontSize: 13 }}>{label}</span>{hint && <span style={{ fontSize: 10, color: t.txtF, marginLeft: 4 }}>{hint}</span>}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <button onClick={() => onChange(min !== undefined ? Math.max(min, value - step) : value - step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 44, height: 44, borderRadius: 10, cursor: "pointer", fontSize: 18, touchAction: "manipulation" }}>−</button>
      <input type="number" value={raw} onChange={e => setRaw(e.target.value)} onBlur={() => commit(raw)} onKeyDown={e => { if (e.key === "Enter") commit(raw) }} onFocus={e => e.target.select()}
        style={{ width: 64, minHeight: 44, textAlign: "center", background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 6, padding: 2, fontSize: 14, fontFamily: "'DM Sans'", outline: "none" }} />
      <button onClick={() => onChange(value + step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 44, height: 44, borderRadius: 10, cursor: "pointer", fontSize: 18, touchAction: "manipulation" }}>+</button>
    </div></div>;
}

function Modal({ children, onClose }) { return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
  <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%" }}>{children}</div></div>; }

function UndoBar({ toast, onUndo, onClose }) {
  const { t, L } = useApp();
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => onClose?.(), 2500);
    return () => clearTimeout(id);
  }, [toast, onClose]);
  if (!toast) return null;
  return <div style={{ position: "fixed", left: 16, right: 16, bottom: 24, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", maxWidth: 340, width: "auto", background: t.card, border: `1px solid ${t.brd}`, boxShadow: t.sh, borderRadius: 12, padding: "6px 10px", display: "flex", alignItems: "center", gap: 8, opacity: 0.92 }}>
      <div style={{ fontSize: 12, color: t.txtM, whiteSpace: "nowrap" }}>{toast.text}</div>
      {toast.redo && <button onClick={() => { toast.redo?.(); onClose?.(); }} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.redo}</button>}
      {toast.undo && <button onClick={() => { onUndo?.(); onClose?.(); }} style={{ background: t.pri, border: "none", color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.undo}</button>}
    </div>
  </div>;
}

// ─── TALLY (hand-drawn, stable offsets) ───────
function Tally({ count, color, divAt }) {
  const s = 44, p = 4, gap = 8;
  // Generate stable random offsets once per count change
  const offsets = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i++) arr.push((Math.random() - .5) * 1.5);
    return arr;
  }, [count]);
  let oi = 0;
  const r = () => offsets[oi++ % offsets.length];
  const els = []; let drawn = 0, divDone = !divAt;
  const sq = (k) => <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ animation: "popIn .25s ease" }}>
    <rect x={p + r()} y={p + r()} width={s - p * 2 + r()} height={s - p * 2 + r()} fill="none" stroke={color} strokeWidth="2.2" rx="1" opacity=".8" />
    <line x1={p + 1 + r()} y1={s - p - 1 + r()} x2={s - p - 1 + r()} y2={p + 1 + r()} stroke={color} strokeWidth="2.2" opacity=".8" /></svg>;
  const part = (n, k) => { const l = [];
    if (n >= 1) l.push(<line key="l" x1={p + r()} y1={p + r()} x2={p + r()} y2={s - p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 2) l.push(<line key="b" x1={p + r()} y1={s - p + r()} x2={s - p + r()} y2={s - p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 3) l.push(<line key="r" x1={s - p + r()} y1={s - p + r()} x2={s - p + r()} y2={p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 4) l.push(<line key="t" x1={s - p + r()} y1={p + r()} x2={p + r()} y2={p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    return <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{l}</svg> };
  const div = <div key="div" style={{ display: "flex", alignItems: "center", gap: 4, margin: "4px 0", width: "100%" }}>
    <div style={{ flex: 1, height: 2, background: "#C0392B", borderRadius: 2, opacity: .6 }} /><span style={{ fontSize: 8, color: "#C0392B", fontWeight: 700, letterSpacing: 1 }}>BUENAS</span>
    <div style={{ flex: 1, height: 2, background: "#C0392B", borderRadius: 2, opacity: .6 }} /></div>;
  while (drawn < count) { const rem = count - drawn, batch = Math.min(5, rem);
    if (!divDone && drawn < divAt && drawn + batch > divAt) { const b = divAt - drawn; if (b > 0) { els.push(b === 5 ? sq(`s${drawn}`) : part(b, `p${drawn}`)); drawn += b } els.push(div); divDone = true; continue }
    if (!divDone && drawn + batch === divAt) { els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch; els.push(div); divDone = true; continue }
    els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch }
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap, minHeight: 24, padding: "2px 0" }}>
    {els.length > 0 ? els : <span style={{ color, opacity: .3, fontSize: 12 }}>—</span>}</div>;
}

// ═══════════════════════════════════════════════
// TRUCO
// ═══════════════════════════════════════════════
function Truco({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [target, setTarget] = useState(15);
  const [step, setStep] = useState(0);
  const nameRefs = useRef([]);
  const [started, setStarted] = useState(false);
  const [names, setNames] = useState(["Nosotros", "Ellos"]);
  const [sc, setSc] = useState([]);
  const [modal, setModal] = useState(null);
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const moveToNextTrucoName = (i) => {
    const next = nameRefs.current[i + 1];
    if (next) { next.focus(); next.select?.(); }
    else startGame();
  };

  useEffect(() => {
    ST.load("truco-game").then(d => {
      if (d?.started) {
        setTarget(d.target ?? 15);
        const loadedNames = Array.isArray(d.names) && d.names.length ? d.names : ["Nosotros", "Ellos"];
        const loadedSc = Array.isArray(d.sc) && d.sc.length ? d.sc : loadedNames.map(n => ({ name: n, p: 0 }));
        setNames(loadedNames);
        setSc(loadedSc);
        setStarted(true);
        onContinueChange?.("truco");
      }
      setLoading(false);
    });
    ST.load("truco-hist").then(d => { if (Array.isArray(d)) setHist(d) });
  }, []);

  useEffect(() => {
    if (!started) return;
    ST.save("truco-game", { started: true, target, names, sc });
    onContinueChange?.("truco");
  }, [started, target, names, sc, onContinueChange]);

  useEffect(() => {
    if (hist.length) ST.save("truco-hist", hist);
  }, [hist]);

  const persistNow = (nextSc = sc, nextNames = names, nextTarget = target, nextStarted = started) => {
    if (!nextStarted) return Promise.resolve();
    return ST.save("truco-game", { started: true, target: nextTarget, names: nextNames, sc: nextSc });
  };

  const goBack = async () => {
    await persistNow();
    onContinueChange?.(started ? "truco" : null);
    onBack();
  };

  const startGame = async () => {
    const finalNames = names.map((n, i) => n?.trim() || (i === 0 ? "Nosotros" : "Ellos"));
    const fresh = finalNames.map(n => ({ name: n, p: 0 }));
    setNames(finalNames);
    setSc(fresh);
    setStarted(true);
    await ST.save("truco-game", { started: true, target, names: finalNames, sc: fresh });
    onContinueChange?.("truco");
  };

  const add = async (i, v) => {
    const prev = clone(sc);
    const u = sc.map((row, idx) => idx === i ? { ...row, p: Math.max(0, row.p + v) } : row);
    setSc(u);
    setToast({ text: `${u[i].name}: ${v > 0 ? "+" : ""}${v}` , undo: () => { setSc(prev); persistNow(prev); } });
    await persistNow(u);
    if (sounds) vib();
    if (sounds && u[i].p >= target) vibWin();
  };

  const ren = async (i, n) => {
    const safe = n?.trim() || (i === 0 ? "Nosotros" : "Ellos");
    const nextNames = names.map((x, idx) => idx === i ? safe : x);
    const nextSc = sc.map((row, idx) => idx === i ? { ...row, name: safe } : row);
    setNames(nextNames);
    setSc(nextSc);
    await persistNow(nextSc, nextNames);
  };

  const rematch = async () => {
    const resetSc = (sc.length ? sc : names.map(n => ({ name: n, p: 0 }))).map(s => ({ ...s, p: 0 }));
    setSc(resetSc);
    setModal(null);
    setToast({ text: L.rematch, undo: null });
    await persistNow(resetSc);
  };

  const winner = sc.find(s => s.p >= target);
  const saveNew = async () => {
    const nextHist = [{ scores: sc.map(s => ({ name: s.name, p: s.p })), target, date: fmtDate(), done: !!winner }, ...hist];
    setHist(nextHist);
    await ST.save("truco-hist", nextHist);
    const resetSc = sc.map(s => ({ ...s, p: 0 }));
    setSc(resetSc);
    setModal(null);
    await persistNow(resetSc);
  };
  const resetZ = async () => {
    setStarted(false);
    setStep(0);
    setSc([]);
    setModal(null);
    await ST.del("truco-game");
    onContinueChange?.(null);
  };
  const delH = async i => {
    const nextHist = hist.filter((_, j) => j !== i);
    setHist(nextHist);
    if (nextHist.length) await ST.save("truco-hist", nextHist);
    else await ST.del("truco-hist");
  };
  const doShare = () => shareResult("Truco - " + target + " pts", sc.map(s => `${s.name}: ${s.p}`));
  const isPhone = typeof window !== "undefined" && window.innerWidth <= 480;

  if (loading) return <div><Hdr title="Truco" emoji="🂡" onBack={goBack} /><div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (!started) return <div><Hdr title="Truco" emoji="🂡" onBack={goBack} />
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
      {step === 0 && <><p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howMany}</p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>{[15, 30].map(v => <B key={v} v={target === v ? "pri" : "gh"} onClick={() => setTarget(v)}
          s={{ fontSize: 26, padding: "18px 16px", minHeight: 68, fontFamily: "'Playfair Display'", fontWeight: 800 }}>{v}</B>)}</div>
        <B onClick={() => setStep(1)} s={{ width: "100%" }}>{L.next}</B></>}
      {step === 1 && <><p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
        {names.map((n, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
          <input autoFocus={i === 0} ref={el => { nameRefs.current[i] = el }} value={n} onChange={e => { const u = [...names]; u[i] = e.target.value; setNames(u) }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextTrucoName(i) } }} onFocus={e => e.target.select()} enterKeyHint={i === names.length - 1 ? "done" : "next"}
            style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} /></div>)}
        <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setStep(0)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={startGame} s={{ flex: 1, fontSize: 16, minHeight: 52 }}>{L.start} 🂡</B></div>
        </div></>}
    </div></div>;

  return <div>
    <Hdr title="Truco" emoji="🂡" onBack={goBack} sub={`A ${target}`} icons={<>
      <IcoBtn onClick={doShare} t={t}>📤</IcoBtn>
      <IcoBtn onClick={() => setModal("new")} t={t}>🔄</IcoBtn>
      {hist.length > 0 && <IcoBtn onClick={() => setShowH(!showH)} t={t}>📋</IcoBtn>}
    </>} />

    {modal && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
      <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
      <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
      {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
    </div></Modal>}

    {showH && hist.length > 0 && <div style={{ margin: "8px 16px", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{L.hist}</p>
      {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${t.brd}30`, fontSize: 12 }}>
        <div style={{ flex: 1 }}>{h.scores.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.p}</b></span>)}</div>
        <span style={{ fontSize: 10, color: t.txtF }}>{h.date}</span>
        <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 18, padding: 6 }}>×</button>
      </div>)}
    </div>}

    {winner && <div style={{ textAlign: "center", padding: 16, margin: "12px 16px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
      <div style={{ fontSize: 24, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} {L.wins}!</div>
      <div style={{ fontSize: 13, opacity: .9, marginTop: 4 }}>{sc.map(s => `${s.name} ${s.p}`).join(" · ")}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
        <B onClick={doShare} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>📤 {L.share}</B>
        <B onClick={rematch} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.rematch}</B>
        <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.yesNew}</B></div></div>}

    <div style={{ padding: isPhone ? "8px 10px" : "12px 16px" }}>
      {/* Tally comparison card */}
      <div style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: isPhone ? 14 : 18, boxShadow: t.sh, padding: isPhone ? "12px 0" : "16px 0" }}>
        {/* Names */}
        <div style={{ display: "flex" }}>
          {sc.map((s, i) => <div key={i} style={{ flex: 1, textAlign: "center", opacity: winner && winner !== s ? .4 : 1 }}>
            <EN name={s.name} onSave={n => ren(i, n)} sz={isPhone ? 15 : 18} />
          </div>)}
        </div>

        {/* Tallies - pushed toward center */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, margin: "10px 0",
          minHeight: isPhone ? (target === 30 ? 200 : 140) : (target === 30 ? 260 : 170) }}>
          <div style={{ flex: "0 1 auto", padding: isPhone ? "8px 12px 8px 16px" : "10px 16px 10px 20px",
            background: t.bgS, borderRadius: "12px 0 0 12px", border: `1px solid ${t.brd}`, borderRight: "none",
            display: "flex", flexDirection: "column", alignItems: "flex-end",
            opacity: winner && winner !== sc[0] ? .4 : 1 }}>
            {target === 30 && <div style={{ fontSize: 8, color: t.txtM, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>MALAS / BUENAS</div>}
            <Tally count={sc[0]?.p || 0} color={t.pri} divAt={target === 30 ? 15 : null} />
          </div>
          <div style={{ width: 2, background: t.brd, flexShrink: 0 }} />
          <div style={{ flex: "0 1 auto", padding: isPhone ? "8px 16px 8px 12px" : "10px 20px 10px 16px",
            background: t.bgS, borderRadius: "0 12px 12px 0", border: `1px solid ${t.brd}`, borderLeft: "none",
            display: "flex", flexDirection: "column", alignItems: "flex-start",
            opacity: winner && winner !== sc[1] ? .4 : 1 }}>
            {target === 30 && <div style={{ fontSize: 8, color: t.txtM, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>MALAS / BUENAS</div>}
            <Tally count={sc[1]?.p || 0} color={t.pri} divAt={target === 30 ? 15 : null} />
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: "flex" }}>
          {sc.map((s, i) => <div key={i} style={{ flex: 1, textAlign: "center", padding: "6px 0", opacity: winner && winner !== s ? .4 : 1 }}>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: isPhone ? 40 : 52, fontWeight: 800, color: t.pri, lineHeight: 1 }}>{s.p}</div>
            <div style={{ fontSize: 11, color: t.txtF, marginTop: 2 }}>{Math.max(0, target - s.p)} {L.remain}</div>
          </div>)}
        </div>
      </div>

      {/* Buttons - separate row with space */}
      <div style={{ display: "flex", gap: isPhone ? 10 : 14, marginTop: isPhone ? 10 : 14 }}>
        {sc.map((s, i) => <div key={i} style={{ flex: 1, display: "grid", gap: 6, gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {[1, 2, 3].map(v => <B key={v} onClick={() => add(i, v)} s={{ fontSize: isPhone ? 16 : 18, minHeight: 48, padding: "12px 0" }}>+{v}</B>)}
          <B v="gh" onClick={() => add(i, -1)} s={{ fontSize: isPhone ? 16 : 18, minHeight: 48, padding: "12px 0" }}>−1</B>
        </div>)}
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}
const BK_D = { pura: 200, canasta: 100, cierre: 100, muerto: 100 };

function Burako({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [setup, setSetup] = useState(true); const [sStep, setSStep] = useState(0);
  const [pC, setPC] = useState(2); const [tgt, setTgt] = useState(3000); const [cfg, setCfg] = useState({ ...BK_D });
  const [showCfg, setShowCfg] = useState(false); const [teamNames, setTeamNames] = useState(["Pareja 1", "Pareja 2"]);
  const [teams, setTeams] = useState([]); const [adding, setAdding] = useState(false); const [editIdx, setEditIdx] = useState(null);
  const [hf, setHf] = useState([]); const [modal, setModal] = useState(null); const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false); const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true); const [redoHand, setRedoHand] = useState(null);
  const teamNameRefs = useRef([]);

  const handlePC = (n) => { setPC(n); setTeamNames(n === 2 ? ["Pareja 1", "Pareja 2"] : ["Jugador 1", "Jugador 2", "Jugador 3"]) };
  const moveToNextBurakoName = (i) => {
    const next = teamNameRefs.current[i + 1];
    if (next) { next.focus(); next.select?.(); }
    else setSStep(2);
  };

  useEffect(() => { ST.load("burako-game").then(d => { if (d?.teams?.length) { setTeams(d.teams); setTgt(d.tgt); setCfg(d.cfg); setPC(d.pC); setSetup(false); onContinueChange?.("burako") } setLoading(false); });
    ST.load("burako-hist").then(d => { if (d) setHist(d) }) }, []);
  useEffect(() => { if (teams.length && !setup) { ST.save("burako-game", { teams, tgt, cfg, pC }); onContinueChange?.("burako"); } }, [teams, tgt, cfg, pC, setup, onContinueChange]);
  useEffect(() => { if (hist.length) ST.save("burako-hist", hist); else ST.del("burako-hist") }, [hist]);

  const start = () => { const fresh = teamNames.map(n => ({ name: n, hands: [] })); setTeams(fresh); setSetup(false); ST.save("burako-game", { teams: fresh, tgt, cfg, pC }); onContinueChange?.("burako") };
  const initHand = () => { setHf(teams.map(() => ({ pura: 0, canasta: 0, puntos: 0, cierre: false, muerto: true }))); setAdding(true); setEditIdx(null) };
  const startEdit = (hi) => { setHf(teams.map(tm => ({ ...tm.hands[hi] }))); setEditIdx(hi); setAdding(true) };
  const calc = (h) => { if (!h) return 0; let s = (h.pura || 0) * cfg.pura + (h.canasta || 0) * cfg.canasta + (h.puntos || 0); if (h.cierre) s += cfg.cierre; if (!h.muerto) s -= cfg.muerto; return s };
  const total = (tm) => tm.hands.reduce((s, h) => s + calc(h), 0);
  const setCierre = (i) => setHf(hf.map((h, j) => ({ ...h, cierre: j === i })));
  const upHf = (i, k, v) => { const u = [...hf]; u[i] = { ...u[i], [k]: v }; setHf(u) };
  const someoneClosed = hf.some(h => h?.cierre); const ren = (i, n) => { const u = [...teams]; u[i].name = n; setTeams(u) };
  const maxHands = Math.max(...teams.map(tm => tm.hands.length), 0);
  const winner = teams.find(tm => total(tm) >= tgt);
  const saveHand = () => { const prev = clone(teams); const u = clone(teams); if (editIdx !== null) { hf.forEach((h, i) => { u[i].hands[editIdx] = { ...h } }) } else { hf.forEach((h, i) => { u[i].hands.push({ ...h }) }) }
    setTeams(u); setAdding(false); setHf([]); setEditIdx(null); setRedoHand(null); setToast({ text: editIdx !== null ? `${L.editHand} ${editIdx + 1}` : L.newHand, undo: () => setTeams(prev) }); if (sounds && u.some(tm => total(tm) >= tgt)) vibWin() };
  const undoLast = () => { const u = clone(teams); const removed = u.map(tm => tm.hands.pop() || null); setTeams(u); setRedoHand(removed); setModal(null); setToast({ text: L.undoDesc, redo: () => { const r = clone(u); r.forEach((tm, i) => { if (removed[i]) tm.hands.push(removed[i]); }); setTeams(r); setRedoHand(null); } }); };
  const rematch = async () => { const resetTeams = teams.map(tm => ({ ...tm, hands: [] })); setTeams(resetTeams); setModal(null); setToast({ text: L.rematch, undo: null }); await ST.save("burako-game", { teams: resetTeams, tgt, cfg, pC }); onContinueChange?.("burako") };
  const saveNew = async () => { const nextHist = [{ teams: teams.map(tm => ({ name: tm.name, t: total(tm) })), tgt, date: fmtDate(), done: !!winner }, ...hist];
    setHist(nextHist); await ST.save("burako-hist", nextHist); const resetTeams = teams.map(tm => ({ ...tm, hands: [] })); setTeams(resetTeams); setModal(null); await ST.save("burako-game", { teams: resetTeams, tgt, cfg, pC }); onContinueChange?.("burako") };
  const resetZ = async () => { setTeams([]); setSetup(true); setModal(null); await ST.del("burako-game"); onContinueChange?.(null) };
  const delH = i => setHist(h => h.filter((_, j) => j !== i));
  const doShare = () => shareResult(`Burako - ${(tgt / 1000).toFixed(tgt % 1000 ? 1 : 0)}K`, teams.map(tm => `${tm.name}: ${total(tm)}`));
  const goBack = async () => { if (teams.length && !setup) await ST.save("burako-game", { teams, tgt, cfg, pC }); onContinueChange?.(teams.length ? "burako" : null); onBack() };

  if (loading) return <div><Hdr title="Burako" emoji="🃏" onBack={goBack} /><div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (setup) return <div><Hdr title="Burako" emoji="🃏" onBack={goBack} />
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "20px 20px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      {sStep === 0 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howPlay}</p>
        <div style={{ display: "flex", gap: 8 }}>{[2, 3].map(n => <B key={n} v={pC === n ? "pri" : "gh"} onClick={() => handlePC(n)}
          s={{ flex: 1, fontSize: 15, padding: "14px 10px" }}>{n === 2 ? L.pairs : L.threePlayers}</B>)}</div>
        <B onClick={() => setSStep(1)} s={{ width: "100%", padding: 12 }}>{L.next}</B></>}
      {sStep === 1 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
        {teamNames.map((n, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
          <input autoFocus={i === 0} ref={el => { teamNameRefs.current[i] = el }} value={n} onChange={e => { const u = [...teamNames]; u[i] = e.target.value; setTeamNames(u) }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextBurakoName(i) } }} onFocus={e => e.target.select()} enterKeyHint={i === teamNames.length - 1 ? "done" : "next"}
            style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} /></div>)}
        <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setSStep(0)} s={{ flex: 1 }}>{L.back}</B><B onClick={() => setSStep(2)} s={{ flex: 1, minHeight: 52 }}>{L.next}</B></div>
        </div></>}
      {sStep === 2 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.target}</p>
        <div style={{ display: "flex", gap: 6 }}>{[3000, 5000].map(n => <B key={n} v={tgt === n ? "pri" : "gh"} onClick={() => setTgt(n)} s={{ flex: 1, fontSize: 14, minHeight: 52 }}>{(n / 1000)}K</B>)}</div>
        <NI label={L.custom} value={tgt} onChange={v => setTgt(v)} step={500} min={500} />
        <div style={{ borderTop: `1px solid ${t.brd}`, paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 8px" }}>{L.values}</p>
          <NI label={L.puras} value={cfg.pura} onChange={v => setCfg({ ...cfg, pura: v })} step={10} min={0} />
          <NI label={L.canastas} value={cfg.canasta} onChange={v => setCfg({ ...cfg, canasta: v })} step={10} min={0} />
          <NI label={L.closed} value={cfg.cierre} onChange={v => setCfg({ ...cfg, cierre: v })} step={10} min={0} />
          <NI label={L.penaltyDead} value={cfg.muerto} onChange={v => setCfg({ ...cfg, muerto: v })} step={10} min={0} /></div>
        <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setSStep(1)} s={{ flex: 1 }}>{L.back}</B>
          <B onClick={start} s={{ flex: 1, padding: 12, fontSize: 15, minHeight: 52 }}>{L.start} 🃏</B></div></>}
    </div></div>;

  return <div>
    <Hdr title="Burako" emoji="🃏" onBack={goBack} sub={`A ${(tgt / 1000).toFixed(tgt % 1000 ? 1 : 0)}K`} icons={<>
      <IcoBtn onClick={() => setShowCfg(!showCfg)} t={t}>⚙️</IcoBtn>
      <IcoBtn onClick={doShare} t={t}>📤</IcoBtn>
      <IcoBtn onClick={() => setModal("new")} t={t}>🔄</IcoBtn>
      {hist.length > 0 && <IcoBtn onClick={() => setShowH(!showH)} t={t}>📋</IcoBtn>}
    </>} />

    {modal && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>
        {modal === "new" ? L.newGame : modal === "undo" ? L.undoQ : L.resetQ}</p>
      <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : modal === "undo" ? L.undoDesc : L.losesAll}</p>
      <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : modal === "undo" ? <B v="err" onClick={undoLast} s={{ flex: 1 }}>{L.yesUndo}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
      {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
    </div></Modal>}

    {showCfg && <div style={{ margin: "8px 16px", background: t.card, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 12, boxShadow: t.sh }}>
      <NI label={L.puras} value={cfg.pura} onChange={v => setCfg({ ...cfg, pura: v })} step={10} min={0} />
      <NI label={L.canastas} value={cfg.canasta} onChange={v => setCfg({ ...cfg, canasta: v })} step={10} min={0} />
      <NI label={L.closed} value={cfg.cierre} onChange={v => setCfg({ ...cfg, cierre: v })} step={10} min={0} />
      <NI label={L.penaltyDead} value={cfg.muerto} onChange={v => setCfg({ ...cfg, muerto: v })} step={10} min={0} />
      <B onClick={() => setShowCfg(false)} s={{ width: "100%", marginTop: 6 }}>{L.close}</B></div>}

    {showH && hist.length > 0 && <div style={{ margin: "8px 16px", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{L.hist}</p>
      {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${t.brd}30`, fontSize: 12 }}>
        <div style={{ flex: 1 }}>{h.teams.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
        <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 14, padding: 2 }}>×</button></div>)}</div>}

    {winner && <div style={{ textAlign: "center", padding: 14, margin: "8px 16px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
      <div style={{ fontSize: 22, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} {L.wins}!</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <B onClick={doShare} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>📤 {L.share}</B>
        <B onClick={rematch} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.rematch}</B>
        <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.yesNew}</B></div></div>}

    <div style={{ padding: "12px 12px 0", overflowX: "auto" }}><div>
      <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${teams.length}, 1fr)`, gap: 4, marginBottom: 4, position: "sticky", top: 0, zIndex: 2 }}>
        <div style={{ padding: "8px 4px", textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: "8px 8px 0 0", fontSize: 11, color: t.txtM }}>{L.handNum}</div>
        {teams.map((tm, i) => <div key={i} style={{ padding: "8px 4px", textAlign: "center", background: t.card, border: `1px solid ${t.brd}`, borderRadius: "8px 8px 0 0" }}>
          <EN name={tm.name} onSave={n => ren(i, n)} sz={14} />
          <div style={{ fontSize: 11, color: t.pri, marginTop: 2, fontWeight: 700 }}>{L.dropWith}: {bajadaReq(total(tm))}</div></div>)}
      </div>
      {Array.from({ length: maxHands }).map((_, hi) => <div key={hi} style={{ display: "grid", gridTemplateColumns: `60px repeat(${teams.length}, 1fr)`, gap: 4, marginBottom: 6, alignItems: "stretch" }}>
        <div style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: t.pri, fontFamily: "'Playfair Display'" }}>{hi + 1}</div>
        {teams.map((tm, ti) => { const h = tm.hands[hi]; if (!h) return <div key={ti} style={{ background: t.card, border: `1px solid ${t.brd}`, minHeight: 52, borderRadius: 10 }} />;
          const s = calc(h); const bits = []; if (h.pura > 0) bits.push(`${h.pura}P`); if (h.canasta > 0) bits.push(`${h.canasta}C`);
          if (h.puntos !== 0) bits.push(`${h.puntos > 0 ? "+" : ""}${h.puntos}`); if (h.cierre) bits.push("✓"); if (!h.muerto) bits.push("−M");
          return <div key={ti} onClick={() => !adding && startEdit(hi)} style={{ background: t.card, border: `1px solid ${t.brd}`, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 10, cursor: "pointer", minHeight: 52 }}>
            <span style={{ fontSize: 11, color: t.txtM, lineHeight: 1.25 }}>{bits.join(" · ")}</span>
            <span style={{ fontFamily: "'Playfair Display'", fontSize: 17, fontWeight: 700, color: s >= 0 ? t.ok : t.err, marginLeft: 8, flexShrink: 0 }}>{s >= 0 ? "+" : ""}{s}</span></div> })}
      </div>)}
      <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${teams.length}, 1fr)`, gap: 4, marginTop: 4 }}>
        <div style={{ padding: "6px 4px", textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: "0 0 0 8px", fontWeight: 800, color: t.pri, fontFamily: "'Playfair Display'", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{L.total}</div>
        {teams.map((tm, i) => <div key={i} style={{ padding: "6px 4px", textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: i === teams.length - 1 ? "0 0 8px 0" : 0 }}>
          <div style={{ fontFamily: "'Playfair Display'", fontSize: 24, fontWeight: 800, color: t.pri }}>{total(tm)}</div>
          <div style={{ fontSize: 9, color: t.txtF }}>{Math.max(0, tgt - total(tm))} {L.toWin}</div></div>)}
      </div>
    </div></div>

    <div style={{ padding: "10px 12px 20px" }}>
      {adding ? <div style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 14, padding: 12, boxShadow: t.sh }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: t.pri, margin: "0 0 8px", fontFamily: "'Playfair Display'" }}>{editIdx !== null ? `${L.editHand} ${editIdx + 1}` : L.newHand}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {teams.map((tm, i) => { const other = hf.some((h, j) => j !== i && h?.cierre);
            return <div key={i} style={{ background: t.bgS, borderRadius: 10, padding: 10, border: `1px solid ${t.brd}` }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{tm.name}</p>
              <NI label={L.puras} value={hf[i]?.pura || 0} onChange={v => upHf(i, "pura", v)} min={0} hint={`(${cfg.pura})`} />
              <NI label={L.canastas} value={hf[i]?.canasta || 0} onChange={v => upHf(i, "canasta", v)} min={0} hint={`(${cfg.canasta})`} />
              <NI label={L.puntos} value={hf[i]?.puntos || 0} onChange={v => upHf(i, "puntos", v)} step={5} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: t.txtM, flex: 1 }}>{L.playedDead}</span>
                <B v={hf[i]?.muerto ? "pri" : "gh"} onClick={() => upHf(i, "muerto", true)} s={{ padding: "5px 12px", fontSize: 11, minHeight: 32 }}>Sí</B>
                <B v={!hf[i]?.muerto ? "err" : "gh"} onClick={() => upHf(i, "muerto", false)} s={{ padding: "5px 12px", fontSize: 11, minHeight: 32 }}>No</B></div>
              <div style={{ marginBottom: 6 }}>{hf[i]?.cierre
                ? <B onClick={() => { const u = [...hf]; u[i] = { ...u[i], cierre: false }; setHf(u) }} s={{ width: "100%", fontSize: 12, minHeight: 42 }}>✓ {L.closed}</B>
                : other ? <div style={{ fontSize: 10, color: t.txtF, textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>{L.notClosed}</div>
                : <B v="out" onClick={() => setCierre(i)} s={{ width: "100%", fontSize: 12, minHeight: 42 }}>{L.closed}</B>}</div>
              <div style={{ marginTop: 6, padding: "6px 8px", background: t.bg, borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: t.txtF }}>{L.sub}</span>
                <span style={{ fontFamily: "'Playfair Display'", fontSize: 16, fontWeight: 700, color: calc(hf[i]) >= 0 ? t.ok : t.err }}>{calc(hf[i]) >= 0 ? "+" : ""}{calc(hf[i])}</span></div>
            </div> })}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <B onClick={saveHand} disabled={!someoneClosed} s={{ flex: 1, padding: 10, minHeight: 48 }}>{someoneClosed ? L.save : L.chooseClosed}</B>
          <B v="gh" onClick={() => { setAdding(false); setHf([]); setEditIdx(null) }} s={{ minHeight: 48 }}>{L.cancel}</B></div>
      </div> : <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <B onClick={initHand} s={{ padding: "12px 24px", minHeight: 48 }}>{L.newHand}</B>
        {maxHands > 0 && <B v="err" onClick={() => setModal("undo")} s={{ minHeight: 48 }}>{L.undo}</B>}
        {redoHand && <B v="gh" onClick={() => { const r = clone(teams); r.forEach((tm, i) => { if (redoHand[i]) tm.hands.push(redoHand[i]); }); setTeams(r); setRedoHand(null); }} s={{ minHeight: 48 }}>{L.redo}</B>}</div>}
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}
// ═══════════════════════════════════════════════
// GENERALA
// ═══════════════════════════════════════════════
const GC = [
  { k: "uno", l: "Uno", n: 1, m: 5 }, { k: "dos", l: "Dos", n: 2, m: 10 }, { k: "tres", l: "Tres", n: 3, m: 15 },
  { k: "cuatro", l: "Cuatro", n: 4, m: 20 }, { k: "cinco", l: "Cinco", n: 5, m: 25 }, { k: "seis", l: "Seis", n: 6, m: 30 },
  { k: "esc", l: "Escalera", f: [20, 25] }, { k: "full", l: "Full", f: [30, 35] },
  { k: "poker", l: "Póker", f: [40, 45] }, { k: "gen", l: "Generala", f: [50] },
  { k: "doble", l: "Doble Gen.", f: [100] },
];
const gV = (c) => c.f ? c.f : Array.from({ length: Math.floor(c.m / c.n) }, (_, i) => (i + 1) * c.n);

function Generala({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [sStep, setSStep] = useState(0); const [pCount, setPCount] = useState(2);
  const [pNames, setPNames] = useState(["Jugador 1", "Jugador 2"]);
  const [ps, setPs] = useState([]); const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(null); const [modal, setModal] = useState(null);
  const [hist, setHist] = useState([]); const [showH, setShowH] = useState(false); const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const playerNameRefs = useRef([]);

  const handleCount = (n) => { setPCount(n); setPNames(Array.from({ length: n }, (_, i) => pNames[i] || `Jugador ${i + 1}`)) };

  useEffect(() => { ST.load("generala-game").then(d => { if (d?.ps?.length) { setPs(d.ps); setStarted(true); onContinueChange?.("generala") } setLoading(false); });
    ST.load("generala-hist").then(d => { if (d) setHist(d) }) }, []);
  useEffect(() => { if (started && ps.length) { ST.save("generala-game", { ps }); onContinueChange?.("generala") } }, [ps, started, onContinueChange]);
  useEffect(() => { if (hist.length) ST.save("generala-hist", hist) }, [hist]);

  const freshScores = () => { const fresh = {}; GC.forEach(c => { fresh[c.k] = null }); return fresh; };
  const startGame = () => { const finalNames = pNames.map((n, i) => n?.trim() || `Jugador ${i + 1}`); setPNames(finalNames); setPs(finalNames.map(n => ({ name: n, scores: freshScores() }))); setStarted(true); onContinueChange?.("generala") };
  const moveToNextGeneralaName = (i) => {
    const next = playerNameRefs.current[i + 1];
    if (next) { next.focus(); next.select?.(); }
    else startGame();
  };
  const setSc = (pi, k, v) => { const prev = clone(ps); const u = clone(ps); u[pi].scores[k] = v; setPs(u); setSheet(null); setToast({ text: `${u[pi].name} · ${GC.find(c => c.k === k)?.l}`, undo: () => setPs(prev) }); if (sounds) vib() };
  const tot = p => Object.values(p.scores).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const ren = (i, n) => { const u = clone(ps); u[i].name = n; setPs(u) };
  const allSame = (c) => { const v = ps.map(p => p.scores[c.k]); if (v.some(x => x === null || x === "x")) return false; return v.every(x => x === v[0]) && ps.length > 1 };
  const allDone = GC.every(c => ps.every(p => p.scores[c.k] !== null));
  const filledCount = ps.length > 0 ? Math.min(...ps.map(p => GC.filter(c => p.scores[c.k] !== null).length)) : 0;
  const turnCounts = ps.map(p => GC.filter(c => p.scores[c.k] !== null).length);
  const currentTurnIndex = ps.length ? Math.max(0, turnCounts.findIndex(c => c === filledCount)) : 0;
  const currentTurnName = ps[currentTurnIndex]?.name;
  const askTurnGuard = (pi) => {
    if (!ps.length || pi === currentTurnIndex) return true;
    const msg = L.turnWarning.replace('{name}', ps[pi]?.name || '').replace('{expected}', currentTurnName || '');
    return window.confirm(msg);
  };
  const turnsLeft = 11 - filledCount;
  const rematch = async () => { const next = ps.map(p => ({ name: p.name, scores: freshScores() })); setPs(next); setModal(null); setToast({ text: L.rematch, undo: null }); await ST.save("generala-game", { ps: next }); onContinueChange?.("generala") };
  const saveNew = async () => { const nextHist = [{ players: ps.map(p => ({ name: p.name, t: tot(p) })), date: fmtDate() }, ...hist];
    setHist(nextHist); await ST.save("generala-hist", nextHist); setStarted(false); setSStep(0); setModal(null); ST.del("generala-game"); onContinueChange?.(null) };
  const resetZ = async () => { setStarted(false); setSStep(0); setModal(null); setPs([]); await ST.del("generala-game"); onContinueChange?.(null) };
  const delH = i => setHist(h => h.filter((_, j) => j !== i));
  const doShare = () => shareResult("Generala", ps.map(p => `${p.name}: ${tot(p)}`));
  const goBack = () => { onContinueChange?.(started ? "generala" : null); onBack() };

  if (loading) return <div><Hdr title="Generala" emoji="🎲" onBack={goBack} /><div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (!started) return <div><Hdr title="Generala" emoji="🎲" onBack={goBack} />
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "20px 20px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      {sStep === 0 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howManyPlayers}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {[2, 3, 4, 5, 6].map(n => <B key={n} v={pCount === n ? "pri" : "gh"} onClick={() => handleCount(n)}
            s={{ width: 52, height: 52, fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</B>)}</div>
        <B onClick={() => setSStep(1)} s={{ width: "100%", padding: 12 }}>{L.next}</B></>}
      {sStep === 1 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
        {pNames.map((n, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
          <input autoFocus={i === 0} ref={el => { playerNameRefs.current[i] = el }} value={n} onChange={e => { const u = [...pNames]; u[i] = e.target.value; setPNames(u) }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextGeneralaName(i) } }} onFocus={e => e.target.select()} enterKeyHint={i === pNames.length - 1 ? "done" : "next"}
            style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} /></div>)}
        <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setSStep(0)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={startGame} s={{ flex: 1, padding: 12, fontSize: 15, minHeight: 52 }}>{L.start} 🎲</B></div>
        </div></>}
    </div></div>;

  return <div>
    <Hdr title="Generala" emoji="🎲" onBack={goBack} sub={turnsLeft > 0 ? `${turnsLeft} ${L.turnsLeft}` : `¡${L.done}!`} icons={<>
      <IcoBtn onClick={doShare} t={t}>📤</IcoBtn>
      <IcoBtn onClick={() => setModal("new")} t={t}>🔄</IcoBtn>
      {hist.length > 0 && <IcoBtn onClick={() => setShowH(!showH)} t={t}>📋</IcoBtn>}
    </>} />

    {modal && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
      <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
      <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
      {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
    </div></Modal>}

    {sheet && <Modal onClose={() => setSheet(null)}>
      <div style={{ background: t.card, borderRadius: 20, padding: 20, boxShadow: t.shH }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.pri, margin: "0 0 4px", fontFamily: "'Playfair Display'" }}>
          {ps[sheet.pi]?.name} — {GC.find(c => c.k === sheet.cat)?.l}</p>
        {sheet.pi !== currentTurnIndex && <p style={{ fontSize: 10, color: t.err, margin: "0 0 8px", opacity: 0.7 }}>⚠ {L.turnWarning.replace('{name}', ps[sheet.pi]?.name || '').replace('{expected}', currentTurnName || '')}</p>}
        <p style={{ fontSize: 11, color: t.txtM, margin: "0 0 12px" }}>{L.chooseScore}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {gV(GC.find(c => c.k === sheet.cat)).map(v => <B key={v} onClick={() => setSc(sheet.pi, sheet.cat, v)}
            s={{ fontSize: 18, padding: "14px 8px", fontFamily: "'Playfair Display'", fontWeight: 700 }}>{v}</B>)}
          <B v="err" onClick={() => setSc(sheet.pi, sheet.cat, "x")} s={{ fontSize: 16, padding: "14px 8px" }}>✗ {L.cross}</B>
          {ps[sheet.pi]?.scores[sheet.cat] !== null && <B v="gh" onClick={() => setSc(sheet.pi, sheet.cat, null)} s={{ fontSize: 12, padding: "14px 8px" }}>↩ {L.erase}</B>}
        </div>
        <B v="gh" onClick={() => setSheet(null)} s={{ width: "100%", marginTop: 10 }}>{L.cancel}</B>
      </div></Modal>}

    {showH && hist.length > 0 && <div style={{ margin: "8px 12px", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{L.hist}</p>
      {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${t.brd}30`, fontSize: 12 }}>
        <div style={{ flex: 1 }}>{h.players.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
        <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 14, padding: 2 }}>×</button></div>)}</div>}

    {allDone && <div style={{ textAlign: "center", padding: 14, margin: "8px 12px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
      <div style={{ fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{ps.reduce((b, p) => tot(p) > tot(b) ? p : b, ps[0]).name} {L.wins}!</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <B onClick={doShare} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>📤 {L.share}</B>
        <B onClick={rematch} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.rematch}</B>
        <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.yesNew}</B></div></div>}

    <div style={{ padding: "10px 8px 20px", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(300, 100 + ps.length * 76) }}>
        <div style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginBottom: 3, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ padding: 4, fontSize: 10, color: t.txtF }}></div>
          {ps.map((p, i) => <div key={i} style={{ padding: "8px 4px", textAlign: "center", background: t.card, borderRadius: "10px 10px 0 0", border: `1px solid ${t.brd}`, borderBottom: "none" }}>
            <EN name={p.name} onSave={n => ren(i, n)} sz={12} /></div>)}
        </div>
        {GC.map((cat, ci) => { const same = allSame(cat);
          return <div key={cat.k} style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginBottom: 3, position: "relative" }}>
            <div style={{ padding: "10px 6px", fontSize: 11, background: t.bgS, border: `1px solid ${t.brd}`,
              borderRadius: ci === 0 ? "8px 0 0 0" : ci === GC.length - 1 ? "0 0 0 8px" : 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontWeight: 600, color: t.pri, fontFamily: "'Playfair Display'", fontSize: 12 }}>{cat.l}</span>
              <span style={{ fontSize: 9, color: t.txtF }}>{cat.n ? `${L.upTo} ${cat.m}` : gV(cat).join("/")}</span></div>
            {ps.map((p, pi) => { const val = p.scores[cat.k];
              return <div key={pi} onClick={() => { if (val === null && !askTurnGuard(pi)) return; setSheet({ pi, cat: cat.k }) }}
                style={{ padding: 3, textAlign: "center", cursor: "pointer",
                  background: val === "x" ? t.errBg : val !== null ? t.okBg : t.card, border: `1px solid ${t.brd}`,
                  borderRadius: ci === 0 && pi === ps.length - 1 ? "0 8px 0 0" : ci === GC.length - 1 && pi === ps.length - 1 ? "0 0 8px 0" : 0,
                  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52, transition: "background .15s" }}>
                {val === "x" ? <span style={{ color: t.err, fontSize: 15, fontWeight: 700 }}>✗</span>
                  : val !== null ? <span style={{ fontFamily: "'Playfair Display'", fontSize: 17, fontWeight: 700, color: t.pri }}>{val}</span>
                  : <span style={{ color: t.txtF, fontSize: 13 }}>·</span>}
              </div> })}
            {same && <div style={{ position: "absolute", top: "50%", left: 102, right: 2, height: 2, background: t.pri, opacity: .35, pointerEvents: "none" }} />}
          </div> })}
        <div style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginTop: 6 }}>
          <div style={{ padding: "8px 5px", fontSize: 12, fontWeight: 800, color: t.pri, fontFamily: "'Playfair Display'",
            background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: "0 0 0 8px" }}>{L.total}</div>
          {ps.map((p, pi) => <div key={pi} style={{ padding: 5, textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`,
            borderRadius: pi === ps.length - 1 ? "0 0 8px 0" : 0 }}>
            <span style={{ fontFamily: "'Playfair Display'", fontSize: 24, fontWeight: 800, color: t.pri }}>{tot(p)}</span></div>)}
        </div>
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}
// ═══════════════════════════════════════════════
// HOME + APP
// ═══════════════════════════════════════════════
const GAMES = { truco: { name: "Truco", emoji: "🂡" },
  burako: { name: "Burako", emoji: "🃏" },
  generala: { name: "Generala", emoji: "🎲" } };

function App() {
  const [sel, setSel] = useState(null); const [dk, setDk] = useState(false);
  const [sounds, setSounds] = useState(true); const [lang, setLang] = useState("es");
  const [showSettings, setShowSettings] = useState(false); const [showFb, setShowFb] = useState(false);
  const [contGame, setContGame] = useState(null);
  const handleContinueChange = (game) => setContGame(game);
  const t = dk ? dark : light; const L = strings[lang]; const wakeLockRef = useRef(null);

  useEffect(() => {
    ST.load("app-sounds").then(d => { if (d !== null) setSounds(d) });
    ST.load("app-dark").then(d => { if (d !== null) setDk(d) });
    ST.load("app-lang").then(d => { if (d) setLang(d) });
    Promise.all([ST.load("truco-game"), ST.load("burako-game"), ST.load("generala-game")]).then(([tr, bk, ge]) => {
      if (tr?.started) setContGame("truco"); else if (bk?.teams?.length) setContGame("burako"); else if (ge?.ps?.length) setContGame("generala") });
    initWakeLock().then(l => { wakeLockRef.current = l }) }, []);

  useEffect(() => { ST.save("app-dark", dk) }, [dk]);
  useEffect(() => { ST.save("app-sounds", sounds) }, [sounds]);
  useEffect(() => { ST.save("app-lang", lang) }, [lang]);
  const tog = () => setDk(!dk);
  const toggleLang = () => setLang(l => l === "es" ? "en" : "es");

  const clearCurrent = async () => {
    if (!contGame) return;
    await ST.del(`${contGame}-game`);
    setContGame(null);
  };

  return <Ctx.Provider value={{ t, dk, tog, sounds, setSounds, L, lang }}>
    <div style={{ minHeight: "100vh", background: t.bg, color: t.txt, fontFamily: "'DM Sans',sans-serif", transition: "background .3s,color .3s" }}>
      <link href={FONTS} rel="stylesheet" />
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}*{box-sizing:border-box}::selection{background:${t.priL};color:#fff}
        @keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
        button:active{transform:scale(0.95)!important;opacity:0.85!important}
      `}</style>

      {sel === "truco" ? <Truco onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : sel === "burako" ? <Burako onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : sel === "generala" ? <Generala onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 20px 40px" }}>
          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <button onClick={() => setShowFb(true)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, width: 52, height: 52, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>💬</button>
            <button onClick={() => setShowSettings(true)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, width: 52, height: 52, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</button>
          </div>

          {showFb && <Modal onClose={() => setShowFb(false)}><div style={{ background: t.card, borderRadius: 16, padding: 24, boxShadow: t.shH }}>
            <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display'", color: t.pri, margin: "0 0 8px" }}>{L.feedback}</p>
            <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 12px" }}>{L.suggest}</p>
            <textarea placeholder={L.write} rows={4} style={{ width: "100%", background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 10, padding: 10, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}><B v="gh" onClick={() => setShowFb(false)} s={{ flex: 1 }}>{L.close}</B>
              <B onClick={() => setShowFb(false)} s={{ flex: 1 }}>{L.send}</B></div></div></Modal>}

          {showSettings && <Modal onClose={() => setShowSettings(false)}><div style={{ background: t.card, borderRadius: 16, padding: 24, boxShadow: t.shH }}>
            <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display'", color: t.pri, margin: "0 0 16px" }}>{L.settings}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.darkMode}</span>
              <button onClick={tog} style={{ background: dk ? t.pri : t.bgS, color: dk ? "#fff" : t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{dk ? "🌙 On" : "☀️ Off"}</button></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.soundVib}</span>
              <button onClick={() => setSounds(!sounds)} style={{ background: sounds ? t.pri : t.bgS, color: sounds ? "#fff" : t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{sounds ? "🔊 On" : "🔇 Off"}</button></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.lang}</span>
              <button onClick={toggleLang} style={{ background: t.bgS, color: t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{lang === "es" ? "🇦🇷 Español" : "🇺🇸 English"}</button></div>
            <B v="gh" onClick={() => setShowSettings(false)} s={{ width: "100%", marginTop: 8 }}>{L.close}</B>
          </div></Modal>}

          <h1 style={{ fontFamily: "'Playfair Display'", fontSize: 52, fontWeight: 800, color: t.pri, margin: "0 0 6px", letterSpacing: -1 }}>PUNTOS</h1>
          <div style={{ height: 2, width: 60, background: `linear-gradient(90deg, transparent, ${t.pri}, transparent)`, margin: "0 auto 28px" }} />
          
          {contGame && <div style={{ background: t.okBg, border: `1px solid ${t.ok}30`, borderRadius: 16, padding: "16px 18px", marginBottom: 20, maxWidth: 380, width: "100%", boxShadow: t.sh }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: t.card, border: `1px solid ${t.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{GAMES[contGame].emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, color: t.ok, fontWeight: 800, fontFamily: "'Playfair Display'" }}>{L.continueLast}</div>
                <div style={{ fontSize: 13, color: t.txt }}>{GAMES[contGame].name}</div>
              </div>
              <button onClick={clearCurrent} style={{ background: "none", border: "none", color: t.txtM, cursor: "pointer", fontSize: 18, padding: "4px 6px" }}>×</button>
            </div>
            <B onClick={() => setSel(contGame)} s={{ width: "100%", minHeight: 50 }}>{L.openNow}</B>
          </div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, width: "100%" }}>
            {Object.entries(GAMES).map(([key, g]) => <div key={key} onClick={() => setSel(key)}
              style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 16, padding: "22px 24px",
                display: "flex", alignItems: "center", gap: 18, cursor: "pointer", transition: "all .25s", boxShadow: t.sh }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: t.bgS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                border: `1px solid ${t.brd}` }}>{g.emoji}</div>
              <div style={{ flex: 1 }}><div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, color: t.pri }}>{g.name}</div></div>
              <div style={{ color: t.priL, fontSize: 18 }}>→</div>
            </div>)}
          </div>
          <p style={{ fontSize: 11, color: t.txtF, marginTop: 32 }}>{L.more}</p>
        </div>}
    </div>
  </Ctx.Provider>;
}
export default App;
