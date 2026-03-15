import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vibFor, F, B, EN, Hdr, Modal, UndoBar, HomeIcon } from '../lib.jsx';

const GC = [
  { k: "uno", l: "Uno", n: 1, m: 5 }, { k: "dos", l: "Dos", n: 2, m: 10 }, { k: "tres", l: "Tres", n: 3, m: 15 },
  { k: "cuatro", l: "Cuatro", n: 4, m: 20 }, { k: "cinco", l: "Cinco", n: 5, m: 25 }, { k: "seis", l: "Seis", n: 6, m: 30 },
  { k: "esc", l: "Escalera", f: [20, 25] }, { k: "full", l: "Full", f: [30, 35] },
  { k: "poker", l: "Póker", f: [40, 45] }, { k: "gen", l: "Generala", f: [50] },
  { k: "doble", l: "Doble Gen.", f: [100] },
];
const gV = (c) => c.f ? c.f : Array.from({ length: Math.floor(c.m / c.n) }, (_, i) => (i + 1) * c.n);

// ─── DICE FACE SVG ─────────────────────────────
function DiceFace({ n, size = 20, color }) {
  const dots = {
    1: [[10,10]], 2: [[5,5],[15,15]], 3: [[5,5],[10,10],[15,15]],
    4: [[5,5],[15,5],[5,15],[15,15]], 5: [[5,5],[15,5],[10,10],[5,15],[15,15]],
    6: [[5,5],[15,5],[5,10],[15,10],[5,15],[15,15]],
  };
  const s = size / 20;
  const r = 1.8 * s;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={2.5 * s} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
      {(dots[n] || []).map(([x, y], i) => (
        <circle key={i} cx={x * s} cy={y * s} r={r} fill={color} />
      ))}
    </svg>
  );
}

