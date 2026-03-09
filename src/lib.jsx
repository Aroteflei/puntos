import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';

// ─── FONTS ─────────────────────────────────────
export const FONTS = "https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Instrument+Sans:wght@400;500;600;700&display=swap";
export const F = { serif: "'Instrument Serif', Georgia, serif", sans: "'Instrument Sans', system-ui, sans-serif" };

// ─── i18n ──────────────────────────────────────
export const strings = {
  es: {
    chooseGame: "Elegí tu juego", close: "Cerrar",
    contGame: "Continuar partida de", unfinished: "Tenés una partida sin terminar",
    howMany: "¿A cuántos puntos?", names: "Nombres", next: "Siguiente →", back: "← Atrás", start: "Empezar",
    newGame: "¿Nueva partida?", savesHist: "Se guarda en historial.", resetQ: "¿Reiniciar a cero?", losesAll: "Se pierde todo.",
    cancel: "Cancelar", yesNew: "Sí, nueva", reset: "Reiniciar", resetNoSave: "Reiniciar sin guardar",
    undoQ: "¿Deshacer última mano?", undoDesc: "Se borra la última mano.", undo: "Deshacer", yesUndo: "Sí, deshacer",
    remain: "faltan", toWin: "para ganar", wins: "ganan", winSg: "gana", winPl: "ganan", hist: "Historial", newHand: "+ Nueva mano", nuevaPartida: "Nueva partida",
    editHand: "Editar mano", save: "Guardar", chooseClosed: "Elegí quién cerró",
    puras: "Puras", canastas: "Canastas", puntos: "Puntos", playedDead: "¿Jugó muerto?", closed: "Cerró",
    notClosed: "No cerró", sub: "Subtotal", dropWith: "Baja con",
    changeGame: "Cambiar juego", howPlay: "¿Cómo juegan?", pairs: "2 Parejas", threePlayers: "3 Jugadores", target: "Objetivo",
    custom: "Personalizado", values: "Valores", penaltyDead: "Penalidad muerto",
    howManyPlayers: "¿Cuántos jugadores?", turnsLeft: "turnos restantes", done: "¡Terminado!",
    chooseScore: "Elegí el puntaje", cross: "Tachar", erase: "Borrar", share: "Compartir", shareResult: "Compartir resultado",
    category: "Categoría", total: "TOTAL",
    upTo: "Hasta", staircase: "Escalera", poker: "Póker", generala: "Generala", doubleGen: "Doble Gen.",
    served: "servida",
    turnWarningTitle: "Atención", turnWarning: "Le toca a {expected}. ¿Seguir?",
    rematch: "Revancha", continueLast: "Continuar última partida", openNow: "Abrir ahora", handNum: "Mano", redo: "Rehacer",
    whoClosed: "¿Quién cerró?", confirm: "Confirmar", yes: "Sí", no: "No", handSummary: "Resumen de la mano",
  },
  en: {
    chooseGame: "Choose your game", close: "Close",
    contGame: "Continue game of", unfinished: "You have an unfinished game",
    howMany: "How many points?", names: "Names", next: "Next →", back: "← Back", start: "Start",
    newGame: "New game?", savesHist: "Saves to history.", resetQ: "Reset to zero?", losesAll: "Loses everything.",
    cancel: "Cancel", yesNew: "Yes, new", reset: "Reset", resetNoSave: "Reset without saving",
    undoQ: "Undo last hand?", undoDesc: "Removes last hand.", undo: "Undo", yesUndo: "Yes, undo",
    remain: "left", toWin: "to win", wins: "win!", winSg: "wins", winPl: "win", hist: "History", newHand: "+ New hand", nuevaPartida: "New game",
    editHand: "Edit hand", save: "Save", chooseClosed: "Choose who closed",
    puras: "Pure runs", canastas: "Runs", puntos: "Points", playedDead: "Played dead hand?", closed: "Closed",
    notClosed: "Didn't close", sub: "Subtotal", dropWith: "Opens with",
    changeGame: "Change game", howPlay: "How do you play?", pairs: "2 Pairs", threePlayers: "3 Players", target: "Target",
    custom: "Custom", values: "Values", penaltyDead: "Dead hand penalty",
    howManyPlayers: "How many players?", turnsLeft: "turns left", done: "Done!",
    chooseScore: "Choose score", cross: "Cross out", erase: "Clear", share: "Share", shareResult: "Share result",
    category: "Category", total: "TOTAL",
    upTo: "Up to", staircase: "Straight", poker: "Four of a kind", generala: "Generala", doubleGen: "Double Gen.",
    served: "served",
    turnWarningTitle: "Heads up", turnWarning: "{expected}'s turn. Continue?",
    rematch: "Rematch", continueLast: "Continue last game", openNow: "Open now", handNum: "Hand", redo: "Redo",
    whoClosed: "Who closed?", confirm: "Confirm", yes: "Yes", no: "No", handSummary: "Hand summary",
  }
};

