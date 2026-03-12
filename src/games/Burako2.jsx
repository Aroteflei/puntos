import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp, ST, clone, vibWin, vibFor, bajadaReq, fmtDate, F, B, EN, Modal, UndoBar, HomeIcon } from '../lib.jsx';

const DEF_CFG = { tgt: 3000, pura: 200, canasta: 100, cierre: 100, muerto: 100 };

// Avatar for teams: "AS" for "Arif - Sofi", "A" for "Arif"
const teamAvatar = (name) => {
  const parts = name.split(/\s*-\s*/);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.charAt(0).toUpperCase();
};

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

function Burako2({ onBack, onContinueChange, onChangeGame }) {
  const { t, dk, tog, sounds, L } = useApp();
  const [setup, setSetup] = useState(true);
  const [mode, setMode] = useState("par"); // "2j"|"3j"|"par"
  const [names, setNames] = useState(["", "", "", ""]);
  const [teams, setTeams] = useState([]);
  const [cfg, setCfg] = useState({ ...DEF_CFG });
  const [modal, setModal] = useState(null); // "menu"|"settings"|"revancha"|"new"
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editCell, setEditCell] = useState(null); // { ti, hi } or null
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);
  const [starter, setStarter] = useState(null); // team index who started first hand
  const nameRefs = useRef([]);
  const ledgerRef = useRef(null);
  const editRef = useRef(null);
  const saveCellRef = useRef(null);
  const clearCellRef = useRef(null);
  const editingCellRef = useRef(null);

  // ── Persistence ──
  useEffect(() => {
    ST.load("burako2-hist").then(d => { if (Array.isArray(d)) setHist(d) });
    ST.load("burako2-game").then(d => {
      if (d?.teams?.length) {
        setTeams(d.teams);
        setCfg(d.cfg || DEF_CFG);
        setMode(d.mode || (d.teams.length === 3 ? "3j" : "par"));
        if (d.starter != null) setStarter(d.starter);
        setSetup(false);
        onContinueChange?.("burako2");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (teams.length && !setup) {
      ST.save("burako2-game", { teams, cfg, mode, starter });
      onContinueChange?.("burako2");
    }
  }, [teams, cfg, mode, setup, starter]);

  // ── Setup ──
  const handleMode = (m) => {
    setMode(m);
    if (m === "par") setNames(["", "", "", ""]);
    else if (m === "3j") setNames(["", "", ""]);
    else setNames(["", ""]);
  };

  const nameCount = mode === "par" ? 4 : mode === "3j" ? 3 : 2;

  const moveNext = (i) => {
    const nx = nameRefs.current[i + 1];
    if (nx) { nx.focus(); nx.select?.(); } else start();
  };

  const start = () => {
    let fresh;
    if (mode === "par") {
      const pairName = (a, b, fallback) => {
        const na = a.trim(), nb = b.trim();
        if (!na && !nb) return fallback;
        if (na && nb) return na + " - " + nb;
        return na || nb;
      };
      const n1 = pairName(names[0], names[1], "Equipo 1");
      const n2 = pairName(names[2], names[3], "Equipo 2");
      fresh = [{ name: n1, hands: [] }, { name: n2, hands: [] }];
    } else {
      fresh = names.slice(0, nameCount).map((n, i) => ({ name: n.trim() || `Jugador ${i + 1}`, hands: [] }));
    }
    setTeams(fresh); setSetup(false);
    ST.save("burako2-game", { teams: fresh, cfg, mode });
    onContinueChange?.("burako2");
  };

  // ── Game logic ──
  const handVal = (h) => h == null ? 0 : (h.v ?? ((h.base || 0) + (h.pts || 0)));
  const total = (tm) => tm.hands.reduce((s, h) => s + handVal(h), 0);
  const ren = (i, n) => { const u = [...teams]; u[i] = { ...u[i], name: n }; setTeams(u); };
  const maxHands = Math.max(...teams.map(tm => tm.hands.length), 0);
  const winner = teams.find(tm => total(tm) >= cfg.tgt);
  const lastRowComplete = maxHands === 0 || teams.every(tm => tm.hands[maxHands - 1] != null);
  const displayRows = winner ? maxHands : (lastRowComplete ? maxHands + 1 : maxHands);
  const hasBajada = mode === "par";
  const numSeats = mode === "par" ? 4 : teams.length;

  const saveCell = (ti, hi, handObj) => {
    const prev = clone(teams);
    const u = clone(teams);
    // Ensure all teams have enough entries
    while (u.some(tm => tm.hands.length <= hi)) {
      u.forEach(tm => { if (tm.hands.length <= hi) tm.hands.push(null); });
    }
    const wasEdit = u[ti].hands[hi] != null;
    u[ti].hands[hi] = handObj;
    setTeams(u);
    setToast({ text: wasEdit ? L.editHand : L.newHand, undo: () => setTeams(prev) });
    if (sounds) vibFor(1);
    if (sounds && u.some(tm => total(tm) >= cfg.tgt)) vibWin();
    // Auto-advance starter when a hand row is completed (new entry, not edit)
    if (!wasEdit && starter != null) {
      const rowComplete = u.every(tm => tm.hands[hi] != null);
      if (rowComplete) setStarter((starter + 1) % numSeats);
    }
    setTimeout(() => {
      if (ledgerRef.current) ledgerRef.current.scrollTop = ledgerRef.current.scrollHeight;
    }, 50);
  };

  const clearCell = (ti, hi) => {
    const prev = clone(teams);
    const u = clone(teams);
    u[ti].hands[hi] = null;
    // Trim trailing all-null rows
    while (u[0].hands.length > 0 && u.every(tm => tm.hands[tm.hands.length - 1] == null)) {
      u.forEach(tm => tm.hands.pop());
    }
    setTeams(u);
    setToast({ text: "Borrado", undo: () => setTeams(prev) });
  };

  // Keep refs current for commitEdit (avoids stale closures)
  saveCellRef.current = saveCell;
  clearCellRef.current = clearCell;

  const commitEdit = useCallback(() => {
    const e = editRef.current;
    if (!e) return;
    editRef.current = null;
    const { ti, hi, mode, base, pts, neg, wasEdit } = e;
    if (mode === "neg") {
      const n = parseInt(neg) || 0;
      if (n > 0) saveCellRef.current(ti, hi, { v: -n });
      else if (wasEdit) clearCellRef.current(ti, hi);
    } else {
      const b = parseInt(base) || 0;
      const p = parseInt(pts) || 0;
      if (b || p) saveCellRef.current(ti, hi, { base: b, pts: p, v: b + p });
      else if (wasEdit) clearCellRef.current(ti, hi);
    }
  }, []);

  const handleCellClick = (ti, hi) => {
    if (editCell?.ti === ti && editCell?.hi === hi) return;
    commitEdit();
    setEditCell({ ti, hi });
  };

  // Close inline edit when tapping outside the editing cell
  useEffect(() => {
    if (!editCell) return;
    const handler = (e) => {
      if (editingCellRef.current && !editingCellRef.current.contains(e.target)) {
        commitEdit();
        setEditCell(null);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [editCell, commitEdit]);

  const saveToHistory = async () => {
    if (teams.some(tm => tm.hands.length > 0)) {
      const entry = { players: teams.map(tm => ({ name: tm.name, t: total(tm) })), date: fmtDate() };
      const nextHist = [entry, ...hist];
      setHist(nextHist);
      await ST.save("burako2-hist", nextHist);
    }
  };

  const revancha = async () => {
    await saveToHistory();
    const r = teams.map(tm => ({ ...tm, hands: [] }));
    setTeams(r); setModal(null);
    setToast({ text: L.revancha });
    ST.save("burako2-game", { teams: r, cfg, mode });
  };

  const nuevaPartidaSetup = async () => {
    await saveToHistory();
    resetZ();
  };

  const nuevaPartida = async () => {
    await saveToHistory();
    const r = teams.map(tm => ({ ...tm, hands: [] }));
    setTeams(r); setModal(null);
    setToast({ text: L.nuevaPartida });
    ST.save("burako2-game", { teams: r, cfg, mode });
  };

  const delH = async (i) => {
    const next = hist.filter((_, j) => j !== i);
    setHist(next);
    if (next.length) await ST.save("burako2-hist", next);
    else await ST.del("burako2-hist");
  };

  const resetZ = async () => {
    setTeams([]); setSetup(true); setModal(null);
    await ST.del("burako2-game"); onContinueChange?.(null);
  };

  const goBack = async () => {
    if (teams.length && !setup) await ST.save("burako2-game", { teams, cfg, mode });
    onContinueChange?.(teams.length ? "burako2" : null);
    onChangeGame?.();
  };

  // ── Screenshot share ──
  const doShare = async () => {
    setModal(null);
    const W = 720, PAD = 28, DPR = 2;
    const nCols = teams.length;
    const DIV = 1;
    const COL_W = (W - PAD * 2 - (nCols - 1) * DIV) / nCols;
    const rows = Math.max(maxHands, 1);
    const TITLE_H = 78, HEAD_H = hasBajada ? 54 : 40, HAND_H = 90, TOTAL_H = 74, FOOT_H = 40;
    const H = TITLE_H + HEAD_H + rows * HAND_H + TOTAL_H + FOOT_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR; canvas.height = H * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#F8F9FA');
    bgGrad.addColorStop(1, '#EEEDEB');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Top accent bar
    const barGrad = ctx.createLinearGradient(0, 0, W, 0);
    barGrad.addColorStop(0, '#1A5C52');
    barGrad.addColorStop(1, '#3D8B7A');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, 0, W, 6);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1A5C52';
    ctx.font = '32px Georgia, serif';
    ctx.fillText('BURAKO', W / 2, 38);

    // Date
    const now = new Date();
    const ds = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const ts = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    ctx.fillStyle = '#7A7A78';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`${ds} · ${ts}`, W / 2, 56);

    const Y0 = TITLE_H;

    // Team headers
    teams.forEach((tm, i) => {
      const cx = PAD + i * (COL_W + DIV) + COL_W / 2;
      ctx.fillStyle = '#1A1A1A';
      ctx.font = '18px Georgia, serif';
      ctx.fillText(tm.name, cx, Y0 + 20, COL_W - 10);
      if (hasBajada) {
        ctx.fillStyle = '#7A7A78';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(`Baja con: ${bajadaReq(total(tm))}`, cx, Y0 + 32);
      }
    });

    // Header line
    const hY = Y0 + HEAD_H;
    ctx.strokeStyle = '#1A5C52';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, hY); ctx.lineTo(W - PAD, hY); ctx.stroke();

    // Vertical dividers
    for (let i = 1; i < nCols; i++) {
      const x = PAD + i * COL_W + (i - 0.5) * DIV;
      ctx.strokeStyle = '#E8E8E6';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, hY); ctx.lineTo(x, hY + rows * HAND_H); ctx.stroke();
    }

    // Hands
    for (let hi = 0; hi < rows; hi++) {
      const rY = hY + hi * HAND_H;
      ctx.fillStyle = '#B5B5B2';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(hi + 1).padStart(2, '0'), PAD - 22, rY + 22);
      teams.forEach((tm, ti) => {
        const h = tm.hands[hi];
        if (!h) return;
        const cx = PAD + ti * (COL_W + DIV) + COL_W / 2;
        const cumul = tm.hands.slice(0, hi + 1).reduce((s, x) => s + handVal(x), 0);
        if (h.base !== undefined) {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#1A1A1A';
          ctx.font = '18px system-ui, sans-serif';
          ctx.fillText(String(h.base), cx, rY + 22);
          ctx.fillText(String(h.pts), cx, rY + 44);
          // Thin divider
          ctx.strokeStyle = '#C8C8C6'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(cx - 28, rY + 52); ctx.lineTo(cx + 28, rY + 52); ctx.stroke();
          // Cumulative total
          ctx.fillStyle = cumul >= 0 ? '#2D7A50' : '#C23B22';
          ctx.font = '20px Georgia, serif';
          ctx.fillText(String(cumul), cx, rY + 74);
        } else {
          const v = handVal(h);
          ctx.textAlign = 'center';
          ctx.fillStyle = v >= 0 ? '#1A1A1A' : '#C23B22';
          ctx.font = '20px system-ui, sans-serif';
          ctx.fillText(String(v), cx, rY + 32);
          // Thin divider
          ctx.strokeStyle = '#C8C8C6'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(cx - 28, rY + 40); ctx.lineTo(cx + 28, rY + 40); ctx.stroke();
          // Cumulative total
          ctx.fillStyle = cumul >= 0 ? '#2D7A50' : '#C23B22';
          ctx.font = '18px Georgia, serif';
          ctx.fillText(String(cumul), cx, rY + 60);
        }
      });
      if (hi < rows - 1) {
        ctx.strokeStyle = '#E8E8E6'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PAD + 10, rY + HAND_H); ctx.lineTo(W - PAD - 10, rY + HAND_H); ctx.stroke();
      }
    }

    // Total line
    const tY = hY + rows * HAND_H;
    ctx.strokeStyle = '#1A5C52'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, tY); ctx.lineTo(W - PAD, tY); ctx.stroke();

    // Totals
    teams.forEach((tm, i) => {
      const cx = PAD + i * (COL_W + DIV) + COL_W / 2;
      ctx.fillStyle = '#1A5C52';
      ctx.font = '600 13px system-ui, sans-serif';
      ctx.fillText('TOTAL', cx, tY + 20);
      ctx.font = '32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(total(tm)), cx, tY + 54);
    });

    // Footer watermark
    ctx.fillStyle = '#1A5C52';
    ctx.globalAlpha = 0.25;
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUNTOS APP', W / 2, H - 14);
    ctx.globalAlpha = 1;

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `burako-${ds.replace(/\//g, '-')}.png`, { type: 'image/png' });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Burako - Puntos' });
          return;
        }
      } catch (e) { if (e?.name === "AbortError") return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // ── Loading ──
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div>;

  // ══════════════════════════════════════════════════
  // SETUP
  // ══════════════════════════════════════════════════
  if (setup) return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10, borderBottom: `1px solid ${t.brd}` }}>
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
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px" }}>
      <div style={{ maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontFamily: F.serif, color: t.txt, marginBottom: 4 }}>Burako</div>
          <div style={{ fontSize: 13, color: t.txtM, fontFamily: F.sans }}>¿Cómo juegan?</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "2j", label: "2 Jugadores" },
            { key: "3j", label: "3 Jugadores" },
            { key: "par", label: "2 Parejas" },
          ].map(m => (
            <button key={m.key} onClick={() => handleMode(m.key)} style={{
              flex: 1, background: "transparent", border: `1.5px solid ${mode === m.key ? t.pri : t.brd}`, borderRadius: 6,
              padding: "12px 6px", fontSize: 13, fontFamily: F.sans, fontWeight: 500,
              color: mode === m.key ? t.pri : t.txt, cursor: "pointer", touchAction: "manipulation", transition: "all .15s",
            }}>{m.label}</button>
          ))}
        </div>

        {mode === "par" ? (
          <>
            {[0, 1].map(pair => (
              <div key={pair}>
                <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginBottom: 6, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {pair === 0 ? "Primera pareja" : "Segunda pareja"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1].map(j => {
                    const idx = pair * 2 + j;
                    return (
                      <input key={idx} ref={el => { nameRefs.current[idx] = el }}
                        autoFocus={idx === 0} autoCapitalize="words"
                        value={names[idx]} onChange={e => { const u = [...names]; u[idx] = e.target.value; setNames(u); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveNext(idx); } }}
                        onFocus={e => e.target.select()}
                        enterKeyHint={idx === 3 ? "done" : "next"}
                        placeholder={`Jugador ${idx + 1}`}
                        style={{
                          flex: 1, background: "transparent", border: "none", borderBottom: `1px solid ${t.brd}`, color: t.txt,
                          padding: "14px 0", fontSize: 16, fontFamily: F.sans, outline: "none", borderRadius: 0, textTransform: "capitalize",
                        }} />
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          names.slice(0, nameCount).map((n, i) => (
            <input key={i} autoFocus={i === 0} autoCapitalize="words" ref={el => { nameRefs.current[i] = el }}
              value={n} onChange={e => { const u = [...names]; u[i] = e.target.value; setNames(u); }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveNext(i); } }}
              onFocus={e => e.target.select()} enterKeyHint={i === nameCount - 1 ? "done" : "next"}
              placeholder={`Jugador ${i + 1}`}
              style={{
                background: "transparent", border: "none", borderBottom: `1px solid ${t.brd}`, color: t.txt,
                padding: "14px 0", fontSize: 16, fontFamily: F.sans, outline: "none", width: "100%", borderRadius: 0, textTransform: "capitalize",
              }} />
          ))
        )}

        <B onClick={start} s={{ width: "100%", minHeight: 52 }}>Empezar</B>
      </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════
  // GAME — CARD GRID STYLE
  // ══════════════════════════════════════════════════
  const COL1 = 44;
  const gridCols = `${COL1}px repeat(${teams.length}, 1fr)`;

  return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column" }}>

      {/* Top bar with game info */}
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
            {maxHands > 0 ? `${maxHands} ${maxHands === 1 ? "mano" : "manos"}` : ""}
          </span>
        </div>
        <button onClick={() => {
          const maxScore = Math.max(...teams.map(tm => total(tm)), 0);
          const steps = [1500, 2000, 2500, 3000, 3500, 4000, 5000];
          const cur = cfg.tgt;
          const next = steps.find(s => s > cur) || steps[0];
          if (next < maxScore) return;
          setCfg({ ...cfg, tgt: next });
        }} style={{
          background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "6px 14px",
          fontSize: 13, color: t.txtM, fontFamily: F.sans, fontWeight: 600, cursor: "pointer", touchAction: "manipulation",
        }}>
          A {cfg.tgt}
        </button>
        {!winner && <button onClick={() => setModal("menu")} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, color: t.txt, fontSize: 14, fontFamily: F.sans, fontWeight: 600, cursor: "pointer", padding: "8px 18px", touchAction: "manipulation" }}>Menu</button>}
      </div>

      {showH && hist.length > 0 && <Modal onClose={() => setShowH(false)}>
        <div style={{ background: t.card, borderRadius: 12, padding: 16, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 340, width: "100%", maxHeight: "70vh", overflow: "auto" }}>
          <p style={{ fontSize: 16, color: t.pri, margin: "0 0 10px", fontFamily: F.serif }}>{L.hist}</p>
          {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${t.brd}`, fontSize: 13, fontFamily: F.sans }}>
            <div style={{ flex: 1 }}>{h.players.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
            <span style={{ fontSize: 10, color: t.txtF, whiteSpace: "nowrap" }}>{h.date}</span>
            <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 20, padding: "4px 8px", touchAction: "manipulation" }}>×</button>
          </div>)}
        </div>
      </Modal>}

      {/* Winner banner */}
      {winner && (
        <div style={{ textAlign: "center", padding: 16, background: t.pri, color: "#fff", flexShrink: 0, animation: "scaleIn .3s ease" }}>
          <div style={{ fontSize: 20, fontFamily: F.serif, fontWeight: 400 }}>¡{winner.name} {mode === "par" ? L.winPl : L.winSg}!</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
            <button onClick={revancha} style={{
              background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 600,
              padding: "10px 20px", cursor: "pointer", flex: 1, maxWidth: 160, touchAction: "manipulation",
            }}>{L.revancha}</button>
            <button onClick={nuevaPartidaSetup} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 500,
              padding: "10px 20px", cursor: "pointer", flex: 1, maxWidth: 160, touchAction: "manipulation",
            }}>{L.nuevaPartidaSetup}</button>
          </div>
          <button onClick={doShare} style={{
            background: "none", border: "none", color: "rgba(255,255,255,.6)",
            fontSize: 12, fontFamily: F.sans, cursor: "pointer", marginTop: 8, padding: "4px 8px", touchAction: "manipulation",
          }}>{L.share}</button>
        </div>
      )}

      {/* ══════ CARD GRID LEDGER ══════ */}
      <div ref={ledgerRef} style={{ flex: 1, overflowY: "auto", padding: "10px 8px 20px" }}>
        <div style={{ minWidth: Math.max(260, COL1 + teams.length * 100) }}>

          {/* Team headers — sticky */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "sticky", top: 0, zIndex: 2 }}>
            <div style={{ padding: 4 }} />
            {teams.map((tm, i) => (
              <div key={i} style={{
                padding: "10px 4px 8px", textAlign: "center",
                background: t.card, borderRadius: "6px 6px 0 0",
                border: `1px solid ${t.brd}`, borderBottom: "none",
                display: "flex", flexDirection: "column", alignItems: "center",
                minHeight: hasBajada ? 110 : undefined,
              }}>
                {mode === "par" ? (
                  <div style={{ display: "flex", gap: 4, margin: "0 auto 4px" }}>
                    {tm.name.split(/\s*-\s*/).map((pName, pi) => {
                      const seat = i + pi * 2;
                      const isStarter = starter === seat;
                      return (
                        <div key={pi} onClick={(e) => { e.stopPropagation(); setStarter(isStarter ? null : seat); }} style={{
                          position: "relative", width: 26, height: 26, borderRadius: "50%",
                          background: t.bgS, border: `1.5px solid ${isStarter ? t.pri : t.brd}`, color: t.pri,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, fontFamily: F.sans,
                          cursor: "pointer", touchAction: "manipulation",
                        }}>
                          {pName.trim().charAt(0).toUpperCase()}
                          {isStarter && <div style={{
                            position: "absolute", bottom: -2, right: -2, width: 7, height: 7,
                            borderRadius: "50%", background: t.pri, border: `1.5px solid ${t.card}`,
                          }} />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div onClick={(e) => { e.stopPropagation(); setStarter(starter === i ? null : i); }} style={{
                    position: "relative", width: 32, height: 32, borderRadius: "50%",
                    background: t.bgS, border: `1.5px solid ${starter === i ? t.pri : t.brd}`, color: t.pri,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 4px", fontSize: 11, fontWeight: 700, fontFamily: F.sans,
                    cursor: "pointer", touchAction: "manipulation",
                  }}>
                    {teamAvatar(tm.name)}
                    {starter === i && <div style={{
                      position: "absolute", bottom: -2, right: -2, width: 8, height: 8,
                      borderRadius: "50%", background: t.pri, border: `1.5px solid ${t.card}`,
                    }} />}
                  </div>
                )}
                <EN name={tm.name} onSave={n => ren(i, n)} sz={20} fw={500} ff={F.sans} />
                <div style={{ flex: 1 }} />
                {hasBajada && (
                  <div style={{ fontSize: 11, color: t.txtF, fontFamily: F.sans, fontWeight: 500, marginTop: 2 }}>
                    {mode === "par" ? "Bajan con" : "Baja con"}: {bajadaReq(total(tm))}
                  </div>
                )}
                {/* Progress bar */}
                <div style={{
                  margin: "6px auto 0", width: "80%", height: 3, borderRadius: 2,
                  background: `${t.pri}15`, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${Math.min(100, (total(tm) / cfg.tgt) * 100)}%`,
                    background: t.pri, transition: "width .3s",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Hand rows */}
          {Array.from({ length: displayRows }).map((_, hi) => {
            const isBlankRow = hi >= maxHands;
            return (
              <div key={hi} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4 }}>
                {/* Row number */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, color: t.txtF, fontFamily: F.sans, fontWeight: 500,
                }}>{hi + 1}</div>
                {/* Team cells */}
                {teams.map((tm, ti) => {
                  const h = isBlankRow ? null : (tm.hands[hi] ?? null);
                  const isLastFilled = hi === maxHands - 1 && h != null;
                  const isEditing = editCell?.ti === ti && editCell?.hi === hi;
                  const cumul = tm.hands.slice(0, hi + 1).reduce((s, x) => s + handVal(x), 0);
                  return (
                    <div key={ti} ref={isEditing ? editingCellRef : undefined} onClick={() => !winner && handleCellClick(ti, hi)} style={{
                      textAlign: "center", cursor: winner ? "default" : "pointer",
                      background: isEditing ? t.card : (h ? t.bgS : t.card),
                      border: isEditing ? `2px solid ${t.pri}` : (h ? `1px solid ${t.brd}` : `1px dashed ${t.brd}`),
                      borderRadius: 4,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      minHeight: isEditing ? 140 : 64, padding: isEditing ? "10px 4px" : "8px 4px",
                      transition: "all .15s",
                    }}>
                      {isEditing ? (
                        <InlineCellEdit
                          ti={ti} hi={hi}
                          existing={h}
                          editRef={editRef}
                          onDone={() => {
                            commitEdit();
                            const nextTi = ti + 1;
                            if (nextTi < teams.length) setEditCell({ ti: nextTi, hi });
                            else setEditCell(null);
                          }}
                          onClose={() => { editRef.current = null; setEditCell(null); }}
                          onClear={() => { editRef.current = null; clearCell(ti, hi); setEditCell(null); }}
                          t={t}
                        />
                      ) : !h ? (
                        <span style={{ color: t.txtF, fontSize: 13, opacity: 0.4 }}>·</span>
                      ) : h.base !== undefined ? (
                        <>
                          <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: t.txt, lineHeight: 1.4 }}>{h.base}</div>
                          <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: t.txt, lineHeight: 1.4 }}>{h.pts}</div>
                          {!isLastFilled && <>
                            <div style={{ height: 1, background: t.txt, opacity: .12, width: "40%", margin: "3px 0 1px" }} />
                            <span style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.txtM }}>{cumul}</span>
                          </>}
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: handVal(h) >= 0 ? t.txt : t.err, lineHeight: 1.4, position: "relative", display: "inline-block" }}>
                            {handVal(h) < 0 && <span style={{ position: "absolute", right: "100%", marginRight: 1 }}>−</span>}
                            {Math.abs(handVal(h))}
                          </div>
                          <div style={{ fontSize: 20, lineHeight: 1.4, visibility: "hidden" }}>{'\u00A0'}</div>
                          {!isLastFilled && <>
                            <div style={{ height: 1, background: t.txt, opacity: .12, width: "40%", margin: "3px 0 1px" }} />
                            <span style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.txtM, position: "relative", display: "inline-block" }}>
                              {cumul < 0 && <span style={{ position: "absolute", right: "100%", marginRight: 1 }}>−</span>}
                              {Math.abs(cumul)}
                            </span>
                          </>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Total row */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginTop: 6 }}>
            <div style={{
              padding: "10px 4px", fontSize: 8, fontWeight: 600, color: "#fff", letterSpacing: 1,
              fontFamily: F.sans, background: t.pri, borderRadius: "0 0 0 6px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>TOTAL</div>
            {teams.map((tm, ti) => {
              return (
                <div key={ti} style={{
                  padding: "6px 4px", textAlign: "center",
                  background: t.bgS,
                  border: `1px solid ${t.brd}`,
                  borderRadius: ti === teams.length - 1 ? "0 0 6px 0" : 0,
                }}>
                  <PopNum value={total(tm)} style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.pri }} t={t} />
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ══════ MODALS ══════ */}

      {/* Menu */}
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
            { label: "Compartir", action: doShare },
            ...(hist.length > 0 ? [{ label: L.hist, action: () => { setModal(null); setShowH(true); } }] : []),
            { label: "Configuración", action: () => setModal("settings") },
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

      {/* Settings */}
      {modal === "settings" && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 12, padding: 20, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 320, width: "100%" }}>
          <div style={{ fontSize: 18, fontFamily: F.serif, marginBottom: 14, color: t.pri }}>Configuración</div>
          {[
            { label: "Objetivo", key: "tgt", step: 500, min: 500 },
          ].map(f => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.brd}` }}>
              <span style={{ fontSize: 13, color: t.txt, fontFamily: F.sans, fontWeight: 500 }}>{f.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setCfg({ ...cfg, [f.key]: Math.max(f.min, cfg[f.key] - f.step) })}
                  style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${t.brd}`, background: t.bgS, color: t.txt, fontSize: 16, fontFamily: F.sans, cursor: "pointer" }}>−</button>
                <span style={{ fontFamily: F.serif, fontSize: 16, color: t.pri, minWidth: 50, textAlign: "center" }}>{cfg[f.key]}</span>
                <button onClick={() => setCfg({ ...cfg, [f.key]: cfg[f.key] + f.step })}
                  style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${t.brd}`, background: t.bgS, color: t.txt, fontSize: 16, fontFamily: F.sans, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
          <B v="gh" onClick={() => setModal(null)} s={{ width: "100%", marginTop: 14 }}>Cerrar</B>
        </div>
      </Modal>}

      {/* Confirm modals */}
      {(modal === "revancha" || modal === "new") && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
          <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>
            {modal === "revancha" ? `¿${L.revancha}?` : `¿${L.nuevaPartida}?`}</p>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>
            {modal === "revancha" ? "Se reinician los puntos a cero." : "Se vuelve a configurar todo."}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "revancha" ? <B onClick={revancha} s={{ flex: 1 }}>{L.revancha}</B>
              : <B v="err" onClick={nuevaPartidaSetup} s={{ flex: 1 }}>{L.nuevaPartida}</B>}
          </div>
        </div>
      </Modal>}

      <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
    </div>
  );
}

// ─── INLINE CELL EDIT (inputs directly in the grid cell) ──
function InlineCellEdit({ ti, hi, existing, editRef, onDone, onClose, onClear, t }) {
  const isEdit = existing != null;
  const [mode, setMode] = useState(() => {
    if (existing?.v !== undefined && existing.v < 0) return "neg";
    return "pos";
  });
  const [base, setBase] = useState(() => {
    if (!existing) return "";
    if (existing.base !== undefined) return String(existing.base);
    return existing.v >= 0 ? String(existing.v ?? 0) : "";
  });
  const [pts, setPts] = useState(() => {
    if (!existing) return "";
    if (existing.pts !== undefined) return String(existing.pts);
    return "";
  });
  const [neg, setNeg] = useState(() => {
    if (!existing) return "";
    if (existing.v !== undefined && existing.v < 0) return String(Math.abs(existing.v));
    return "";
  });

  const baseInputRef = useRef(null);
  const ptsInputRef = useRef(null);
  const negInputRef = useRef(null);

  // Keep editRef in sync with current values
  useEffect(() => {
    editRef.current = { ti, hi, mode, base, pts, neg, wasEdit: isEdit };
  });

  // Auto-focus on mount and mode change
  useEffect(() => {
    setTimeout(() => {
      if (mode === "neg") negInputRef.current?.focus();
      else baseInputRef.current?.focus();
    }, 30);
  }, [mode]);

  const totalVal = (parseInt(base) || 0) + (parseInt(pts) || 0);

  const keyHandler = (next) => (e) => {
    if (e.key === "Enter") { e.preventDefault(); next ? next.current?.focus() : onDone(); }
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  return (
    <div onClick={e => e.stopPropagation()} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      {/* +/− toggle */}
      <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: `1px solid ${t.brd}`, marginBottom: 4 }}>
        <button onClick={() => setMode("pos")} style={{
          padding: "5px 16px", fontSize: 16, fontWeight: 700, border: "none",
          background: mode === "pos" ? t.pri : "transparent",
          color: mode === "pos" ? "#fff" : t.txtM,
          cursor: "pointer", fontFamily: F.sans, touchAction: "manipulation", lineHeight: 1.4,
        }}>+</button>
        <button onClick={() => setMode("neg")} style={{
          padding: "5px 16px", fontSize: 16, fontWeight: 700, border: "none",
          borderLeft: `1px solid ${t.brd}`,
          background: mode === "neg" ? t.err : "transparent",
          color: mode === "neg" ? "#fff" : t.txtM,
          cursor: "pointer", fontFamily: F.sans, touchAction: "manipulation", lineHeight: 1.4,
        }}>−</button>
      </div>
      {mode === "pos" ? (
        <>
          <input ref={baseInputRef} type="number" inputMode="numeric" value={base}
            onChange={e => setBase(e.target.value)} onKeyDown={keyHandler(ptsInputRef)}
            onFocus={e => e.target.select()} placeholder="Base"
            style={{
              width: "85%", background: "transparent", border: "none",
              borderBottom: `1px solid ${t.brd}`,
              padding: "5px 0", fontSize: 22, fontFamily: F.sans, fontWeight: 500,
              color: t.txt, textAlign: "center", outline: "none", borderRadius: 0,
            }} />
          <input ref={ptsInputRef} type="number" inputMode="numeric" value={pts}
            onChange={e => setPts(e.target.value)} onKeyDown={keyHandler(null)}
            onFocus={e => e.target.select()} placeholder="Pts"
            style={{
              width: "85%", background: "transparent", border: "none",
              borderBottom: `1px solid ${t.brd}`,
              padding: "5px 0", fontSize: 22, fontFamily: F.sans, fontWeight: 500,
              color: t.txt, textAlign: "center", outline: "none", borderRadius: 0,
            }} />
          {totalVal !== 0 && <span style={{ fontSize: 15, color: t.ok, fontFamily: F.sans, fontWeight: 600, marginTop: 2 }}>= {totalVal}</span>}
        </>
      ) : (
        <input ref={negInputRef} type="number" inputMode="numeric" value={neg}
          onChange={e => setNeg(e.target.value)} onKeyDown={keyHandler(null)}
          onFocus={e => e.target.select()} placeholder="Pts"
          style={{
            width: "85%", background: "transparent", border: "none",
            borderBottom: `1px solid ${t.err}`,
            padding: "5px 0", fontSize: 22, fontFamily: F.sans, fontWeight: 500,
            color: t.err, textAlign: "center", outline: "none", borderRadius: 0,
          }} />
      )}
      {isEdit && <button onClick={onClear} style={{
        background: "none", border: "none", color: t.err, fontSize: 13,
        fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", marginTop: 2,
        opacity: 0.8, touchAction: "manipulation", textDecoration: "underline",
      }}>borrar</button>}
    </div>
  );
}

export default Burako2;
