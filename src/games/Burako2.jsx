import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, shareResult, vib, vibWin, bajadaReq, B, EN, Modal, UndoBar } from '../lib.jsx';

const DEF_CFG = { tgt: 3000, pura: 200, canasta: 100, cierre: 100, muerto: 100 };

function Burako2({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [setup, setSetup] = useState(true);
  const [pC, setPC] = useState(2);
  const [names, setNames] = useState(["Pareja 1", "Pareja 2"]);
  const [teams, setTeams] = useState([]);
  const [cfg, setCfg] = useState({ ...DEF_CFG });
  const [modal, setModal] = useState(null); // "new" | "reset" | "settings" | "undo"
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [redoHand, setRedoHand] = useState(null);
  const nameRefs = useRef([]);

  // ── Persistence ──
  useEffect(() => {
    ST.load("burako2-game").then(d => {
      if (d?.teams?.length) {
        setTeams(d.teams); setCfg(d.cfg || DEF_CFG); setPC(d.pC || 2); setSetup(false);
        onContinueChange?.("burako2");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (teams.length && !setup) {
      ST.save("burako2-game", { teams, cfg, pC });
      onContinueChange?.("burako2");
    }
  }, [teams, cfg, pC, setup]);

  // ── Setup ──
  const handlePC = (n) => {
    setPC(n);
    setNames(n === 2 ? ["Pareja 1", "Pareja 2"] : Array.from({ length: n }, (_, i) => `Jugador ${i + 1}`));
  };
  const moveNext = (i) => {
    const nx = nameRefs.current[i + 1];
    if (nx) { nx.focus(); nx.select?.(); } else start();
  };
  const start = () => {
    const fresh = names.map(n => ({ name: n.trim() || `Jugador`, hands: [] }));
    setTeams(fresh); setSetup(false);
    ST.save("burako2-game", { teams: fresh, cfg, pC });
    onContinueChange?.("burako2");
  };

  // ── Game logic ──
  const total = (tm) => tm.hands.reduce((s, h) => s + h.v, 0);
  const ren = (i, n) => { const u = [...teams]; u[i] = { ...u[i], name: n }; setTeams(u); };
  const maxHands = Math.max(...teams.map(tm => tm.hands.length), 0);
  const winner = teams.find(tm => total(tm) >= cfg.tgt);

  const initHand = () => { setAdding(true); setEditIdx(null); };
  const startEdit = (hi) => { setEditIdx(hi); setAdding(true); };

  const saveHand = (values) => {
    const prev = clone(teams);
    const u = clone(teams);
    if (editIdx !== null) {
      values.forEach((v, i) => { u[i].hands[editIdx] = { v }; });
    } else {
      values.forEach((v, i) => { u[i].hands.push({ v }); });
    }
    setTeams(u); setAdding(false); setEditIdx(null); setRedoHand(null);
    setToast({ text: editIdx !== null ? L.editHand : L.newHand, undo: () => setTeams(prev) });
    if (sounds && u.some(tm => total(tm) >= cfg.tgt)) vibWin();
  };

  const undoLast = () => {
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
    await ST.save("burako2-game", { teams: r, cfg, pC });
  };
  const resetZ = async () => {
    setTeams([]); setSetup(true); setModal(null);
    await ST.del("burako2-game"); onContinueChange?.(null);
  };
  const doShare = () => shareResult("Burako", teams.map(tm => `${tm.name}: ${total(tm)}`));
  const goBack = async () => {
    if (teams.length && !setup) await ST.save("burako2-game", { teams, cfg, pC });
    onContinueChange?.(teams.length ? "burako2" : null); onBack();
  };

  // ── Loading ──
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div>;

  // ══════════════════════════════════════════════════
  // SETUP
  // ══════════════════════════════════════════════════
  if (setup) return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
      <div style={{ maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontFamily: "'Playfair Display'", fontWeight: 800, color: t.pri, marginBottom: 4 }}>Burako</div>
          <div style={{ fontSize: 13, color: t.txtM }}>¿Cómo juegan?</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[2, 3, 4].map(n => (
            <B key={n} v={pC === n ? "pri" : "gh"} onClick={() => handlePC(n)}
              s={{ flex: 1, fontSize: 15, padding: "14px 10px" }}>
              {n === 2 ? "2 Parejas" : `${n} Jugadores`}
            </B>
          ))}
        </div>

        {names.map((n, i) => (
          <input key={i} autoFocus={i === 0} ref={el => { nameRefs.current[i] = el }}
            value={n} onChange={e => { const u = [...names]; u[i] = e.target.value; setNames(u); }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveNext(i); } }}
            onFocus={e => e.target.select()} enterKeyHint={i === names.length - 1 ? "done" : "next"}
            placeholder={`Equipo ${i + 1}`}
            style={{
              background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12,
              padding: "14px 16px", fontSize: 16, fontFamily: "inherit", outline: "none", width: "100%",
            }} />
        ))}

        <B onClick={start} s={{ width: "100%", minHeight: 52, fontSize: 16 }}>Empezar 🃏</B>

        <button onClick={goBack} style={{
          background: "none", border: "none", color: t.txtM, fontSize: 14,
          cursor: "pointer", padding: 8, touchAction: "manipulation",
        }}>← Volver</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════
  // GAME — NOTEPAD STYLE
  // ══════════════════════════════════════════════════
  const G = 3;
  const COL1 = 40;
  const gridCols = `${COL1}px repeat(${teams.length}, 1fr)`;

  return (
    <div style={{ minHeight: "100dvh", background: t.bg, display: "flex", flexDirection: "column" }}>

      {/* Subtle top bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", flexShrink: 0 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 16, cursor: "pointer", padding: "2px 6px", touchAction: "manipulation" }}>←</button>
        <div style={{ flex: 1 }} />
        <button onClick={doShare} style={{ background: "none", border: "none", color: t.txtM, fontSize: 12, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>📤</button>
        <button onClick={() => setModal("settings")} style={{ background: "none", border: "none", color: t.txtM, fontSize: 12, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>⚙</button>
        <button onClick={() => setModal("new")} style={{ background: "none", border: "none", color: t.txtM, fontSize: 12, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>🔄</button>
      </div>

      {/* Modals */}
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

      {(modal === "new" || modal === "reset" || modal === "undo") && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>
            {modal === "new" ? L.newGame : modal === "undo" ? L.undoQ : L.resetQ}</p>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px" }}>
            {modal === "undo" ? L.undoDesc : L.losesAll}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "new" ? <B onClick={rematch} s={{ flex: 1 }}>Revancha</B>
              : modal === "undo" ? <B v="err" onClick={undoLast} s={{ flex: 1 }}>{L.yesUndo}</B>
              : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}
          </div>
          {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
        </div>
      </Modal>}

      {/* Winner banner */}
      {winner && (
        <div style={{ textAlign: "center", padding: 12, margin: "0 12px 8px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
          <div style={{ fontSize: 18, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} ganan!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
            <B onClick={doShare} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, padding: "6px 12px", minHeight: 32 }}>📤</B>
            <B onClick={rematch} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, padding: "6px 12px", minHeight: 32 }}>Revancha</B>
          </div>
        </div>
      )}

      {/* ══════ LEDGER ══════ */}
      <div style={{ flex: 1, padding: "0 10px", overflowY: "auto" }}>
        <div>
          {/* Team header */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginBottom: G, position: "sticky", top: 0, zIndex: 2 }}>
            <div style={{ padding: 4 }} />
            {teams.map((tm, i) => (
              <div key={i} style={{ padding: "8px 4px 4px", textAlign: "center", background: t.bg }}>
                <EN name={tm.name} onSave={n => ren(i, n)} sz={14} />
                <div style={{ fontSize: 10, color: t.txtF, fontFamily: "'DM Sans'", marginTop: 2 }}>
                  Baja: {bajadaReq(total(tm))}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: t.brd, margin: `0 0 ${G}px` }} />

          {/* Hand rows */}
          {Array.from({ length: maxHands }).map((_, hi) => (
            <div key={hi} style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginBottom: G }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'", fontWeight: 600,
              }}>{hi + 1}</div>
              {teams.map((tm, ti) => {
                const h = tm.hands[hi];
                if (!h) return <div key={ti} style={{ minHeight: 40, borderRadius: 6, border: `1px dashed ${t.brd}30` }} />;
                const v = h.v;
                return (
                  <div key={ti} onClick={() => !adding && startEdit(hi)} style={{
                    padding: "6px 8px", display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, cursor: "pointer", minHeight: 40,
                    background: v >= 0 ? t.okBg + "60" : t.errBg + "60",
                  }}>
                    <span style={{
                      fontFamily: "'Playfair Display'", fontSize: 16, fontWeight: 700,
                      color: v >= 0 ? t.ok : t.err,
                    }}>{v >= 0 ? "+" : ""}{v}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Total row */}
          <div style={{ height: 1, background: t.pri + "40", margin: `${G}px 0` }} />
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: t.txtM, fontFamily: "'DM Sans'", letterSpacing: 1 }}>
            </div>
            {teams.map((tm, i) => (
              <div key={i} style={{ textAlign: "center", padding: "4px 0" }}>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 800, color: t.pri, lineHeight: 1 }}>
                  {total(tm)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ ACTIONS ══════ */}
      <div style={{ padding: "8px 12px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
          <B onClick={initHand} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.newHand}</B>
          {maxHands > 0 && <B v="err" onClick={() => setModal("undo")} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.undo}</B>}
          {redoHand && <B v="gh" onClick={() => {
            const r = clone(teams);
            r.forEach((tm, i) => { if (redoHand[i]) tm.hands.push(redoHand[i]); });
            setTeams(r); setRedoHand(null);
          }} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.redo}</B>}
        </div>
      </div>

      {/* ══════ HAND ENTRY OVERLAY ══════ */}
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

// ─── HAND ENTRY (simple base + puntos per team) ──
function HandEntry({ teams, editIdx, cfg, onSave, onCancel, t, L }) {
  const isEdit = editIdx !== null;
  const [vals, setVals] = useState(() =>
    teams.map((tm, i) => {
      if (isEdit && tm.hands[editIdx]) return { mode: tm.hands[editIdx].v < 0 ? "neg" : "pos", base: "", pts: "", neg: "", raw: tm.hands[editIdx].v };
      return { mode: "pos", base: "", pts: "", neg: "" };
    })
  );

  const getVal = (v) => {
    if (v.mode === "neg") {
      const n = parseInt(v.neg) || 0;
      return n > 0 ? -n : n; // ensure negative
    }
    return (parseInt(v.base) || 0) + (parseInt(v.pts) || 0);
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

  const handleSave = () => {
    onSave(vals.map(v => getVal(v)));
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
        <B onClick={handleSave} s={{ flex: 1, minHeight: 52, fontSize: 16 }}>{L.save} ✓</B>
      </div>
    </div>
  );
}

export default Burako2;