// ─── THEMES ────────────────────────────────────
export const light = {
  bg:"#FFFFFF",bgS:"#F6F6F4",card:"#FFFFFF",pri:"#1A5C52",priL:"#3D8B7A",priD:"#0E3A33",
  txt:"#1A1A1A",txtM:"#7A7A78",txtF:"#B5B5B2",brd:"#E8E8E6",
  err:"#C23B22",errBg:"#FDF0ED",ok:"#2D7A50",okBg:"#EDF7F1",
  sh:"none",shH:"0 8px 32px rgba(0,0,0,.08)",
};
export const dark = {
  bg:"#111111",bgS:"#1A1A1A",card:"#1A1A1A",pri:"#5DC4AD",priL:"#7DD8C4",priD:"#3A9A85",
  txt:"#E8E8E6",txtM:"#8A8A88",txtF:"#4A4A48",brd:"#2A2A28",
  err:"#E85C4A",errBg:"#2A1A18",ok:"#5CB87A",okBg:"#1A2A1E",
  sh:"none",shH:"0 8px 32px rgba(0,0,0,.3)",
};

// ─── CONTEXT ───────────────────────────────────
export const Ctx = createContext();
export const useApp = () => useContext(Ctx);

// ─── HELPERS ───────────────────────────────────
export const vib = (ms = 15) => { try { navigator?.vibrate?.(ms) } catch (e) {} };
export const vibWin = () => { try { navigator?.vibrate?.([50, 50, 50, 50, 100]) } catch (e) {} };
export async function initWakeLock() { try { if ("wakeLock" in navigator) return await navigator.wakeLock.request("screen"); } catch (e) {} return null; }