// ─── COMBO BADGE ────────────────────────────────
const COMBO_LABELS = { esc: "E", full: "F", poker: "P", gen: "G", doble: "2G" };
function ComboBadge({ k, color, t }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
      background: t?.bgS || "transparent", border: `1px solid ${t?.brd || color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600, color, fontFamily: F.sans,
    }}>{COMBO_LABELS[k]}</div>
  );
}

// ─── Avatar: always show player number ───
const isDefaultName = (name) => /^Jugador\s+\d+$/i.test(name);

function PopNum({ value, style, t }) {
  const prevRef = useRef(value);
  const [popKey, setPopKey] = useState(0);
  const [floatDelta, setFloatDelta] = useState(null);
  useEffect(() => {
    if (value !== prevRef.current) {
      const delta = value - prevRef.current;
      prevRef.current = value;
      setPopKey(k => k + 1);
      setFloatDelta(delta);
      const id = setTimeout(() => setFloatDelta(null), 600);
      return () => clearTimeout(id);
    }
  }, [value]);
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span key={popKey} style={{ ...style, animation: popKey ? "scorePop .3s ease-out" : undefined, display: "inline-block" }}>{value}</span>
      {floatDelta !== null && <span key={`f${popKey}`} style={{
        position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
        fontFamily: F.sans, fontSize: 14, fontWeight: 700, pointerEvents: "none", whiteSpace: "nowrap",
        color: floatDelta > 0 ? t.ok : t.err,
        animation: "floatUp .6s ease-out forwards",
      }}>{floatDelta > 0 ? `+${floatDelta}` : floatDelta}</span>}
    </span>
  );
}

function Generala({ onBack, onContinueChange, onChangeGame }) {
  const { t, dk, tog, sounds, L } = useApp();
  const [sStep, setSStep] = useState(0); const [pCount, setPCount] = useState(2);
  const [pNames, setPNames] = useState(["Jugador 1", "Jugador 2"]);
  const [ps, setPs] = useState([]); const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(null); const [modal, setModal] = useState(null);
  const [hist, setHist] = useState([]); const [showH, setShowH] = useState(false); const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [turnGuard, setTurnGuard] = useState(true);
  const [showHints, setShowHints] = useState(true);
  const playerNameRefs = useRef([]);

  const handleCount = (n) => { setPCount(n); setPNames(Array.from({ length: n }, (_, i) => pNames[i] || `Jugador ${i + 1}`)) };

  useEffect(() => { ST.load("generala-game").then(d => { if (d?.ps?.length) { setPs(d.ps); setStarted(true); onContinueChange?.("generala"); if (d.turnGuard === false) setTurnGuard(false); if (d.showHints === false) setShowHints(false); } setLoading(false); });
    ST.load("generala-hist").then(d => { if (d) setHist(d) }) }, []);
  useEffect(() => { if (started && ps.length) { ST.save("generala-game", { ps, turnGuard, showHints }); onContinueChange?.("generala") } }, [ps, started, turnGuard, showHints, onContinueChange]);
  useEffect(() => { if (hist.length) ST.save("generala-hist", hist) }, [hist]);

  const freshScores = () => { const fresh = {}; GC.forEach(c => { fresh[c.k] = null }); return fresh; };
  const startGame = () => { const finalNames = pNames.map((n, i) => n?.trim() || `Jugador ${i + 1}`); setPNames(finalNames); setPs(finalNames.map(n => ({ name: n, scores: freshScores() }))); setStarted(true); onContinueChange?.("generala") };
  const moveToNextGeneralaName = (i) => {
    const next = playerNameRefs.current[i + 1];
    if (next) { next.focus(); next.select?.(); }
    else startGame();
  };
  const setSc = (pi, k, v) => { const prev = clone(ps); const u = clone(ps); u[pi].scores[k] = v; setPs(u); setSheet(null); setToast({ text: `${u[pi].name} · ${GC.find(c => c.k === k)?.l}`, undo: () => setPs(prev) }); if (sounds) vibFor(1) };
  const tot = p => Object.values(p.scores).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const ren = (i, n) => { const u = clone(ps); u[i].name = n; setPs(u) };

  // Strikethrough: show when all players have same value (including all "x")
  const allSame = (c) => {
    const v = ps.map(p => p.scores[c.k]);
    if (v.some(x => x === null)) return false;
    if (ps.length <= 1) return false;
    return v.every(x => x === v[0]);
  };

  const allDone = GC.every(c => ps.every(p => p.scores[c.k] !== null));
  const filledCount = ps.length > 0 ? Math.min(...ps.map(p => GC.filter(c => p.scores[c.k] !== null).length)) : 0;
  const turnCounts = ps.map(p => GC.filter(c => p.scores[c.k] !== null).length);
  const currentTurnIndex = ps.length ? Math.max(0, turnCounts.findIndex(c => c === filledCount)) : 0;
  const currentTurnName = ps[currentTurnIndex]?.name;
  const askTurnGuard = (pi) => {
    if (!turnGuard || !ps.length || pi === currentTurnIndex) return true;
    const msg = L.turnWarning.replace('{name}', ps[pi]?.name || '').replace('{expected}', currentTurnName || '');
    return window.confirm(msg);
  };
  const turnsLeft = 11 - filledCount;

  const saveToHistory = async () => {
    if (ps.some(p => Object.values(p.scores).some(v => v !== null))) {
      const nextHist = [{ players: ps.map(p => ({ name: p.name, t: tot(p) })), date: fmtDate() }, ...hist];
      setHist(nextHist); await ST.save("generala-hist", nextHist);
    }
  };

  const revancha = async () => {
    await saveToHistory();
    const next = ps.map(p => ({ name: p.name, scores: freshScores() }));
    setPs(next); setModal(null);
    setToast({ text: L.revancha, undo: null });
    await ST.save("generala-game", { ps: next }); onContinueChange?.("generala");
  };

  const nuevaPartidaSetup = async () => {
    await saveToHistory();
    resetZ();
  };

  const nuevaPartida = async () => {
    await saveToHistory();
    const next = ps.map(p => ({ name: p.name, scores: freshScores() }));
    setPs(next); setModal(null);
    setToast({ text: L.nuevaPartida, undo: null });
    await ST.save("generala-game", { ps: next }); onContinueChange?.("generala");
  };

  const resetZ = async () => { setStarted(false); setSStep(0); setModal(null); setPs([]); await ST.del("generala-game"); onContinueChange?.(null) };
  const delH = i => setHist(h => h.filter((_, j) => j !== i));
  const doShare = async () => {
    // Use exact app theme colors
    const pri = "#1A5C52", priL = "#3D8B7A", bgS = "#F6F6F4", brd = "#E8E8E6", err = "#C23B22", txtM = "#7A7A78", txtF = "#B5B5B2";
    const W = 1080, pad = 40, gap = 8;
    const catColW = 200;
    const colW = Math.floor((W - pad * 2 - catColW - gap * ps.length) / ps.length);
    const gridW = catColW + gap + ps.length * (colW + gap) - gap;
    const rowH = 96, headerH = 120, totalH = 100;
    const gridH = headerH + gap + GC.length * (rowH + gap) + gap + totalH;

    // Determine if there's a winner to size the canvas correctly
    const maxT = Math.max(...ps.map(p => tot(p)));
    const winnerP = allDone && ps.filter(p => tot(p) === maxT).length === 1 ? ps.find(p => tot(p) === maxT) : null;
    const headerSection = winnerP ? 200 : 140;
    const H = headerSection + gridH + 100;

    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // Rounded rect helper
    const rr = (x, y, w, h, r) => {
      ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    const fillRR = (x, y, w, h, r, color) => { rr(x, y, w, h, r); ctx.fillStyle = color; ctx.fill(); };
    const strokeRR = (x, y, w, h, r, color, lw) => { rr(x, y, w, h, r); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke(); };

    // App background
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);

    // Top bar (like the app header)
    fillRR(0, 0, W, 6, 0, pri);

    // Winner banner or PUNTOS title
    let headerBottom = 100;

    if (winnerP) {
      // Winner banner (like the app's gradient banner)
      const priD = "#0E3A33";
      const bannerH = 160;
      const bannerG = ctx.createLinearGradient(0, 6, W, bannerH);
      bannerG.addColorStop(0, priD); bannerG.addColorStop(0.5, pri); bannerG.addColorStop(1, priL);
      ctx.fillStyle = bannerG; ctx.fillRect(0, 6, W, bannerH);

      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      ctx.font = "40px serif"; ctx.fillText("🏆", W / 2, 60);
      ctx.font = "600 14px system-ui, sans-serif"; ctx.globalAlpha = 0.6;
      ctx.fillText("V I C T O R I A", W / 2, 90); ctx.globalAlpha = 1;
      ctx.font = "700 36px Georgia, serif";
      ctx.fillText(`¡${winnerP.name}!`, W / 2, 130);
      ctx.font = "500 18px system-ui, sans-serif"; ctx.globalAlpha = 0.75;
      ctx.fillText(`${tot(winnerP)} puntos`, W / 2, 156); ctx.globalAlpha = 1;
      headerBottom = bannerH + 30;
    } else {
      ctx.textAlign = "center"; ctx.fillStyle = pri;
      ctx.font = "600 42px Georgia, serif"; ctx.fillText("PUNTOS", W / 2, 70);
      ctx.fillStyle = txtF; ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText("G E N E R A L A", W / 2, 100);
      headerBottom = 120;
    }

    // Grid area
    const gx = (W - gridW) / 2, gy = headerBottom + 20;

    // Player header row - numbered avatars like the app
    ps.forEach((p, pi) => {
      const cx = gx + catColW + gap + pi * (colW + gap) + colW / 2;
      const cy = gy + 10;
      const isWin = tot(p) === maxT && maxT > 0;

      // Header card bg
      fillRR(gx + catColW + gap + pi * (colW + gap), gy, colW, headerH, 12, bgS);
      strokeRR(gx + catColW + gap + pi * (colW + gap), gy, colW, headerH, 12, isWin ? pri : brd, isWin ? 3 : 2);

      // Numbered circle avatar
      const avatarR = 24;
      ctx.beginPath(); ctx.arc(cx, cy + avatarR + 6, avatarR, 0, Math.PI * 2);
      ctx.fillStyle = bgS; ctx.fill();
      ctx.strokeStyle = isWin ? pri : brd; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = pri; ctx.font = "700 22px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(String(pi + 1), cx, cy + avatarR + 14);

      // Player name (always show)
      ctx.fillStyle = pri; ctx.font = "600 20px system-ui, sans-serif";
      const name = p.name.length > 10 ? p.name.substring(0, 9) + "…" : p.name;
      ctx.fillText(name, cx, cy + avatarR * 2 + 24);
    });

    // Category rows
    GC.forEach((cat, ci) => {
      const ry = gy + headerH + gap + ci * (rowH + gap);

      // Category cell (like app's bgS cell with border)
      fillRR(gx, ry, catColW, rowH, ci === 0 ? 12 : ci === GC.length - 1 ? 12 : 4, bgS);
      strokeRR(gx, ry, catColW, rowH, ci === 0 ? 12 : ci === GC.length - 1 ? 12 : 4, brd, 2);

      // Badge/icon area
      const badgeX = gx + 14, badgeY = ry + rowH / 2 - 18;
      const badgeS = 36;
      if (cat.n) {
        // Dice face
        strokeRR(badgeX, badgeY, badgeS, badgeS, 6, pri, 1.5);
        ctx.fillStyle = pri;
        const dots = { 1:[[.5,.5]], 2:[[.3,.3],[.7,.7]], 3:[[.3,.3],[.5,.5],[.7,.7]], 4:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]], 5:[[.3,.3],[.7,.3],[.5,.5],[.3,.7],[.7,.7]], 6:[[.3,.3],[.7,.3],[.3,.5],[.7,.5],[.3,.7],[.7,.7]] };
        (dots[cat.n] || []).forEach(([dx, dy]) => {
          ctx.beginPath(); ctx.arc(badgeX + dx * badgeS, badgeY + dy * badgeS, 3.5, 0, Math.PI * 2); ctx.fill();
        });
      } else {
        // Combo badge
        fillRR(badgeX, badgeY, badgeS, badgeS, 6, bgS);
        strokeRR(badgeX, badgeY, badgeS, badgeS, 6, brd, 1.5);
        ctx.fillStyle = pri; ctx.font = "700 16px system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(COMBO_LABELS[cat.k], badgeX + badgeS / 2, badgeY + badgeS / 2 + 6);
      }

      // Category name
      ctx.textAlign = "left"; ctx.fillStyle = pri; ctx.font = "600 22px system-ui, sans-serif";
      ctx.fillText(cat.l, gx + 58, ry + rowH / 2 - 4);
      // Subtitle
      ctx.fillStyle = txtF; ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillText(cat.n ? `Hasta ${cat.m}` : gV(cat).join("/"), gx + 58, ry + rowH / 2 + 18);

      // Score cells for each player
      ps.forEach((p, pi) => {
        const x = gx + catColW + gap + pi * (colW + gap);
        const val = p.scores[cat.k];

        if (val !== null) {
          fillRR(x, ry, colW, rowH, 8, bgS);
          strokeRR(x, ry, colW, rowH, 8, brd, 2);
        } else {
          fillRR(x, ry, colW, rowH, 8, "#FFFFFF");
          // Dashed border - draw as dotted segments
          ctx.setLineDash([8, 6]); strokeRR(x, ry, colW, rowH, 8, brd, 1.5); ctx.setLineDash([]);
        }

        ctx.textAlign = "center";
        if (val === "x") {
          ctx.fillStyle = err; ctx.font = "700 32px system-ui, sans-serif";
          ctx.fillText("✗", x + colW / 2, ry + rowH / 2 + 11);
        } else if (val !== null) {
          ctx.fillStyle = pri; ctx.font = "400 36px Georgia, serif";
          ctx.fillText(String(val), x + colW / 2, ry + rowH / 2 + 12);
        } else {
          ctx.fillStyle = txtF; ctx.font = "400 24px system-ui, sans-serif";
          ctx.globalAlpha = 0.4; ctx.fillText("·", x + colW / 2, ry + rowH / 2 + 8); ctx.globalAlpha = 1;
        }
      });
    });

    // Total row
    const ty = gy + headerH + gap + GC.length * (rowH + gap) + gap;

    // TOTAL label cell (green bg like the app)
    fillRR(gx, ty, catColW, totalH, 12, pri);
    ctx.fillStyle = "#fff"; ctx.font = "700 18px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("TOTAL", gx + catColW / 2, ty + totalH / 2 + 7);

    // Total score cells
    ps.forEach((p, pi) => {
      const x = gx + catColW + gap + pi * (colW + gap);
      const isWin = tot(p) === maxT && maxT > 0;
      fillRR(x, ty, colW, totalH, 12, bgS);
      strokeRR(x, ty, colW, totalH, 12, isWin ? pri : brd, isWin ? 3 : 2);
      ctx.fillStyle = pri; ctx.font = "400 48px Georgia, serif"; ctx.textAlign = "center";
      ctx.fillText(String(tot(p)), x + colW / 2, ty + totalH / 2 + 16);
    });

    // Date + watermark
    const now = new Date();
    const ds = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const ts = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = txtF; ctx.font = "500 22px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${ds}  ·  ${ts}`, W / 2, H - 50);
    ctx.fillStyle = pri; ctx.globalAlpha = 0.2; ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText("PUNTOS APP", W / 2, H - 20); ctx.globalAlpha = 1;

    try {
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      const file = new File([blob], "generala.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ title: "Generala", files: [file] }); return; }
    } catch (e) { if (e?.name === "AbortError") return; }
    const text = "Generala\n" + ps.map(p => `${p.name}: ${tot(p)}`).join("\n");
    try { if (navigator.share) { await navigator.share({ title: "Generala", text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); alert("Copiado"); } catch (e) { prompt("Copiá:", text); }
  };

  const startNameEdit = (i) => {
    setEditingIdx(i);
    setEditVal(ps[i]?.name || "");
  };
  const finishNameEdit = () => {
    if (editingIdx !== null && editVal.trim()) ren(editingIdx, editVal.trim());
    setEditingIdx(null);
  };
  const goBack = () => { onContinueChange?.(started ? "generala" : null); if (onChangeGame) onChangeGame(); else onBack() };
  const maxTot = ps.length ? Math.max(...ps.map(p => tot(p))) : 0;

  const setupBar = <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10, borderBottom: `1px solid ${t.brd}` }}>
    <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, touchAction: "manipulation", display: "flex", alignItems: "center" }}>
      <HomeIcon color={t.txtM} />
    </button>
    <div style={{ flex: 1 }} />
    <button onClick={tog} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", touchAction: "manipulation", display: "flex", alignItems: "center" }}>
      {dk
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m-10-10h2m16 0h2m-3.64-7.36l-1.42 1.42M6.34 17.66l-1.42 1.42m0-12.72l1.42 1.42m11.32 11.32l1.42 1.42" /></svg>
        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
      }
    </button>
  </div>;

  if (loading) return <div style={{ background: t.bg, minHeight: "100vh" }}>{setupBar}<div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (!started) return <div style={{ background: t.bg, minHeight: "100vh" }}>{setupBar}

    <div style={{ maxWidth: 360, margin: "0 auto", padding: "20px 24px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      {sStep === 0 && <><p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>{L.howManyPlayers}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {[2, 3, 4, 5, 6].map(n => <button key={n} onClick={() => handleCount(n)}
            style={{ width: 52, height: 52, fontSize: 20, fontFamily: F.serif, background: "transparent",
              border: `1.5px solid ${pCount === n ? t.pri : t.brd}`, borderRadius: 6,
              color: pCount === n ? t.pri : t.txt, cursor: "pointer", touchAction: "manipulation", transition: "all .15s" }}>{n}</button>)}</div>
        <B onClick={() => setSStep(1)} s={{ width: "100%" }}>{L.next}</B></>}
      {sStep === 1 && <><p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>{L.names}</p>
        {pNames.map((n, i) => <input key={i} autoFocus={i === 0} autoCapitalize="words" ref={el => { playerNameRefs.current[i] = el }} value={n}
          onChange={e => { const u = [...pNames]; u[i] = e.target.value; setPNames(u) }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextGeneralaName(i) } }} onFocus={e => e.target.select()} enterKeyHint={i === pNames.length - 1 ? "done" : "next"}
          placeholder={`Jugador ${i + 1}`}
          style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${t.brd}`, color: t.txt,
            padding: "14px 0", fontSize: 16, fontFamily: F.sans, outline: "none", borderRadius: 0, textTransform: "capitalize" }} />)}
        <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setSStep(0)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={startGame} s={{ flex: 1 }}>{L.start}</B></div>
        </div></>}
    </div></div>;

  const COL1 = 96;
  const gridCols = `${COL1}px repeat(${ps.length}, minmax(60px, 1fr))`;

  return <div style={{ minHeight: "100dvh", background: t.bg }}>
    {/* Minimal header */}
    <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10, flexShrink: 0, borderBottom: `1px solid ${t.brd}` }}>
      <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, touchAction: "manipulation", display: "flex", alignItems: "center" }}>
        <HomeIcon color={t.txtM} />
      </button>
      <button onClick={tog} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", touchAction: "manipulation", display: "flex", alignItems: "center" }}>
        {dk
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m-10-10h2m16 0h2m-3.64-7.36l-1.42 1.42M6.34 17.66l-1.42 1.42m0-12.72l1.42 1.42m11.32 11.32l1.42 1.42" /></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
        }
      </button>
      <div style={{ flex: 1, textAlign: "center" }}>
        <span style={{ fontSize: 13, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>
          {turnsLeft > 0 ? `${turnsLeft} ${L.turnsLeft}` : L.done}
        </span>
      </div>
      {!allDone && <button onClick={() => setModal("menu")} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, color: t.txt, fontSize: 14, fontFamily: F.sans, fontWeight: 600, cursor: "pointer", padding: "8px 18px", touchAction: "manipulation" }}>Menu</button>}
    </div>

    {modal === "menu" && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 8, padding: 4, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 240, width: "100%" }}>
        <button onClick={() => { tog(); setModal(null); }} style={{
          display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "12px 14px",
          background: "none", border: "none", color: t.txt, fontSize: 14, fontWeight: 500,
          cursor: "pointer", borderRadius: 4, fontFamily: F.sans, touchAction: "manipulation",
        }}>
          {dk
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2m-10-10h2m16 0h2m-3.64-7.36l-1.42 1.42M6.34 17.66l-1.42 1.42m0-12.72l1.42 1.42m11.32 11.32l1.42 1.42" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.txtM} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
          }
          {dk ? "Modo claro" : "Modo oscuro"}
        </button>
        <div style={{ height: 1, background: t.brd, margin: "0 10px" }} />
        {[
          { label: "Aviso de turno", val: turnGuard, toggle: () => setTurnGuard(g => !g) },
          { label: "Mostrar pendientes", val: showHints, toggle: () => setShowHints(g => !g) },
        ].map((opt, i) => (
          <button key={i} onClick={() => { opt.toggle(); setModal(null); }} style={{
            display: "flex", width: "100%", alignItems: "center", gap: 8, padding: "12px 14px",
            background: "none", border: "none", color: t.txt, fontSize: 14, fontWeight: 500,
            cursor: "pointer", borderRadius: 4, fontFamily: F.sans, touchAction: "manipulation",
          }}>
            <span style={{ fontSize: 16, width: 16, textAlign: "center" }}>{opt.val ? "✓" : ""}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{opt.label}</span>
          </button>
        ))}
        <div style={{ height: 1, background: t.brd, margin: "0 10px" }} />
        {[
          { label: "Compartir", action: doShare },
          ...(hist.length > 0 ? [{ label: L.hist, action: () => { setModal(null); setShowH(true); } }] : []),
          { label: L.revancha, action: () => setModal("revancha") },
          { label: L.nuevaPartida, action: () => setModal("new") },
        ].map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: "block", width: "100%", textAlign: "left", padding: "12px 14px",
            background: "none", border: "none", color: t.txt, fontSize: 14, fontWeight: 500,
            cursor: "pointer", borderRadius: 4, fontFamily: F.sans, touchAction: "manipulation",
          }}>{item.label}</button>
        ))}
      </div>
    </Modal>}

    {(modal === "revancha" || modal === "new") && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
      <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>{modal === "revancha" ? `¿${L.revancha}?` : `¿${L.nuevaPartida}?`}</p>
      <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>{modal === "revancha" ? "Se reinician los puntos a cero." : "Se vuelve a configurar todo."}</p>
      <div style={{ display: "flex", gap: 10 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "revancha" ? <B onClick={revancha} s={{ flex: 1 }}>{L.revancha}</B> : <B v="err" onClick={nuevaPartidaSetup} s={{ flex: 1 }}>{L.nuevaPartida}</B>}</div>
    </div></Modal>}

    {/* Score entry modal */}
    {sheet && <Modal onClose={() => setSheet(null)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 20, border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {GC.find(c => c.k === sheet.cat)?.n && <DiceFace n={GC.find(c => c.k === sheet.cat).n} size={28} color={t.txtM} />}
          {!GC.find(c => c.k === sheet.cat)?.n && <ComboBadge k={sheet.cat} color={t.pri} t={t} />}
          <p style={{ fontSize: 14, fontWeight: 500, color: t.txt, margin: 0, fontFamily: F.sans }}>
            {ps[sheet.pi]?.name} — {GC.find(c => c.k === sheet.cat)?.l}</p>
        </div>
        {sheet.pi !== currentTurnIndex && <p style={{ fontSize: 10, color: t.err, margin: "0 0 8px", opacity: 0.7, fontFamily: F.sans }}>{L.turnWarning.replace('{name}', ps[sheet.pi]?.name || '').replace('{expected}', currentTurnName || '')}</p>}
        <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 12px", fontFamily: F.sans }}>{L.chooseScore}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {gV(GC.find(c => c.k === sheet.cat)).map(v => <button key={v} onClick={() => setSc(sheet.pi, sheet.cat, v)}
            style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 6, padding: "14px 8px",
              fontSize: 18, fontFamily: F.serif, color: t.txt, cursor: "pointer", touchAction: "manipulation" }}>{v}</button>)}
          <B v="err" onClick={() => setSc(sheet.pi, sheet.cat, "x")} s={{ padding: "14px 8px" }}>✗ {L.cross}</B>
          {ps[sheet.pi]?.scores[sheet.cat] !== null && <B v="gh" onClick={() => setSc(sheet.pi, sheet.cat, null)} s={{ fontSize: 12, padding: "14px 8px" }}>↩ {L.erase}</B>}
        </div>
        <B v="gh" onClick={() => setSheet(null)} s={{ width: "100%", marginTop: 10 }}>{L.cancel}</B>
      </div></Modal>}

    {showH && hist.length > 0 && <Modal onClose={() => setShowH(false)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 16, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 340, width: "100%", maxHeight: "70vh", overflow: "auto" }}>
        <p style={{ fontSize: 16, color: t.pri, margin: "0 0 10px", fontFamily: F.serif }}>{L.hist}</p>
        {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${t.brd}`, fontSize: 13, fontFamily: F.sans }}>
          <div style={{ flex: 1 }}>{h.players.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
          {h.date && <span style={{ fontSize: 10, color: t.txtF, whiteSpace: "nowrap" }}>{h.date}</span>}
          <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 20, padding: "4px 8px", touchAction: "manipulation" }}>×</button>
        </div>)}
      </div>
    </Modal>}

    {/* Winner banner */}
    {allDone && (() => { const winnerP = ps.reduce((b, p) => tot(p) > tot(b) ? p : b, ps[0]); return (
      <div style={{ textAlign: "center", padding: "24px 16px 20px", background: `linear-gradient(135deg, ${t.priD}, ${t.pri}, ${t.priL})`, color: "#fff", animation: "winnerSlideIn .5s ease-out", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 40, animation: "trophyBounce .6s ease-out", marginBottom: 4 }}>🏆</div>
          <div style={{ fontSize: 11, fontFamily: F.sans, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", opacity: 0.6, marginBottom: 4, animation: "fadeInUp .4s ease-out .2s both" }}>Victoria</div>
          <div style={{ fontSize: 26, fontFamily: F.serif, fontWeight: 700, animation: "fadeInUp .4s ease-out .3s both" }}>¡{winnerP.name}!</div>
          <div style={{ fontSize: 15, fontFamily: F.sans, opacity: 0.75, marginTop: 2, animation: "fadeInUp .4s ease-out .35s both" }}>{tot(winnerP)} puntos</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, animation: "fadeInUp .4s ease-out .45s both" }}>
            <button onClick={revancha} style={{
              background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.25)",
              borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 600,
              padding: "11px 22px", cursor: "pointer", flex: 1, maxWidth: 160, touchAction: "manipulation",
            }}>{L.revancha}</button>
            <button onClick={nuevaPartidaSetup} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 10, color: "rgba(255,255,255,.8)", fontSize: 14, fontFamily: F.sans, fontWeight: 500,
              padding: "11px 22px", cursor: "pointer", flex: 1, maxWidth: 160, touchAction: "manipulation",
            }}>{L.nuevaPartidaSetup}</button>
          </div>
          <button onClick={doShare} style={{
            background: "none", border: "none", color: "rgba(255,255,255,.5)",
            fontSize: 12, fontFamily: F.sans, cursor: "pointer", marginTop: 10, padding: "4px 8px", touchAction: "manipulation",
            animation: "fadeInUp .4s ease-out .55s both",
          }}>{L.share}</button>
        </div>
      </div>); })()}

    {/* ══════ SCORE GRID ══════ */}
    <div style={{ padding: "10px 8px 20px", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(300, COL1 + ps.length * 72) }}>
        {/* Player header with numbered avatars */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ padding: 4 }} />
          {ps.map((p, i) => <div key={i} style={{ padding: "8px 4px 6px", textAlign: "center", background: t.card, borderRadius: "6px 6px 0 0", border: `1px solid ${t.brd}`, borderBottom: "none" }}>
            <div onClick={() => startNameEdit(i)} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: t.bgS, border: `1.5px solid ${!allDone && i === currentTurnIndex ? t.pri : t.brd}`, color: t.pri,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 4px", fontSize: 13, fontWeight: 700, fontFamily: F.sans,
              cursor: "pointer", transition: "border-color .2s",
            }}>{i + 1}</div>
            {editingIdx === i ? (
              <input autoFocus autoCapitalize="words" value={editVal}
                onChange={e => setEditVal(e.target.value)}
                onBlur={finishNameEdit}
                onKeyDown={e => { if (e.key === "Enter") finishNameEdit() }}
                style={{ background: "transparent", border: "none", borderBottom: `1.5px solid ${t.pri}`, color: t.txt,
                  fontSize: 13, fontFamily: F.sans, fontWeight: 500, borderRadius: 0, padding: "2px 0", outline: "none",
                  width: "100%", textAlign: "center", textTransform: "capitalize" }} />
            ) : !isDefaultName(p.name) ? (
              <EN name={p.name} onSave={n => ren(i, n)} sz={13} />
            ) : null}
          </div>)}
        </div>

        {/* Category rows */}
        {GC.map((cat, ci) => { const same = allSame(cat);
          const catHint = showHints && !allDone && ps[currentTurnIndex]?.scores[cat.k] === null;
          return <div key={cat.k} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "relative" }}>
            {/* Category label with dice/badge icon */}
            <div style={{ padding: "8px 6px", background: catHint ? `${t.pri}22` : t.bgS, border: catHint ? `2px solid ${t.pri}70` : `1px solid ${t.brd}`,
              borderRadius: ci === 0 ? "6px 0 0 0" : ci === GC.length - 1 ? "0 0 0 6px" : 0,
              display: "flex", alignItems: "center", gap: 5, transition: "all .2s" }}>
              {cat.n ? <DiceFace n={cat.n} size={22} color={t.pri} /> : <ComboBadge k={cat.k} color={t.pri} t={t} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: t.pri, fontFamily: F.sans, fontSize: 13, lineHeight: 1.2, whiteSpace: "nowrap" }}>{cat.l}</div>
                <div style={{ fontSize: 10, color: t.txtF, fontFamily: F.sans }}>{cat.n ? `${L.upTo} ${cat.m}` : gV(cat).join("/")}</div>
              </div>
            </div>
            {ps.map((p, pi) => { const val = p.scores[cat.k];
              return <div key={pi} onClick={() => {
                if (val === null && !askTurnGuard(pi)) return;
                setSheet({ pi, cat: cat.k });
              }}
                style={{ textAlign: "center", cursor: "pointer",
                  background: val !== null ? t.bgS : t.card,
                  border: val !== null ? `1px solid ${t.brd}` : `1px dashed ${t.brd}`,
                  borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48,
                  transition: "all .2s",
                }}>
                {val === "x" ? <span style={{ color: t.err, fontSize: 18, fontWeight: 700, fontFamily: F.sans }}>✗</span>
                  : val !== null ? <span style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 400, color: t.pri }}>{val}</span>
                  : <span style={{ color: t.txtF, fontSize: 13, opacity: 0.4 }}>·</span>}
              </div> })}
            {same && <div style={{ position: "absolute", top: "50%", left: COL1 - 4, right: 2, height: 2, background: t.pri, opacity: .25, pointerEvents: "none" }} />}
          </div> })}

        {/* Total row */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginTop: 6 }}>
          <div style={{ padding: "10px 5px", fontSize: 9, fontWeight: 600, color: "#fff", letterSpacing: 1.5,
            fontFamily: F.sans, background: t.pri, borderRadius: "0 0 0 6px",
            display: "flex", alignItems: "center", justifyContent: "center" }}>TOTAL</div>
          {ps.map((p, pi) => {
            const isLeader = ps.length > 1 && tot(p) === maxTot && maxTot > 0;
            return <div key={pi} style={{ padding: "6px 4px", textAlign: "center",
              background: t.bgS,
              border: isLeader ? `1.5px solid ${t.pri}` : `1px solid ${t.brd}`,
              borderRadius: pi === ps.length - 1 ? "0 0 6px 0" : 0 }}>
              <PopNum value={tot(p)} style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 400, color: t.pri }} t={t} />
            </div>
          })}
        </div>
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}

export default Generala;
