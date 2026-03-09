import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, vibWin, bajadaReq, fmtDate, F, B, EN, Modal, UndoBar } from '../lib.jsx';

const DEF_CFG = { tgt: 3000, pura: 200, canasta: 100, cierre: 100, muerto: 100 };

// Avatar for teams: "AS" for "Arif - Sofi", "A" for "Arif"
const teamAvatar = (name) => {
  const parts = name.split(/\s*-\s*/);
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return name.charAt(0).toUpperCase();
};

function Burako2({ onBack, onContinueChange, onChangeGame }) {
  const { t, sounds, L } = useApp();
  const [setup, setSetup] = useState(true);
  const [mode, setMode] = useState("par"); // "2j"|"3j"|"par"
  const [names, setNames] = useState(["", "", "", ""]);
  const [teams, setTeams] = useState([]);
  const [cfg, setCfg] = useState({ ...DEF_CFG });
  const [modal, setModal] = useState(null); // "menu"|"settings"|"new"|"reset"|"undo"
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [redoHand, setRedoHand] = useState(null);
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);
  const nameRefs = useRef([]);
  const ledgerRef = useRef(null);

  // ── Persistence ──
  useEffect(() => {
    ST.load("burako2-hist").then(d => { if (Array.isArray(d)) setHist(d) });
    ST.load("burako2-game").then(d => {
      if (d?.teams?.length) {
        setTeams(d.teams);
        setCfg(d.cfg || DEF_CFG);
        setMode(d.mode || (d.teams.length === 3 ? "3j" : "par"));
        setSetup(false);
        onContinueChange?.("burako2");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (teams.length && !setup) {
      ST.save("burako2-game", { teams, cfg, mode });
      onContinueChange?.("burako2");
    }
  }, [teams, cfg, mode, setup]);

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
      const n1 = (names[0].trim() || "Jugador 1") + " - " + (names[1].trim() || "Jugador 2");
      const n2 = (names[2].trim() || "Jugador 3") + " - " + (names[3].trim() || "Jugador 4");
      fresh = [{ name: n1, hands: [] }, { name: n2, hands: [] }];
    } else {
      fresh = names.slice(0, nameCount).map((n, i) => ({ name: n.trim() || `Jugador ${i + 1}`, hands: [] }));
    }
    setTeams(fresh); setSetup(false);
    ST.save("burako2-game", { teams: fresh, cfg, mode });
    onContinueChange?.("burako2");
  };

  // ── Game logic ──
  const handVal = (h) => h.v ?? ((h.base || 0) + (h.pts || 0));
  const total = (tm) => tm.hands.reduce((s, h) => s + handVal(h), 0);
  const ren = (i, n) => { const u = [...teams]; u[i] = { ...u[i], name: n }; setTeams(u); };
  const maxHands = Math.max(...teams.map(tm => tm.hands.length), 0);
  const winner = teams.find(tm => total(tm) >= cfg.tgt);
  const hasBajada = mode === "par";

  const initHand = () => { setAdding(true); setEditIdx(null); };
  const startEdit = (hi) => { setEditIdx(hi); setAdding(true); };

  const saveHand = (handObjs) => {
    const prev = clone(teams);
    const u = clone(teams);
    if (editIdx !== null) {
      handObjs.forEach((h, i) => { u[i].hands[editIdx] = h; });
    } else {
      handObjs.forEach((h, i) => { u[i].hands.push(h); });
    }
    setTeams(u); setAdding(false); setEditIdx(null); setRedoHand(null);
    setToast({ text: editIdx !== null ? L.editHand : L.newHand, undo: () => setTeams(prev) });
    if (sounds && u.some(tm => total(tm) >= cfg.tgt)) vibWin();
    setTimeout(() => {
      if (ledgerRef.current) ledgerRef.current.scrollTop = ledgerRef.current.scrollHeight;
    }, 50);
  };

  const undoLast = () => {
    if (!maxHands) return;
    const u = clone(teams);
    const removed = u.map(tm => tm.hands.pop() || null);
    setTeams(u); setRedoHand(removed); setModal(null);
    setToast({ text: L.undo, redo: () => {
      const r = clone(u); r.forEach((tm, i) => { if (removed[i]) tm.hands.push(removed[i]); });
      setTeams(r); setRedoHand(null);
    }});
  };

  const nuevaPartida = async () => {
    // Save to history if game had hands
    if (teams.some(tm => tm.hands.length > 0)) {
      const entry = { players: teams.map(tm => ({ name: tm.name, t: total(tm) })), date: fmtDate() };
      const nextHist = [entry, ...hist];
      setHist(nextHist);
      await ST.save("burako2-hist", nextHist);
    }
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
    const TITLE_H = 78, HEAD_H = hasBajada ? 54 : 40, HAND_H = 78, TOTAL_H = 68, FOOT_H = 40;
    const H = TITLE_H + HEAD_H + rows * HAND_H + TOTAL_H + FOOT_H;

    const canvas = document.createElement('canvas');
    canvas.width = W * DPR; canvas.height = H * DPR;
    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F6F6F4';
    ctx.fillRect(0, 0, W, 62);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1A5C52';
    ctx.font = '28px Georgia, serif';
    ctx.fillText('BURAKO', W / 2, 34);

    // Date
    const now = new Date();
    const ds = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const ts = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    ctx.fillStyle = '#7A7A78';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`${ds} · ${ts}`, W / 2, 52);

    const Y0 = TITLE_H;

    // Team headers
    teams.forEach((tm, i) => {
      const cx = PAD + i * (COL_W + DIV) + COL_W / 2;
      ctx.fillStyle = '#1A1A1A';
      ctx.font = '14px Georgia, serif';
      ctx.fillText(tm.name, cx, Y0 + 18, COL_W - 10);
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
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(hi + 1).padStart(2, '0'), PAD - 20, rY + 18);
      teams.forEach((tm, ti) => {
        const h = tm.hands[hi];
        if (!h) return;
        const cx = PAD + ti * (COL_W + DIV) + COL_W / 2;
        if (h.base !== undefined) {
          ctx.fillStyle = '#1A1A1A';
          ctx.font = '13px system-ui, sans-serif';
          ctx.textAlign = 'center';
          const bStr = String(h.base), pStr = String(h.pts);
          const bw = Math.max(ctx.measureText(bStr).width, ctx.measureText(pStr).width) + 16;
          ctx.strokeStyle = '#E8E8E6';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx - bw / 2, rY + 6, bw, 18);
          ctx.fillText(bStr, cx, rY + 19);
          ctx.strokeRect(cx - bw / 2, rY + 26, bw, 18);
          ctx.fillText(pStr, cx, rY + 39);
          ctx.beginPath(); ctx.moveTo(cx - bw / 2, rY + 48); ctx.lineTo(cx + bw / 2, rY + 48); ctx.stroke();
          ctx.fillStyle = '#2D7A50';
          ctx.font = '15px Georgia, serif';
          ctx.fillText(String(handVal(h)), cx, rY + 64);
        } else {
          const v = handVal(h);
          ctx.fillStyle = v >= 0 ? '#2D7A50' : '#C23B22';
          ctx.font = '16px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), cx, rY + 42);
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
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.fillText('TOTAL', cx, tY + 18);
      ctx.font = '28px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(total(tm)), cx, tY + 48);
    });

    // Footer
    ctx.fillStyle = '#B5B5B2';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Puntos App · hoja lista para compartir', W / 2, H - 14);

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
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px" }}>
      <button onClick={goBack} style={{
        background: "none", border: "none", color: t.txtM, fontSize: 15, fontFamily: F.sans, fontWeight: 500,
        cursor: "pointer", padding: "8px 12px", touchAction: "manipulation", alignSelf: "flex-start", marginBottom: 16,
      }}>←</button>
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
  );

  // ══════════════════════════════════════════════════
  // GAME — CARD GRID STYLE
  // ══════════════════════════════════════════════════
  const COL1 = 44;
  const gridCols = `${COL1}px repeat(${teams.length}, 1fr)`;

  return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column" }}>

      {/* Top bar with game info */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8, flexShrink: 0, borderBottom: `1px solid ${t.brd}` }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 15, fontFamily: F.sans, fontWeight: 500, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation" }}>←</button>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>
          {maxHands > 0 ? `${maxHands} ${maxHands === 1 ? "mano" : "manos"} · ` : ""}A {cfg.tgt} pts
        </span>
        <div style={{ flex: 1 }} />
        {hist.length > 0 && <button onClick={() => setShowH(!showH)} style={{ background: "none", border: `1px solid ${showH ? t.pri : t.brd}`, borderRadius: 6, color: showH ? t.pri : t.txtM, fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", touchAction: "manipulation" }}>{L.hist}</button>}
        {!winner && <button onClick={() => setModal("menu")} style={{ background: "none", border: `1px solid ${t.brd}`, borderRadius: 6, color: t.txtM, fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", touchAction: "manipulation" }}>Menu</button>}
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
        <div style={{ textAlign: "center", padding: 14, background: t.pri, color: "#fff", flexShrink: 0, animation: "scaleIn .3s ease" }}>
          <div style={{ fontSize: 18, fontFamily: F.serif }}>¡{winner.name} {mode === "par" ? L.winPl : L.winSg}!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            <button onClick={doShare} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: F.sans, padding: "6px 12px", cursor: "pointer" }}>Compartir</button>
            <button onClick={nuevaPartida} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: F.sans, padding: "6px 12px", cursor: "pointer" }}>{L.nuevaPartida}</button>
          </div>
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
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: t.bgS, border: `1.5px solid ${t.brd}`, color: t.pri,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 4px", fontSize: 11, fontWeight: 700, fontFamily: F.sans,
                }}>{teamAvatar(tm.name)}</div>
                <EN name={tm.name} onSave={n => ren(i, n)} sz={20} fw={500} ff={F.sans} />
                {hasBajada && (
                  <div style={{ fontSize: 13, color: t.txtF, fontFamily: F.sans, fontWeight: 500, marginTop: 2 }}>
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
          {maxHands === 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4 }}>
              <div />
              {teams.map((_, ti) => (
                <div key={ti} style={{
                  textAlign: "center", padding: "24px 4px",
                  background: t.card, border: `1px dashed ${t.brd}`, borderRadius: 4,
                }}>
                  <span style={{ color: t.txtF, fontSize: 12, fontFamily: F.sans, opacity: 0.5 }}>—</span>
                </div>
              ))}
            </div>
          ) : Array.from({ length: maxHands }).map((_, hi) => (
            <div key={hi} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4 }}>
              {/* Row number */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: t.txtF, fontFamily: F.sans, fontWeight: 500,
              }}>{hi + 1}</div>
              {/* Team cells */}
              {teams.map((tm, ti) => {
                const h = tm.hands[hi];
                const isLast = hi === maxHands - 1;
                const cumul = tm.hands.slice(0, hi + 1).reduce((s, x) => s + handVal(x), 0);
                return (
                  <div key={ti} onClick={() => !adding && startEdit(hi)} style={{
                    textAlign: "center", cursor: "pointer",
                    background: h ? t.bgS : t.card,
                    border: h ? `1px solid ${t.brd}` : `1px dashed ${t.brd}`,
                    borderRadius: 4,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    minHeight: 64, padding: "8px 4px",
                    transition: "all .2s",
                  }}>
                    {!h ? (
                      <span style={{ color: t.txtF, fontSize: 13, opacity: 0.4 }}>·</span>
                    ) : h.base !== undefined ? (
                      <>
                        <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: t.txt, lineHeight: 1.4 }}>{h.base}</div>
                        <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: t.txt, lineHeight: 1.4 }}>{h.pts}</div>
                        {!isLast && <>
                          <div style={{ height: 1, background: t.txt, opacity: .12, width: "40%", margin: "3px 0 1px" }} />
                          <span style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.txtM }}>{cumul}</span>
                        </>}
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, fontFamily: F.sans, fontWeight: 500, color: handVal(h) >= 0 ? t.txt : t.err, lineHeight: 1.4 }}>
                          {handVal(h)}
                        </div>
                        <div style={{ fontSize: 20, lineHeight: 1.4, visibility: "hidden" }}>{'\u00A0'}</div>
                        {!isLast && <>
                          <div style={{ height: 1, background: t.txt, opacity: .12, width: "40%", margin: "3px 0 1px" }} />
                          <span style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.txtM }}>{cumul}</span>
                        </>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

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
                  <span style={{ fontFamily: F.sans, fontSize: 20, fontWeight: 500, color: t.pri }}>{total(tm)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        {!winner && (
          <div style={{
            display: "flex", gap: 8, justifyContent: "center",
            padding: "16px 12px", maxWidth: 260, margin: "0 auto",
          }}>
            <B onClick={initHand} s={{ flex: 1, minHeight: 40, fontSize: 14 }}>+ Mano</B>
            {maxHands > 0 && (
              <button onClick={() => setModal("undo")} style={{
                background: "transparent", border: `1px solid ${t.brd}`, borderRadius: 6,
                color: t.txtM, fontSize: 12, padding: "8px 14px", cursor: "pointer",
                fontFamily: F.sans, fontWeight: 500, touchAction: "manipulation",
              }}>Deshacer</button>
            )}
          </div>
        )}
      </div>

      {/* ══════ MODALS ══════ */}

      {/* Menu */}
      {modal === "menu" && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 8, padding: 4, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 240, width: "100%" }}>
          {[
            { label: "Compartir", action: doShare },
            { label: "Configuración", action: () => setModal("settings") },
            { label: L.nuevaPartida, action: () => setModal("new") },
            { label: "Reiniciar", action: () => setModal("reset") },
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
            { label: "Pura", key: "pura", step: 10, min: 0 },
            { label: "Canasta", key: "canasta", step: 10, min: 0 },
            { label: "Cierre", key: "cierre", step: 10, min: 0 },
            { label: "Muerto", key: "muerto", step: 10, min: 0 },
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
      {(modal === "new" || modal === "reset" || modal === "undo") && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
          <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>
            {modal === "new" ? `${L.nuevaPartida}?` : modal === "undo" ? L.undoQ : L.resetQ}</p>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>
            {modal === "undo" ? L.undoDesc : modal === "new" ? "Se reinician los puntos a cero." : L.losesAll}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "new" ? <B onClick={nuevaPartida} s={{ flex: 1 }}>{L.nuevaPartida}</B>
              : modal === "undo" ? <B v="err" onClick={undoLast} s={{ flex: 1 }}>{L.yesUndo}</B>
              : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}
          </div>
        </div>
      </Modal>}

      {/* Hand entry overlay */}
      {adding && <HandEntry
        teams={teams} editIdx={editIdx} cfg={cfg}
        onSave={saveHand}
        onCancel={() => { setAdding(false); setEditIdx(null); }}
        t={t} L={L}
      />}

      <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
    </div>
  );
}