export const ST = {
  async save(k, v) {
    const json = JSON.stringify(v);
    try { localStorage.setItem(k, json) } catch (e) {}
    try { await window.storage?.set?.(k, json) } catch (e) {}
  },
  async load(k) {
    try { const r = await window.storage?.get?.(k); if (r?.value) return JSON.parse(r.value); } catch (e) {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  },
  async del(k) {
    try { localStorage.removeItem(k) } catch (e) {}
    try { await window.storage?.delete?.(k) } catch (e) {}
  },
};

export const bajadaReq = (score) => score >= 2000 ? 120 : score >= 1000 ? 90 : 50;
export const clone = (v) => JSON.parse(JSON.stringify(v));
export const fmtDate = () => { const d = new Date(); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}` };

// Share result - Instagram 4:5 card with multiple fallbacks
export async function shareResult(title, lines) {
  const text = title + "\n" + lines.join("\n");

  try {
    const W = 1080, H = 1350;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // Background
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);

    // Top accent bar
    ctx.fillStyle = "#1A5C52"; ctx.fillRect(0, 0, W, 6);

    // "PUNTOS" logo
    ctx.textAlign = "center";
    ctx.fillStyle = "#1A5C52";
    ctx.font = "72px Georgia, serif";
    ctx.fillText("PUNTOS", W / 2, 140);

    // Subtitle
    ctx.fillStyle = "#B5B5B2";
    ctx.font = "500 14px system-ui, sans-serif";
    const sub = "MARCADOR";
    const subSpaced = sub.split("").join("  ");
    ctx.fillText(subSpaced, W / 2, 170);

    // Game title
    ctx.fillStyle = "#1A1A1A";
    ctx.font = "42px Georgia, serif";
    ctx.fillText(title, W / 2, 260);

    // Separator
    ctx.strokeStyle = "#E8E8E6"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - 80, 290); ctx.lineTo(W / 2 + 80, 290); ctx.stroke();

    // Parse player:score pairs
    const parsed = lines.map(line => {
      const idx = line.lastIndexOf(":");
      if (idx < 0) return { name: line, score: "" };
      return { name: line.substring(0, idx).trim(), score: line.substring(idx + 1).trim() };
    });

    const scores = parsed.map(p => parseInt(p.score) || 0);
    const maxSc = Math.max(...scores);

    // Score card
    const rowH = 88;
    const cardW = 740;
    const cardPad = 28;
    const cardH = parsed.length * rowH + cardPad * 2;
    const cardX = (W - cardW) / 2;
    const cardY = 340;

    // Card bg with rounded corners
    const rr = (x, y, w, h, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    rr(cardX, cardY, cardW, cardH, 16);
    ctx.fillStyle = "#FAFAF8"; ctx.fill();
    ctx.strokeStyle = "#E8E8E6"; ctx.lineWidth = 1; ctx.stroke();

    parsed.forEach((p, i) => {
      const rY = cardY + cardPad + i * rowH;
      const isWin = scores[i] === maxSc && maxSc > 0;

      // Row separator
      if (i > 0) {
        ctx.strokeStyle = "#E8E8E6"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(cardX + 28, rY); ctx.lineTo(cardX + cardW - 28, rY); ctx.stroke();
      }

      // Winner dot
      if (isWin) {
        ctx.fillStyle = "#1A5C52";
        ctx.beginPath(); ctx.arc(cardX + 20, rY + rowH / 2, 5, 0, Math.PI * 2); ctx.fill();
      }

      // Name
      ctx.fillStyle = isWin ? "#1A5C52" : "#1A1A1A";
      ctx.font = `${isWin ? 600 : 400} 30px Georgia, serif`;
      ctx.textAlign = "left";
      ctx.fillText(p.name, cardX + 40, rY + rowH / 2 + 10, cardW - 200);

      // Score
      ctx.fillStyle = isWin ? "#1A5C52" : "#7A7A78";
      ctx.font = `${isWin ? 700 : 400} 40px Georgia, serif`;
      ctx.textAlign = "right";
      ctx.fillText(p.score, cardX + cardW - 36, rY + rowH / 2 + 14);
    });

    // Date/time
    const now = new Date();
    const ds = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const ts = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = "#B5B5B2";
    ctx.font = "500 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${ds} · ${ts}`, W / 2, H - 80);

    // Watermark
    ctx.fillStyle = "#E8E8E6";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("puntos app", W / 2, H - 44);

    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const file = new File([blob], "marcador.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ title, files: [file] }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }

  try { if (navigator.share) { await navigator.share({ title, text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); alert("Copiado ✓"); return; } catch (e) {}
  prompt("Copiá el resultado:", text);
}

// ─── UI ATOMS ──────────────────────────────────
export function B({ children, onClick, disabled, v = "pri", s, ...r }) {
  const { t, sounds } = useApp();
  const vars = { pri: { background: t.pri, color: "#fff", border: "none" },
    out: { background: "transparent", color: t.pri, border: `1.5px solid ${t.pri}` },
    err: { background: "transparent", color: t.err, border: `1.5px solid ${t.err}` },
    gh: { background: t.bgS, color: t.txt, border: `1px solid ${t.brd}` } };
  const handle = () => { if (!disabled && onClick) { if (sounds) vib(); onClick() } };
  return <button onClick={handle} disabled={disabled} style={{ borderRadius: 6, padding: "12px 20px", minHeight: 44, fontSize: 14, fontWeight: 600,
    letterSpacing: .2, fontFamily: F.sans, cursor: disabled ? "default" : "pointer", transition: "opacity .15s", opacity: disabled ? .35 : 1, touchAction: "manipulation", ...vars[v], ...s }} {...r}>{children}</button>;
}

export function EN({ name, onSave, sz = 18, fw, ff }) {
  const { t } = useApp(); const [ed, setEd] = useState(false); const [val, setVal] = useState(name);
  const font = ff || F.serif;
  useEffect(() => setVal(name), [name]);
  if (ed) return <input autoFocus autoCapitalize="words" value={val} onChange={e => setVal(e.target.value)} onBlur={() => { onSave(val); setEd(false) }}
    onKeyDown={e => { if (e.key === "Enter") { onSave(val); setEd(false) } }}
    style={{ background: "transparent", border: "none", borderBottom: `1.5px solid ${t.pri}`, color: t.txt, fontSize: sz, fontWeight: fw || 400, fontFamily: font,
      borderRadius: 0, padding: "2px 0", outline: "none", width: "100%", textTransform: "capitalize" }} />;
  return <span onClick={() => setEd(true)} style={{ fontSize: sz, fontWeight: fw || 400, color: t.txt, cursor: "pointer",
    fontFamily: font, textDecoration: "underline dashed", textDecorationColor: t.brd, textUnderlineOffset: 3, textTransform: "capitalize" }}>{name}</span>;
}

export const IcoBtn = ({ onClick, children, t }) => <button onClick={onClick} style={{ background: "transparent", border: `1px solid ${t.brd}`, color: t.txt,
  borderRadius: 6, width: 40, height: 40, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>{children}</button>;

export function Hdr({ title, emoji, onBack, sub, icons }) {
  const { t } = useApp();
  return <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${t.brd}` }}>
    <button onClick={onBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 15, fontFamily: F.sans, fontWeight: 500,
      cursor: "pointer", padding: "8px 12px", touchAction: "manipulation" }}>←</button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontFamily: F.serif, fontSize: 20, color: t.pri, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: t.txtM, letterSpacing: .3 }}>{sub}</p>}
    </div>
    {icons && <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>{icons}</div>}
  </div>;
}

export function NI({ label, value, onChange, step = 1, min, hint }) {
  const { t } = useApp();
  const [raw, setRaw] = useState(String(value)); useEffect(() => setRaw(String(value)), [value]);
  const commit = (v) => { const n = v === "" || v === "-" ? 0 : Number(v); onChange(min !== undefined ? Math.max(min, n) : n) };
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
    <div><span style={{ fontSize: 13, fontFamily: F.sans, fontWeight: 500 }}>{label}</span>{hint && <span style={{ fontSize: 10, color: t.txtF, marginLeft: 4 }}>{hint}</span>}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <button onClick={() => onChange(min !== undefined ? Math.max(min, value - step) : value - step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 40, height: 40, borderRadius: 6, cursor: "pointer", fontSize: 16, fontFamily: F.sans, fontWeight: 500, touchAction: "manipulation" }}>−</button>
      <input type="number" value={raw} onChange={e => setRaw(e.target.value)} onBlur={() => commit(raw)} onKeyDown={e => { if (e.key === "Enter") commit(raw) }} onFocus={e => e.target.select()}
        style={{ width: 60, minHeight: 40, textAlign: "center", background: "transparent", border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 6, padding: 2, fontSize: 14, fontFamily: F.sans, outline: "none" }} />
      <button onClick={() => onChange(value + step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 40, height: 40, borderRadius: 6, cursor: "pointer", fontSize: 16, fontFamily: F.sans, fontWeight: 500, touchAction: "manipulation" }}>+</button>
    </div></div>;
}

export function Modal({ children, onClose }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.25)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeUp .2s ease" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%", animation: "scaleIn .2s ease" }}>{children}</div></div>;
}

export function UndoBar({ toast, onUndo, onClose }) {
  const { t, L } = useApp();
  const [fading, setFading] = useState(false);
  useEffect(() => {
    if (!toast) { setFading(false); return; }
    setFading(false);
    const fadeId = setTimeout(() => setFading(true), 4500);
    const closeId = setTimeout(() => onClose?.(), 5000);
    return () => { clearTimeout(fadeId); clearTimeout(closeId); };
  }, [toast, onClose]);
  if (!toast) return null;
  return <div style={{ position: "fixed", left: 12, right: 12, bottom: 24, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", maxWidth: 320, width: "auto", background: t.txt, boxShadow: t.shH, borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, animation: "fadeUp .2s ease", transition: "opacity .5s ease", opacity: fading ? 0 : 1 }}>
      <div style={{ fontSize: 12, color: t.bg, whiteSpace: "nowrap", fontFamily: F.sans, fontWeight: 500 }}>{toast.text}</div>
      {toast.redo && <button onClick={() => { toast.redo?.(); onClose?.(); }} style={{ background: "transparent", border: `1px solid rgba(255,255,255,.2)`, color: t.bg, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F.sans, whiteSpace: "nowrap" }}>{L.redo}</button>}
      {toast.undo && <button onClick={() => { onUndo?.(); onClose?.(); }} style={{ background: "transparent", border: `1px solid rgba(255,255,255,.2)`, color: t.bg, borderRadius: 4, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: F.sans, whiteSpace: "nowrap" }}>{L.undo}</button>}
    </div>
  </div>;
}

// ─── TALLY (hand-drawn, stable offsets) ────────
export function Tally({ count, color, divAt }) {
  const s = 44, p = 4, gap = 8;
  const offsets = useMemo(() => { const arr = []; for (let i = 0; i < 60; i++) arr.push((Math.random() - .5) * 1.5); return arr; }, [count]);
  let oi = 0; const r = () => offsets[oi++ % offsets.length];
  const els = []; let drawn = 0, divDone = !divAt;
  const sq = (k) => <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ animation: "popIn .25s ease" }}>
    <rect x={p + r()} y={p + r()} width={s - p * 2 + r()} height={s - p * 2 + r()} fill="none" stroke={color} strokeWidth="2" rx="1" opacity=".7" />
    <line x1={p + 1 + r()} y1={s - p - 1 + r()} x2={s - p - 1 + r()} y2={p + 1 + r()} stroke={color} strokeWidth="2" opacity=".7" /></svg>;
  const part = (n, k) => { const l = [];
    if (n >= 1) l.push(<line key="l" x1={p + r()} y1={p + r()} x2={p + r()} y2={s - p + r()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 2) l.push(<line key="b" x1={p + r()} y1={s - p + r()} x2={s - p + r()} y2={s - p + r()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 3) l.push(<line key="r" x1={s - p + r()} y1={s - p + r()} x2={s - p + r()} y2={p + r()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 4) l.push(<line key="t" x1={s - p + r()} y1={p + r()} x2={p + r()} y2={p + r()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    return <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{l}</svg> };
  const div = <div key="div" style={{ display: "flex", alignItems: "center", gap: 0, margin: "8px 0", width: "100%", padding: "4px 0" }}>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${color})`, opacity: .4 }} />
    <span style={{ fontSize: 8, color, fontWeight: 600, letterSpacing: 2, padding: "0 8px", whiteSpace: "nowrap", fontFamily: F.sans }}>BUENAS</span>
    <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${color})`, opacity: .4 }} /></div>;
  while (drawn < count) { const rem = count - drawn, batch = Math.min(5, rem);
    if (!divDone && drawn < divAt && drawn + batch > divAt) { const b = divAt - drawn; if (b > 0) { els.push(b === 5 ? sq(`s${drawn}`) : part(b, `p${drawn}`)); drawn += b } els.push(div); divDone = true; continue }
    if (!divDone && drawn + batch === divAt) { els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch; els.push(div); divDone = true; continue }
    els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch }
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap, minHeight: 24, padding: "2px 0" }}>
    {els.length > 0 ? els : <span style={{ color, opacity: .3, fontSize: 12 }}>—</span>}</div>;
}
