import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, bajadaReq, B, EN, Modal, UndoBar } from '../lib.jsx';

const DEF_CFG = { tgt: 3000, pura: 200, canasta: 100, cierre: 100, muerto: 100 };

function Burako2({ onBack, onContinueChange }) {
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
  const nameRefs = useRef([]);
  const ledgerRef = useRef(null);

  // ── Persistence ──
  useEffect(() => {
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

  const rematch = async () => {
    const r = teams.map(tm => ({ ...tm, hands: [] }));
    setTeams(r); setModal(null);
    await ST.save("burako2-game", { teams: r, cfg, mode });
  };

  const resetZ = async () => {
    setTeams([]); setSetup(true); setModal(null);
    await ST.del("burako2-game"); onContinueChange?.(null);
  };

  const goBack = async () => {
    if (teams.length && !setup) await ST.save("burako2-game", { teams, cfg, mode });
    onContinueChange?.(teams.length ? "burako2" : null); onBack();
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
    ctx.fillStyle = '#FBF7F0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#F3ECE3';
    ctx.fillRect(0, 0, W, 62);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5D4E37';
    ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
    ctx.fillText('BURAKO', W / 2, 34);

    // Date
    const now = new Date();
    const ds = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const ts = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    ctx.fillStyle = '#A09080';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText(`${ds} · ${ts}`, W / 2, 52);

    const Y0 = TITLE_H;

    // Team headers
    teams.forEach((tm, i) => {
      const cx = PAD + i * (COL_W + DIV) + COL_W / 2;
      ctx.fillStyle = '#5D4E37';
      ctx.font = 'bold 14px "Playfair Display", Georgia, serif';
      ctx.fillText(tm.name, cx, Y0 + 18, COL_W - 10);
      if (hasBajada) {
        ctx.fillStyle = '#A09080';
        ctx.font = '10px "DM Sans", sans-serif';
        ctx.fillText(`Baja: ${bajadaReq(total(tm))}`, cx, Y0 + 32);
      }
    });

    // Header line
    const hY = Y0 + HEAD_H;
    ctx.strokeStyle = '#5D4E37';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, hY); ctx.lineTo(W - PAD, hY); ctx.stroke();

    // Vertical dividers
    for (let i = 1; i < nCols; i++) {
      const x = PAD + i * COL_W + (i - 0.5) * DIV;
      ctx.strokeStyle = '#D0C8C0';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x, hY); ctx.lineTo(x, hY + rows * HAND_H); ctx.stroke();
    }

    // Hands
    for (let hi = 0; hi < rows; hi++) {
      const rY = hY + hi * HAND_H;
      ctx.fillStyle = '#B7AA9B';
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(String(hi + 1).padStart(2, '0'), PAD - 20, rY + 18);
      teams.forEach((tm, ti) => {
        const h = tm.hands[hi];
        if (!h) return;
        const cx = PAD + ti * (COL_W + DIV) + COL_W / 2;
        if (h.base !== undefined) {
          ctx.fillStyle = '#3D3428';
          ctx.font = '13px "DM Sans", sans-serif';
          ctx.textAlign = 'center';
          const bStr = String(h.base), pStr = String(h.pts);
          const bw = Math.max(ctx.measureText(bStr).width, ctx.measureText(pStr).width) + 16;
          ctx.strokeStyle = '#D0C8C0';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cx - bw / 2, rY + 6, bw, 18);
          ctx.fillText(bStr, cx, rY + 19);
          ctx.strokeRect(cx - bw / 2, rY + 26, bw, 18);
          ctx.fillText(pStr, cx, rY + 39);
          ctx.beginPath(); ctx.moveTo(cx - bw / 2, rY + 48); ctx.lineTo(cx + bw / 2, rY + 48); ctx.stroke();
          ctx.fillStyle = '#4A7C59';
          ctx.font = 'bold 15px "Playfair Display", Georgia, serif';
          ctx.fillText(String(handVal(h)), cx, rY + 64);
        } else {
          const v = handVal(h);
          ctx.fillStyle = v >= 0 ? '#4A7C59' : '#C0392B';
          ctx.font = 'bold 16px "Playfair Display", Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), cx, rY + 42);
        }
      });
      if (hi < rows - 1) {
        ctx.strokeStyle = '#E8E0D8'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PAD + 10, rY + HAND_H); ctx.lineTo(W - PAD - 10, rY + HAND_H); ctx.stroke();
      }
    }

    // Total line
    const tY = hY + rows * HAND_H;
    ctx.strokeStyle = '#5D4E37'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, tY); ctx.lineTo(W - PAD, tY); ctx.stroke();

    // Totals
    teams.forEach((tm, i) => {
      const cx = PAD + i * (COL_W + DIV) + COL_W / 2;
      ctx.fillStyle = '#5D4E37';
      ctx.font = 'bold 12px "DM Sans", sans-serif';
      ctx.fillText('TOTAL', cx, tY + 18);
      ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(total(tm)), cx, tY + 48);
    });

    // Footer
    ctx.fillStyle = '#C0B8B0';
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Puntos App · hoja lista para compartir', W / 2, H - 14);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], `burako-${ds.replace(/\//g, '-')}.png`, { type: 'image/png' });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Burako - Puntos' });
          return;
        }
      } catch {}
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
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
      <div style={{ maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontFamily: "'Playfair Display'", fontWeight: 800, color: t.pri, marginBottom: 4 }}>Burako</div>
          <div style={{ fontSize: 13, color: t.txtM }}>¿Cómo juegan?</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "2j", label: "2 Jugadores" },
            { key: "3j", label: "3 Jugadores" },
            { key: "par", label: "2 Parejas" },
          ].map(m => (
            <B key={m.key} v={mode === m.key ? "pri" : "gh"} onClick={() => handleMode(m.key)}
              s={{ flex: 1, fontSize: 13, padding: "12px 6px" }}>
              {m.label}
            </B>
          ))}
        </div>

        {mode === "par" ? (
          <>
            {[0, 1].map(pair => (
              <div key={pair}>
                <div style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'", marginBottom: 6, fontWeight: 600 }}>
                  {pair === 0 ? "Primera pareja" : "Segunda pareja"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1].map(j => {
                    const idx = pair * 2 + j;
                    return (
                      <input key={idx} ref={el => { nameRefs.current[idx] = el }}
                        autoFocus={idx === 0}
                        value={names[idx]} onChange={e => { const u = [...names]; u[idx] = e.target.value; setNames(u); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveNext(idx); } }}
                        onFocus={e => e.target.select()}
                        enterKeyHint={idx === 3 ? "done" : "next"}
                        placeholder={`Jugador ${idx + 1}`}
                        style={{
                          flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 10,
                          padding: "12px 12px", fontSize: 15, fontFamily: "inherit", outline: "none",
                        }} />
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          names.slice(0, nameCount).map((n, i) => (
            <input key={i} autoFocus={i === 0} ref={el => { nameRefs.current[i] = el }}
              value={n} onChange={e => { const u = [...names]; u[i] = e.target.value; setNames(u); }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveNext(i); } }}
              onFocus={e => e.target.select()} enterKeyHint={i === nameCount - 1 ? "done" : "next"}
              placeholder={`Jugador ${i + 1}`}
              style={{
                background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12,
                padding: "14px 16px", fontSize: 16, fontFamily: "inherit", outline: "none", width: "100%",
              }} />
          ))
        )}

        <B onClick={start} s={{ width: "100%", minHeight: 52, fontSize: 16 }}>Empezar 🃏</B>

        <button onClick={goBack} style={{
          background: "none", border: "none", color: t.txtM, fontSize: 14,
          cursor: "pointer", padding: 8, touchAction: "manipulation",
        }}>← Volver</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════
  // GAME — NOTEBOOK STYLE
  // ══════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column" }}>

      {/* Minimal top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 8px", flexShrink: 0, minHeight: 34 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: "2px 4px", touchAction: "manipulation" }}>←</button>
        <div style={{ flex: 1 }} />
        <button onClick={() => setModal("menu")} style={{ background: "none", border: "none", color: t.txtM + "90", fontSize: 14, cursor: "pointer", padding: "2px 6px", touchAction: "manipulation", letterSpacing: 2 }}>⋯</button>
      </div>

      {/* Winner banner */}
      {winner && (
        <div style={{ textAlign: "center", padding: 10, margin: "0 10px 6px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 12, color: "#fff" }}>
          <div style={{ fontSize: 16, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} ganan!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
            <B onClick={doShare} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "4px 10px", minHeight: 28 }}>📤</B>
            <B onClick={rematch} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "4px 10px", minHeight: 28 }}>Revancha</B>
          </div>
        </div>
      )}

      {/* ══════ NOTEBOOK LEDGER ══════ */}
      <div ref={ledgerRef} style={{ flex: 1, overflowY: "auto", padding: "0 6px 90px" }}>

        {/* Team headers — sticky */}
        <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 2, background: t.bg }}>
          {teams.map((tm, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: 1, background: t.brd, flexShrink: 0 }} />}
              <div style={{ flex: 1, textAlign: "center", padding: "6px 4px 4px" }}>
                <EN name={tm.name} onSave={n => ren(i, n)} sz={mode === "par" ? 13 : 15} />
                {hasBajada && (
                  <div style={{ fontSize: 10, color: t.txtF, fontFamily: "'DM Sans'", marginTop: 1 }}>
                    Baja: {bajadaReq(total(tm))}
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div style={{ height: 2, background: t.pri + "40" }} />

        {/* Hand rows */}
        {Array.from({ length: maxHands }).map((_, hi) => (
          <div key={hi}>
            <div style={{ display: "flex" }}>
              {teams.map((tm, ti) => {
                const h = tm.hands[hi];
                return (
                  <React.Fragment key={ti}>
                    {ti > 0 && <div style={{ width: 1, background: t.brd + "40", flexShrink: 0 }} />}
                    <div
                      onClick={() => !adding && startEdit(hi)}
                      style={{ flex: 1, padding: "8px 12px", cursor: "pointer", minHeight: 50 }}
                    >
                      {!h ? (
                        <div style={{ height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 11, color: t.brd }}>—</span>
                        </div>
                      ) : h.base !== undefined ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{
                            border: `1px solid ${t.brd}60`, borderRadius: 3, padding: "1px 10px",
                            fontSize: 14, fontFamily: "'DM Sans'", fontWeight: 600, color: t.txt,
                            textAlign: "center", minWidth: 44,
                          }}>{h.base}</div>
                          <div style={{
                            border: `1px solid ${t.brd}60`, borderRadius: 3, padding: "1px 10px",
                            fontSize: 14, fontFamily: "'DM Sans'", fontWeight: 600, color: t.txt,
                            textAlign: "center", minWidth: 44, marginTop: 2,
                          }}>{h.pts}</div>
                          <div style={{ height: 1, background: t.txt + "20", margin: "4px 8px 2px", width: "50%" }} />
                          <div style={{ fontSize: 15, fontFamily: "'Playfair Display'", fontWeight: 800, color: t.ok }}>{handVal(h)}</div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 34 }}>
                          <span style={{ fontSize: 16, fontFamily: "'Playfair Display'", fontWeight: 800, color: handVal(h) >= 0 ? t.ok : t.err }}>
                            {handVal(h)}
                          </span>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            <div style={{ height: 1, background: t.brd + "20", margin: "0 12px" }} />
          </div>
        ))}

        {/* Total row */}
        <div style={{ height: 2, background: t.pri + "40", margin: "4px 0" }} />
        <div style={{ display: "flex", paddingBottom: 6 }}>
          {teams.map((tm, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{ width: 1, background: t.pri + "40", flexShrink: 0 }} />}
              <div style={{ flex: 1, textAlign: "center", padding: "6px 4px" }}>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 800, color: t.pri, lineHeight: 1 }}>
                  {total(tm)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Action buttons — inside scroll, right after total */}
        <div style={{
          position: "sticky", bottom: 0, zIndex: 3, display: "flex", gap: 8, justifyContent: "center",
          padding: "10px 12px 12px", maxWidth: 280, margin: "0 auto", background: `linear-gradient(180deg, ${t.bg}00, ${t.bg} 26%, ${t.bg} 100%)`
        }}>
          <B onClick={initHand} s={{ flex: 1, minHeight: 32, padding: "6px 10px", fontSize: 12 }}>+ Mano</B>
          {maxHands > 0 && (
            <button onClick={() => setModal("undo")} style={{
              background: "none", border: `1px solid ${t.brd}`, borderRadius: 10,
              color: t.txtM, fontSize: 11, padding: "6px 10px", cursor: "pointer",
              fontFamily: "'DM Sans'", touchAction: "manipulation",
            }}>Deshacer</button>
          )}
        </div>
      </div>

      {/* ══════ MODALS ══════ */}

      {/* Menu */}
      {modal === "menu" && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 14, padding: 6, boxShadow: t.shH, maxWidth: 260, width: "100%" }}>
          {[
            { icon: "📤", label: "Compartir", action: doShare },
            { icon: "⚙", label: "Configuración", action: () => setModal("settings") },
            { icon: "🔄", label: "Revancha", action: () => setModal("new") },
            { icon: "🗑", label: "Reiniciar", action: () => setModal("reset") },
          ].map((item, i) => (
            <button key={i} onClick={item.action} style={{
              display: "block", width: "100%", textAlign: "left", padding: "13px 14px",
              background: "none", border: "none", color: t.txt, fontSize: 14,
              cursor: "pointer", borderRadius: 8, fontFamily: "'DM Sans'",
              touchAction: "manipulation",
            }}>{item.icon} {item.label}</button>
          ))}
        </div>
      </Modal>}

      {/* Settings */}
      {modal === "settings" && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 16, padding: 20, boxShadow: t.shH, maxWidth: 320, width: "100%" }}>
          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display'", marginBottom: 12, color: t.pri }}>Configuración</div>
          {[
            { label: "Objetivo", key: "tgt", step: 500, min: 500 },
            { label: "Pura", key: "pura", step: 10, min: 0 },
            { label: "Canasta", key: "canasta", step: 10, min: 0 },
            { label: "Cierre", key: "cierre", step: 10, min: 0 },
            { label: "Muerto", key: "muerto", step: 10, min: 0 },
          ].map(f => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.brd}20` }}>
              <span style={{ fontSize: 13, color: t.txt }}>{f.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setCfg({ ...cfg, [f.key]: Math.max(f.min, cfg[f.key] - f.step) })}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.brd}`, background: t.bgS, color: t.txt, fontSize: 16, cursor: "pointer" }}>−</button>
                <span style={{ fontFamily: "'Playfair Display'", fontSize: 16, fontWeight: 700, color: t.pri, minWidth: 50, textAlign: "center" }}>{cfg[f.key]}</span>
                <button onClick={() => setCfg({ ...cfg, [f.key]: cfg[f.key] + f.step })}
                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.brd}`, background: t.bgS, color: t.txt, fontSize: 16, cursor: "pointer" }}>+</button>
              </div>
            </div>
          ))}
          <B v="gh" onClick={() => setModal(null)} s={{ width: "100%", marginTop: 12 }}>Cerrar</B>
        </div>
      </Modal>}

      {/* Confirm modals */}
      {(modal === "new" || modal === "reset" || modal === "undo") && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>
            {modal === "new" ? "¿Revancha?" : modal === "undo" ? L.undoQ : L.resetQ}</p>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px" }}>
            {modal === "undo" ? L.undoDesc : modal === "new" ? "Se reinician los puntos" : L.losesAll}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "new" ? <B onClick={rematch} s={{ flex: 1 }}>Revancha</B>
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

  return (
    <div style={{
      position: "fixed", inset: 0, background: t.bg, zIndex: 80,
      display: "flex", flexDirection: "column", overflow: "auto",
    }}>
      <div style={{ padding: "14px 16px 8px", flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: t.txtM, fontFamily: "'DM Sans'" }}>
          {isEdit ? `Editar mano ${editIdx + 1}` : "Nueva mano"}
        </span>
      </div>

      <div style={{ flex: 1, padding: "0 20px", overflow: "auto" }}>
        {teams.map((tm, i) => (
          <div key={i} style={{
            background: t.card, border: `1px solid ${t.brd}`, borderRadius: 14,
            padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display'", color: t.pri }}>{tm.name}</span>
              <button onClick={() => toggleMode(i)} style={{
                background: vals[i].mode === "neg" ? t.errBg : t.okBg,
                border: `1px solid ${vals[i].mode === "neg" ? t.err + "40" : t.ok + "40"}`,
                borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700,
                color: vals[i].mode === "neg" ? t.err : t.ok,
                cursor: "pointer", touchAction: "manipulation", fontFamily: "'DM Sans'",
              }}>{vals[i].mode === "neg" ? "Restó" : "Sumó"}</button>
            </div>

            {vals[i].mode === "pos" ? (
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>Base</div>
                  <input type="number" inputMode="numeric" value={vals[i].base}
                    onChange={e => upVal(i, "base", e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%", background: t.bgS, border: `1px solid ${t.brd}`,
                      borderRadius: 10, padding: "12px 10px", fontSize: 20, fontWeight: 700,
                      fontFamily: "'Playfair Display'", color: t.pri, textAlign: "center", outline: "none",
                    }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>Puntos</div>
                  <input type="number" inputMode="numeric" value={vals[i].pts}
                    onChange={e => upVal(i, "pts", e.target.value)}
                    placeholder="0"
                    style={{
                      width: "100%", background: t.bgS, border: `1px solid ${t.brd}`,
                      borderRadius: 10, padding: "12px 10px", fontSize: 20, fontWeight: 700,
                      fontFamily: "'Playfair Display'", color: t.pri, textAlign: "center", outline: "none",
                    }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
                  <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'" }}>
                    = <span style={{ fontWeight: 700, color: t.ok, fontSize: 16, fontFamily: "'Playfair Display'" }}>
                      {(parseInt(vals[i].base) || 0) + (parseInt(vals[i].pts) || 0)}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>Puntos a restar</div>
                <input type="number" inputMode="numeric" value={vals[i].neg}
                  onChange={e => upVal(i, "neg", e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%", background: t.errBg, border: `1px solid ${t.err}30`,
                    borderRadius: 10, padding: "12px 10px", fontSize: 24, fontWeight: 700,
                    fontFamily: "'Playfair Display'", color: t.err, textAlign: "center", outline: "none",
                  }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: "8px 20px 24px", flexShrink: 0, display: "flex", gap: 10 }}>
        <B v="gh" onClick={onCancel} s={{ flex: 1, minHeight: 52, fontSize: 16 }}>{L.back}</B>
        <B onClick={() => onSave(vals.map(v => getHandObj(v)))} s={{ flex: 1, minHeight: 52, fontSize: 16 }}>{L.save} ✓</B>
      </div>
    </div>
  );
}

export default Burako2;
