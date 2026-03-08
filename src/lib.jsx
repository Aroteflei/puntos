import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';

// ─── FONTS ─────────────────────────────────────
export const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap";

// ─── i18n ──────────────────────────────────────
export const strings = {
  es: {
    chooseGame: "Elegí tu juego", close: "Cerrar",
    contGame: "Continuar partida de", unfinished: "Tenés una partida sin terminar",
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
    whoClosed: "¿Quién cerró?", confirm: "Confirmar", yes: "Sí", no: "No", handSummary: "Resumen de la mano",
  },
  en: {
    chooseGame: "Choose your game", close: "Close",
    contGame: "Continue game of", unfinished: "You have an unfinished game",
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
    whoClosed: "Who closed?", confirm: "Confirm", yes: "Yes", no: "No", handSummary: "Hand summary",
  }
};

// ─── THEMES ────────────────────────────────────
export const light = {
  bg:"#F7F3EE",bgS:"#F0E8DE",card:"#FFF",pri:"#6B4E30",priL:"#B4946A",priD:"#3C2A15",
  txt:"#2C1810",txtM:"#9C8B7A",txtF:"#C4B4A0",brd:"#E8E0D6",
  err:"#C0392B",errBg:"#FCEAE8",ok:"#27764E",okBg:"#E8F5ED",
  sh:"0 1px 6px rgba(80,50,20,.06)",shH:"0 4px 16px rgba(80,50,20,.12)",
};
export const dark = {
  bg:"#1A1714",bgS:"#242018",card:"#2C2720",pri:"#C49A6C",priL:"#DEB98E",priD:"#8B6B45",
  txt:"#E8E0D6",txtM:"#9C8E7E",txtF:"#5C5248",brd:"#3A3530",
  err:"#E8695E",errBg:"#3A2220",ok:"#5CB880",okBg:"#1E2E22",
  sh:"0 1px 6px rgba(0,0,0,.2)",shH:"0 4px 16px rgba(0,0,0,.3)",
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

// Share result - with multiple fallbacks
export async function shareResult(title, lines) {
  const text = title + "\n" + lines.join("\n");

  try {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 630;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#F7F3EE"; ctx.fillRect(0, 0, c.width, c.height);

    const wrap = (ct, str, maxW) => {
      const words = String(str).split(" "); const out = []; let line = "";
      for (let i = 0; i < words.length; i++) {
        const test = line ? (line + " " + words[i]) : words[i];
        if (ct.measureText(test).width <= maxW) line = test;
        else { if (line) out.push(line); line = words[i]; }
      }
      if (line) out.push(line); return out;
    };

    ctx.fillStyle = "#2C1810"; ctx.font = "800 72px system-ui, -apple-system, sans-serif";
    const titleLines = wrap(ctx, title, 1040);
    let y = 140;
    titleLines.slice(0, 2).forEach((ln) => { const w = ctx.measureText(ln).width; ctx.fillText(ln, (c.width - w) / 2, y); y += 84; });
    ctx.strokeStyle = "#D8CFC5"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(140, y + 10); ctx.lineTo(c.width - 140, y + 10); ctx.stroke(); y += 70;
    ctx.fillStyle = "#6B4E30"; ctx.font = "600 44px system-ui, -apple-system, sans-serif";
    for (let i = 0; i < lines.length && i < 8; i++) {
      const wrapped = wrap(ctx, lines[i], 980);
      for (let j = 0; j < wrapped.length && j < 8; j++) { const ln = wrapped[j]; const w = ctx.measureText(ln).width; ctx.fillText(ln, (c.width - w) / 2, y); y += 58; }
    }
    ctx.fillStyle = "#B9AA9A"; ctx.font = "500 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("puntos", c.width - 180, c.height - 48);

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
  const vars = { pri: { background: t.pri, color: "#fff", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,.1)" },
    out: { background: "transparent", color: t.pri, border: `1.5px solid ${t.pri}`, boxShadow: "none" },
    err: { background: "transparent", color: t.err, border: `1.5px solid ${t.err}`, boxShadow: "none" },
    gh: { background: t.bgS, color: t.txt, border: `1px solid ${t.brd}`, boxShadow: "none" } };
  const handle = () => { if (!disabled && onClick) { if (sounds) vib(); onClick() } };
  return <button onClick={handle} disabled={disabled} style={{ borderRadius: 12, padding: "12px 18px", minHeight: 44, fontSize: 15, fontWeight: 700,
    fontFamily: "'DM Sans'", cursor: disabled ? "default" : "pointer", transition: "all .15s", opacity: disabled ? .35 : 1, touchAction: "manipulation", ...vars[v], ...s }} {...r}>{children}</button>;
}

export function EN({ name, onSave, sz = 18 }) {
  const { t } = useApp(); const [ed, setEd] = useState(false); const [val, setVal] = useState(name);
  useEffect(() => setVal(name), [name]);
  if (ed) return <input autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={() => { onSave(val); setEd(false) }}
    onKeyDown={e => { if (e.key === "Enter") { onSave(val); setEd(false) } }}
    style={{ background: t.bgS, border: `1.5px solid ${t.pri}`, color: t.txt, fontSize: sz, fontWeight: 600, fontFamily: "'Playfair Display'",
      borderRadius: 8, padding: "2px 8px", outline: "none", width: "100%" }} />;
  return <span onClick={() => setEd(true)} style={{ fontSize: sz, fontWeight: 600, color: t.txt, cursor: "pointer",
    fontFamily: "'Playfair Display'" }}>{name} <span style={{ fontSize: 10, color: t.txtF }}>✎</span></span>;
}

export const IcoBtn = ({ onClick, children, t }) => <button onClick={onClick} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt,
  borderRadius: 12, width: 48, height: 48, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>{children}</button>;

export function Hdr({ title, emoji, onBack, sub, icons }) {
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

export function NI({ label, value, onChange, step = 1, min, hint }) {
  const { t } = useApp();
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

export function Modal({ children, onClose }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%" }}>{children}</div></div>;
}

export function UndoBar({ toast, onUndo, onClose }) {
  const { t, L } = useApp();
  useEffect(() => { if (!toast) return; const id = setTimeout(() => onClose?.(), 2500); return () => clearTimeout(id); }, [toast, onClose]);
  if (!toast) return null;
  return <div style={{ position: "fixed", left: 12, right: 12, top: 68, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", maxWidth: 320, width: "auto", background: t.card, border: `1px solid ${t.brd}`, boxShadow: t.shH, borderRadius: 10, padding: "5px 10px", display: "flex", alignItems: "center", gap: 8, opacity: 0.95 }}>
      <div style={{ fontSize: 12, color: t.txtM, whiteSpace: "nowrap" }}>{toast.text}</div>
      {toast.redo && <button onClick={() => { toast.redo?.(); onClose?.(); }} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.redo}</button>}
      {toast.undo && <button onClick={() => { onUndo?.(); onClose?.(); }} style={{ background: t.pri, border: "none", color: "#fff", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.undo}</button>}
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
    <rect x={p + r()} y={p + r()} width={s - p * 2 + r()} height={s - p * 2 + r()} fill="none" stroke={color} strokeWidth="2.2" rx="1" opacity=".8" />
    <line x1={p + 1 + r()} y1={s - p - 1 + r()} x2={s - p - 1 + r()} y2={p + 1 + r()} stroke={color} strokeWidth="2.2" opacity=".8" /></svg>;
  const part = (n, k) => { const l = [];
    if (n >= 1) l.push(<line key="l" x1={p + r()} y1={p + r()} x2={p + r()} y2={s - p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 2) l.push(<line key="b" x1={p + r()} y1={s - p + r()} x2={s - p + r()} y2={s - p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 3) l.push(<line key="r" x1={s - p + r()} y1={s - p + r()} x2={s - p + r()} y2={p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if (n >= 4) l.push(<line key="t" x1={s - p + r()} y1={p + r()} x2={p + r()} y2={p + r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    return <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{l}</svg> };
  const div = <div key="div" style={{ display: "flex", alignItems: "center", gap: 0, margin: "8px 0", width: "100%", padding: "4px 0" }}>
    <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, transparent, #C0392B)", borderRadius: 2 }} />
    <span style={{ fontSize: 9, color: "#C0392B", fontWeight: 700, letterSpacing: 1.5, padding: "0 8px", whiteSpace: "nowrap" }}>BUENAS</span>
    <div style={{ flex: 1, height: 2, background: "linear-gradient(270deg, transparent, #C0392B)", borderRadius: 2 }} /></div>;
  while (drawn < count) { const rem = count - drawn, batch = Math.min(5, rem);
    if (!divDone && drawn < divAt && drawn + batch > divAt) { const b = divAt - drawn; if (b > 0) { els.push(b === 5 ? sq(`s${drawn}`) : part(b, `p${drawn}`)); drawn += b } els.push(div); divDone = true; continue }
    if (!divDone && drawn + batch === divAt) { els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch; els.push(div); divDone = true; continue }
    els.push(batch === 5 ? sq(`s${drawn}`) : part(batch, `p${drawn}`)); drawn += batch }
  return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap, minHeight: 24, padding: "2px 0" }}>
    {els.length > 0 ? els : <span style={{ color, opacity: .3, fontSize: 12 }}>—</span>}</div>;
}