// ─── HAND ENTRY ──
function HandEntry({ teams, editIdx, cfg, onSave, onCancel, t, L }) {
  const isEdit = editIdx !== null;
  const formRef = useRef(null);
  const [focusIdx, setFocusIdx] = useState(0);

  const buildVals = () => teams.map((tm) => {
    if (isEdit && tm.hands[editIdx]) {
      const h = tm.hands[editIdx];
      if (h.base !== undefined) {
        return { mode: "pos", base: String(h.base ?? ""), pts: String(h.pts ?? ""), neg: "" };
      }
      const v = h.v ?? 0;
      if (v < 0) return { mode: "neg", base: "", pts: "", neg: String(Math.abs(v)) };
      return { mode: "pos", base: String(v), pts: "0", neg: "" };
    }
    return { mode: "pos", base: "", pts: "", neg: "" };
  });
  const [vals, setVals] = useState(buildVals);

  useEffect(() => {
    setVals(buildVals());
  }, [teams, editIdx]);

  const getInputs = () => Array.from(formRef.current?.querySelectorAll('input[type="number"]') || []);
  const inputCount = () => getInputs().length;
  const isLast = focusIdx >= inputCount() - 1;

  const getHandObj = (v) => {
    if (v.mode === "neg") {
      const n = parseInt(v.neg) || 0;
      return { v: n > 0 ? -n : n };
    }
    const base = parseInt(v.base) || 0;
    const pts = parseInt(v.pts) || 0;
    return { base, pts, v: base + pts };
  };

  const upVal = (i, key, value) => {
    const u = [...vals];
    u[i] = { ...u[i], [key]: value };
    setVals(u);
  };

  const toggleMode = (i) => {
    const u = [...vals];
    u[i] = { ...u[i], mode: u[i].mode === "pos" ? "neg" : "pos" };
    setVals(u);
  };

  const advanceNext = () => {
    const inputs = getInputs();
    if (focusIdx < inputs.length - 1) {
      inputs[focusIdx + 1].focus();
      setFocusIdx(focusIdx + 1);
    } else {
      onSave(vals.map(v => getHandObj(v)));
    }
  };

  // Track focus index when user taps an input directly
  const handleFocus = (e) => {
    const inputs = getInputs();
    const idx = inputs.indexOf(e.target);
    if (idx >= 0) setFocusIdx(idx);
  };

  // Enter advances through inputs, last Enter saves (desktop)
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    advanceNext();
  };

  // Keep bottom bar visible above iOS keyboard
  const [barBottom, setBarBottom] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const off = window.innerHeight - vv.height - vv.offsetTop;
      setBarBottom(Math.max(0, off));
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => { vv.removeEventListener("resize", onResize); vv.removeEventListener("scroll", onResize); };
  }, []);

  return (
    <div ref={formRef} style={{
      position: "fixed", inset: 0, background: t.bg, zIndex: 80,
      display: "flex", flexDirection: "column", overflow: "auto", animation: "fadeUp .2s ease",
    }}>
      <div style={{ padding: "14px 16px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>
          {isEdit ? `Editar mano ${editIdx + 1}` : "Nueva mano"}
        </span>
      </div>

      <div style={{ flex: 1, padding: "0 24px", overflow: "auto", paddingBottom: barBottom > 0 ? barBottom + 60 : 0 }}>
        {teams.map((tm, i) => (
          <div key={i} style={{ padding: "16px 0", borderBottom: i < teams.length - 1 ? `1px solid ${t.brd}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontFamily: F.serif, color: t.pri }}>{tm.name}</span>
              <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${t.brd}` }}>
                <button onClick={() => { if (vals[i].mode !== "pos") toggleMode(i) }} style={{
                  background: vals[i].mode === "pos" ? t.pri : "transparent",
                  border: "none", padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  color: vals[i].mode === "pos" ? "#fff" : t.txtM,
                  cursor: "pointer", fontFamily: F.sans,
                }}>Sumó</button>
                <button onClick={() => { if (vals[i].mode !== "neg") toggleMode(i) }} style={{
                  background: vals[i].mode === "neg" ? t.err : "transparent",
                  border: "none", borderLeft: `1px solid ${t.brd}`, padding: "4px 10px", fontSize: 11, fontWeight: 600,
                  color: vals[i].mode === "neg" ? "#fff" : t.txtM,
                  cursor: "pointer", fontFamily: F.sans,
                }}>Restó</button>
              </div>
            </div>

            {vals[i].mode === "pos" ? (
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: F.sans, letterSpacing: 1, textTransform: "uppercase" }}>Base</div>
                  <input type="number" inputMode="numeric" value={vals[i].base}
                    autoFocus={i === 0}
                    onChange={e => upVal(i, "base", e.target.value)}
                    onKeyDown={handleKeyDown} onFocus={handleFocus}
                    enterKeyHint="next"
                    placeholder="0"
                    style={{
                      width: "100%", background: "transparent", border: "none", borderBottom: `1.5px solid ${t.brd}`,
                      padding: "8px 0", fontSize: 22, fontFamily: F.serif, color: t.pri, textAlign: "center", outline: "none", borderRadius: 0,
                    }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: F.sans, letterSpacing: 1, textTransform: "uppercase" }}>Puntos</div>
                  <input type="number" inputMode="numeric" value={vals[i].pts}
                    onChange={e => upVal(i, "pts", e.target.value)}
                    onKeyDown={handleKeyDown} onFocus={handleFocus}
                    enterKeyHint={i === teams.length - 1 ? "done" : "next"}
                    placeholder="0"
                    style={{
                      width: "100%", background: "transparent", border: "none", borderBottom: `1.5px solid ${t.brd}`,
                      padding: "8px 0", fontSize: 22, fontFamily: F.serif, color: t.pri, textAlign: "center", outline: "none", borderRadius: 0,
                    }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
                  <span style={{ fontSize: 16, fontFamily: F.serif, color: t.ok }}>
                    = {(parseInt(vals[i].base) || 0) + (parseInt(vals[i].pts) || 0)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: F.sans, letterSpacing: 1, textTransform: "uppercase" }}>Puntos a restar</div>
                <input type="number" inputMode="numeric" value={vals[i].neg}
                  autoFocus={i === 0}
                  onChange={e => upVal(i, "neg", e.target.value)}
                  onKeyDown={handleKeyDown} onFocus={handleFocus}
                  enterKeyHint={i === teams.length - 1 ? "done" : "next"}
                  placeholder="0"
                  style={{
                    width: "100%", background: "transparent", border: "none", borderBottom: `1.5px solid ${t.err}`,
                    padding: "8px 0", fontSize: 24, fontFamily: F.serif, color: t.err, textAlign: "center", outline: "none", borderRadius: 0,
                  }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        position: "fixed", left: 0, right: 0, bottom: barBottom,
        padding: "8px 24px", paddingBottom: barBottom > 0 ? 8 : 24,
        display: "flex", gap: 10, background: t.bg, borderTop: `1px solid ${t.brd}`, zIndex: 81,
      }}>
        <button onClick={onCancel} style={{
          flex: 0, minHeight: 48, padding: "0 20px", background: "transparent", border: `1px solid ${t.brd}`,
          borderRadius: 8, color: t.txtM, fontSize: 14, fontFamily: F.sans, cursor: "pointer", touchAction: "manipulation",
        }}>{L.back}</button>
        <B onClick={advanceNext} s={{ flex: 1, minHeight: 48, fontSize: 16 }}>
          {isLast ? "Guardar ✓" : "Siguiente →"}
        </B>
      </div>
    </div>
  );
}

export default Burako2;
