import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, vibWin, bajadaReq, B, EN, Hdr, NI, IcoBtn, Modal, UndoBar } from '../lib.jsx';

const BK_D = { pura: 200, canasta: 100, cierre: 100, muerto: 100 };

// ─── HAND WIZARD (step-by-step) ──────────────
function HandWizard({ teams, cfg, calc, hf, setHf, onSave, onCancel, editIdx, L, t }) {
  const N = teams.length;
  // Steps: N teams × 4 fields (puras, canastas, puntos, muerto) + 1 cierre + 1 confirm
  const totalSteps = N * 4 + 2;
  const [step, setStep] = useState(0);

  const getStepInfo = (s) => {
    if (s < N * 4) {
      const teamIdx = Math.floor(s / 4);
      const field = s % 4; // 0=puras, 1=canastas, 2=puntos, 3=muerto
      return { type: "field", teamIdx, field };
    }
    if (s === N * 4) return { type: "cierre" };
    return { type: "confirm" };
  };

  const info = getStepInfo(step);

  const upField = (teamIdx, key, value) => {
    const u = [...hf];
    u[teamIdx] = { ...u[teamIdx], [key]: value };
    setHf(u);
  };

  const goNext = () => { if (step < totalSteps - 1) setStep(step + 1); };
  const goBack = () => { if (step > 0) setStep(step - 1); else onCancel(); };

  const progress = (step + 1) / totalSteps;

  const fieldKeys = ["pura", "canasta", "puntos"];
  const fieldLabels = [L.puras, L.canastas, L.puntos];
  const fieldSteps = [1, 1, 5];
  const fieldMins = [0, 0, undefined];

  return (
    <div style={{
      position: "fixed", inset: 0, background: t.bg, zIndex: 80,
      display: "flex", flexDirection: "column",
    }}>
      {/* Progress bar */}
      <div style={{ height: 4, background: t.bgS, flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${progress * 100}%`,
          background: t.pri, transition: "width .3s", borderRadius: 2 }} />
      </div>

      {/* Header */}
      <div style={{ padding: "10px 16px 4px", flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'" }}>
          {editIdx !== null ? L.editHand : L.newHand} · {step + 1}/{totalSteps}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", overflow: "auto" }}>

        {/* ── Number field (puras/canastas/puntos) ── */}
        {info.type === "field" && info.field < 3 && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 14, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>{teams[info.teamIdx].name}</div>
            <div style={{ fontSize: 22, fontFamily: "'Playfair Display'", fontWeight: 700, color: t.pri, marginBottom: 32 }}>
              {fieldLabels[info.field]}
            </div>

            <div style={{ fontSize: 64, fontFamily: "'Playfair Display'", fontWeight: 800, color: t.pri, marginBottom: 24, lineHeight: 1 }}>
              {hf[info.teamIdx]?.[fieldKeys[info.field]] || 0}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <button onClick={() => {
                const cur = hf[info.teamIdx]?.[fieldKeys[info.field]] || 0;
                const min = fieldMins[info.field];
                const nv = min !== undefined ? Math.max(min, cur - fieldSteps[info.field]) : cur - fieldSteps[info.field];
                upField(info.teamIdx, fieldKeys[info.field], nv);
                vib();
              }} style={{
                flex: 1, height: 64, fontSize: 28, borderRadius: 16,
                background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt,
                cursor: "pointer", touchAction: "manipulation", fontWeight: 700,
              }}>−</button>
              <button onClick={() => {
                const cur = hf[info.teamIdx]?.[fieldKeys[info.field]] || 0;
                upField(info.teamIdx, fieldKeys[info.field], cur + fieldSteps[info.field]);
                vib();
              }} style={{
                flex: 1, height: 64, fontSize: 28, borderRadius: 16,
                background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt,
                cursor: "pointer", touchAction: "manipulation", fontWeight: 700,
              }}>+</button>
            </div>

            {/* Running breakdown */}
            <div style={{
              background: t.card, border: `1px solid ${t.brd}`, borderRadius: 12,
              padding: "10px 14px", marginBottom: 20, width: "100%", maxWidth: 380,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontFamily: "'DM Sans'" }}>
                {(hf[info.teamIdx]?.pura || 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: t.txtM }}>
                    <span>{hf[info.teamIdx].pura} {L.puras}</span>
                    <span style={{ color: t.ok }}>+{hf[info.teamIdx].pura * cfg.pura}</span>
                  </div>
                )}
                {(hf[info.teamIdx]?.canasta || 0) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: t.txtM }}>
                    <span>{hf[info.teamIdx].canasta} {L.canastas}</span>
                    <span style={{ color: t.ok }}>+{hf[info.teamIdx].canasta * cfg.canasta}</span>
                  </div>
                )}
                {(hf[info.teamIdx]?.puntos || 0) !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: t.txtM }}>
                    <span>{L.puntos}</span>
                    <span style={{ color: hf[info.teamIdx].puntos >= 0 ? t.ok : t.err }}>
                      {hf[info.teamIdx].puntos >= 0 ? "+" : ""}{hf[info.teamIdx].puntos}
                    </span>
                  </div>
                )}
                <div style={{ borderTop: `1px solid ${t.brd}`, paddingTop: 4, marginTop: 2,
                  display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span style={{ color: t.txt, fontSize: 14 }}>Total</span>
                  <span style={{
                    fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 800,
                    color: calc(hf[info.teamIdx]) >= 0 ? t.ok : t.err,
                  }}>
                    {calc(hf[info.teamIdx]) >= 0 ? "+" : ""}{calc(hf[info.teamIdx])}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 380 }}>
              <B v="gh" onClick={goBack} s={{ flex: 1, minHeight: 56, fontSize: 17 }}>{L.back}</B>
              <B onClick={goNext} s={{ flex: 1, minHeight: 56, fontSize: 17 }}>{L.next}</B>
            </div>
          </div>
        )}

        {/* ── Muerto (yes/no) ── */}
        {info.type === "field" && info.field === 3 && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 14, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>{teams[info.teamIdx].name}</div>
            <div style={{ fontSize: 22, fontFamily: "'Playfair Display'", fontWeight: 700, color: t.pri, marginBottom: 40 }}>
              {L.playedDead}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { upField(info.teamIdx, "muerto", true); vib(); goNext(); }}
                style={{
                  flex: 1, height: 72, fontSize: 20, fontWeight: 700, borderRadius: 16,
                  background: hf[info.teamIdx]?.muerto ? t.pri : t.bgS,
                  color: hf[info.teamIdx]?.muerto ? "#fff" : t.txt,
                  border: hf[info.teamIdx]?.muerto ? "none" : `1px solid ${t.brd}`,
                  cursor: "pointer", touchAction: "manipulation", fontFamily: "'DM Sans'",
                }}>{L.yes}</button>
              <button onClick={() => { upField(info.teamIdx, "muerto", false); vib(); goNext(); }}
                style={{
                  flex: 1, height: 72, fontSize: 20, fontWeight: 700, borderRadius: 16,
                  background: !hf[info.teamIdx]?.muerto ? t.err : t.bgS,
                  color: !hf[info.teamIdx]?.muerto ? "#fff" : t.txt,
                  border: !hf[info.teamIdx]?.muerto ? "none" : `1px solid ${t.brd}`,
                  cursor: "pointer", touchAction: "manipulation", fontFamily: "'DM Sans'",
                }}>No</button>
            </div>
            <B v="gh" onClick={goBack} s={{ width: "100%", maxWidth: 380, marginTop: 16, minHeight: 48 }}>{L.back}</B>
          </div>
        )}

        {/* ── Who closed? ── */}
        {info.type === "cierre" && (
          <div style={{ textAlign: "center", width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 22, fontFamily: "'Playfair Display'", fontWeight: 700, color: t.pri, marginBottom: 32 }}>
              {L.whoClosed}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {teams.map((tm, i) => (
                <button key={i} onClick={() => {
                  const u = hf.map((h, j) => ({ ...h, cierre: j === i }));
                  setHf(u);
                  vib();
                  goNext();
                }} style={{
                  width: "100%", height: 64, fontSize: 18, fontWeight: 700, borderRadius: 16,
                  background: hf[i]?.cierre ? t.ok : t.card,
                  color: hf[i]?.cierre ? "#fff" : t.txt,
                  border: `1px solid ${hf[i]?.cierre ? t.ok : t.brd}`,
                  cursor: "pointer", touchAction: "manipulation",
                  fontFamily: "'Playfair Display'",
                }}>{tm.name}</button>
              ))}
            </div>
            <B v="gh" onClick={goBack} s={{ width: "100%", maxWidth: 380, marginTop: 16, minHeight: 48 }}>{L.back}</B>
          </div>
        )}

        {/* ── Confirmation ── */}
        {info.type === "confirm" && (
          <div style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 22, fontFamily: "'Playfair Display'", fontWeight: 700, color: t.pri, marginBottom: 20, textAlign: "center" }}>
              {L.handSummary}
            </div>

            {teams.map((tm, i) => {
              const h = hf[i];
              const s = calc(h);
              return (
                <div key={i} style={{ background: t.card, borderRadius: 14, padding: 16, marginBottom: 12, border: `1px solid ${t.brd}` }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: t.pri, fontFamily: "'Playfair Display'", marginBottom: 8 }}>{tm.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 14, color: t.txt }}>
                    <span style={{ color: t.txtM }}>{L.puras}:</span><span>{h.pura || 0}</span>
                    <span style={{ color: t.txtM }}>{L.canastas}:</span><span>{h.canasta || 0}</span>
                    <span style={{ color: t.txtM }}>{L.puntos}:</span><span>{h.puntos || 0}</span>
                    <span style={{ color: t.txtM }}>{L.closed}:</span><span>{h.cierre ? "✓" : "—"}</span>
                    <span style={{ color: t.txtM }}>{L.playedDead}:</span><span>{h.muerto ? "✓" : "—"}</span>
                  </div>
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.brd}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, color: t.txtM }}>{L.sub}</span>
                    <span style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 700, color: s >= 0 ? t.ok : t.err }}>
                      {s >= 0 ? "+" : ""}{s}
                    </span>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <B v="gh" onClick={goBack} s={{ flex: 1, minHeight: 56, fontSize: 17 }}>{L.back}</B>
              <B onClick={onSave} s={{ flex: 1, minHeight: 56, fontSize: 17 }}>{L.save} ✓</B>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────
function Burako({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [setup, setSetup] = useState(true); const [sStep, setSStep] = useState(0);
  const [pC, setPC] = useState(2); const [tgt, setTgt] = useState(3000); const [cfg, setCfg] = useState({ ...BK_D });
  const [teamNames, setTeamNames] = useState(["Pareja 1", "Pareja 2"]);
  const [teams, setTeams] = useState([]); const [adding, setAdding] = useState(false); const [editIdx, setEditIdx] = useState(null);
  const [hf, setHf] = useState([]); const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true); const [redoHand, setRedoHand] = useState(null);
  const teamNameRefs = useRef([]);

  const handlePC = (n) => { setPC(n); setTeamNames(n === 2 ? ["Pareja 1", "Pareja 2"] : ["Jugador 1", "Jugador 2", "Jugador 3"]) };
  const moveToNextName = (i) => { const nx = teamNameRefs.current[i + 1]; if (nx) { nx.focus(); nx.select?.(); } else setSStep(2); };

  // ── Persistence ──
  useEffect(() => {
    ST.load("burako-game").then(d => {
      if (d?.teams?.length) { setTeams(d.teams); setTgt(d.tgt); setCfg(d.cfg); setPC(d.pC); setSetup(false); onContinueChange?.("burako"); }
      setLoading(false);
    });
  }, []);
  useEffect(() => { if (teams.length && !setup) { ST.save("burako-game", { teams, tgt, cfg, pC }); onContinueChange?.("burako"); } }, [teams, tgt, cfg, pC, setup]);

  // ── Game logic ──
  const start = () => { const fresh = teamNames.map(n => ({ name: n, hands: [] })); setTeams(fresh); setSetup(false); ST.save("burako-game", { teams: fresh, tgt, cfg, pC }); onContinueChange?.("burako") };
  const initHand = () => { setHf(teams.map(() => ({ pura: 0, canasta: 0, puntos: 0, cierre: false, muerto: true }))); setAdding(true); setEditIdx(null) };
  const startEdit = (hi) => { setHf(teams.map(tm => ({ ...tm.hands[hi] }))); setEditIdx(hi); setAdding(true) };
  const calc = (h) => { if (!h) return 0; let s = (h.pura || 0) * cfg.pura + (h.canasta || 0) * cfg.canasta + (h.puntos || 0); if (h.cierre) s += cfg.cierre; if (!h.muerto) s -= cfg.muerto; return s };
  const total = (tm) => tm.hands.reduce((s, h) => s + calc(h), 0);
  const ren = (i, n) => { const u = [...teams]; u[i].name = n; setTeams(u) };
  const maxHands = Math.max(...teams.map(tm => tm.hands.length), 0);
  const winner = teams.find(tm => total(tm) >= tgt);

  const saveHand = () => {
    const prev = clone(teams); const u = clone(teams);
    if (editIdx !== null) { hf.forEach((h, i) => { u[i].hands[editIdx] = { ...h } }) }
    else { hf.forEach((h, i) => { u[i].hands.push({ ...h }) }) }
    setTeams(u); setAdding(false); setHf([]); setEditIdx(null); setRedoHand(null);
    setToast({ text: editIdx !== null ? `${L.editHand} ${editIdx + 1}` : L.newHand, undo: () => setTeams(prev) });
    if (sounds && u.some(tm => total(tm) >= tgt)) vibWin();
  };

  const undoLast = () => {
    const u = clone(teams); const removed = u.map(tm => tm.hands.pop() || null);
    setTeams(u); setRedoHand(removed); setModal(null);
    setToast({ text: L.undoDesc, redo: () => { const r = clone(u); r.forEach((tm, i) => { if (removed[i]) tm.hands.push(removed[i]); }); setTeams(r); setRedoHand(null); } });
  };

  const rematch = async () => {
    const r = teams.map(tm => ({ ...tm, hands: [] })); setTeams(r); setModal(null);
    setToast({ text: L.rematch, undo: null });
    await ST.save("burako-game", { teams: r, tgt, cfg, pC }); onContinueChange?.("burako");
  };

  const saveNew = async () => {
    const r = teams.map(tm => ({ ...tm, hands: [] })); setTeams(r); setModal(null);
    await ST.save("burako-game", { teams: r, tgt, cfg, pC }); onContinueChange?.("burako");
  };

  const resetZ = async () => { setTeams([]); setSetup(true); setModal(null); await ST.del("burako-game"); onContinueChange?.(null) };
  const doShare = () => shareResult(`Burako - ${(tgt / 1000).toFixed(tgt % 1000 ? 1 : 0)}K`, teams.map(tm => `${tm.name}: ${total(tm)}`));
  const goBack = async () => { if (teams.length && !setup) await ST.save("burako-game", { teams, tgt, cfg, pC }); onContinueChange?.(teams.length ? "burako" : null); onBack() };

  // ── Loading ──
  if (loading) return <div><Hdr title="Burako" emoji="🃏" onBack={goBack} /><div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div></div>;

  // ── Setup wizard ──
  if (setup) return (
    <div><Hdr title="Burako" emoji="🃏" onBack={goBack} />
      <div style={{ maxWidth: 360, margin: "0 auto", padding: "20px 20px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
        {sStep === 0 && <>
          <p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howPlay}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[2, 3].map(n => <B key={n} v={pC === n ? "pri" : "gh"} onClick={() => handlePC(n)}
              s={{ flex: 1, fontSize: 15, padding: "14px 10px" }}>{n === 2 ? L.pairs : L.threePlayers}</B>)}
          </div>
          <B onClick={() => setSStep(1)} s={{ width: "100%", padding: 12 }}>{L.next}</B>
        </>}

        {sStep === 1 && <>
          <p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
          {teamNames.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
              <input autoFocus={i === 0} ref={el => { teamNameRefs.current[i] = el }}
                value={n} onChange={e => { const u = [...teamNames]; u[i] = e.target.value; setTeamNames(u) }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextName(i) } }}
                onFocus={e => e.target.select()} enterKeyHint={i === teamNames.length - 1 ? "done" : "next"}
                style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12,
                  padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
          <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <B v="gh" onClick={() => setSStep(0)} s={{ flex: 1 }}>{L.back}</B>
              <B onClick={() => setSStep(2)} s={{ flex: 1, minHeight: 52 }}>{L.next}</B>
            </div>
          </div>
        </>}

        {sStep === 2 && <>
          <p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.target}</p>
          <div style={{ display: "flex", gap: 6 }}>
            {[3000, 5000].map(n => <B key={n} v={tgt === n ? "pri" : "gh"} onClick={() => setTgt(n)} s={{ flex: 1, fontSize: 15, minHeight: 52 }}>{(n / 1000)}K</B>)}
          </div>
          <NI label={L.custom} value={tgt} onChange={v => setTgt(v)} step={500} min={500} />
          <div style={{ borderTop: `1px solid ${t.brd}`, paddingTop: 12 }}>
            <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 8px" }}>{L.values}</p>
            <NI label={L.puras} value={cfg.pura} onChange={v => setCfg({ ...cfg, pura: v })} step={10} min={0} />
            <NI label={L.canastas} value={cfg.canasta} onChange={v => setCfg({ ...cfg, canasta: v })} step={10} min={0} />
            <NI label={L.closed} value={cfg.cierre} onChange={v => setCfg({ ...cfg, cierre: v })} step={10} min={0} />
            <NI label={L.penaltyDead} value={cfg.muerto} onChange={v => setCfg({ ...cfg, muerto: v })} step={10} min={0} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setSStep(1)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={start} s={{ flex: 1, padding: 12, fontSize: 15, minHeight: 52 }}>{L.start} 🃏</B>
          </div>
        </>}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  // GAME SCREEN
  // ════════════════════════════════════════════════
  const G = 4;
  const COL1 = 52;
  const gridCols = `${COL1}px repeat(${teams.length}, 1fr)`;

  return (
    <div style={{ minHeight: "100dvh", background: t.bg }}>
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8, flexShrink: 0 }}>
        <button onClick={goBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 18, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation" }}>←</button>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'", fontWeight: 600 }}>A {(tgt / 1000).toFixed(tgt % 1000 ? 1 : 0)}K</span>
        <div style={{ flex: 1 }} />
        <button onClick={doShare} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>📤</button>
        <button onClick={() => setModal("new")} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>🔄</button>
      </div>

      {/* ── Modals ── */}
      {modal && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
          <p style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>
            {modal === "new" ? L.newGame : modal === "undo" ? L.undoQ : L.resetQ}</p>
          <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px" }}>
            {modal === "new" ? L.savesHist : modal === "undo" ? L.undoDesc : L.losesAll}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B>
              : modal === "undo" ? <B v="err" onClick={undoLast} s={{ flex: 1 }}>{L.yesUndo}</B>
              : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}
          </div>
          {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
        </div>
      </Modal>}

      {/* ── Winner ── */}
      {winner && (
        <div style={{ textAlign: "center", padding: 12, margin: "8px 16px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
          <div style={{ fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} {L.wins}!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
            <B onClick={doShare} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, padding: "6px 12px", minHeight: 34 }}>📤</B>
            <B onClick={rematch} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, padding: "6px 12px", minHeight: 34 }}>{L.rematch}</B>
            <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 12, padding: "6px 12px", minHeight: 34 }}>{L.yesNew}</B>
          </div>
        </div>
      )}

      {/* ══════ LEDGER ══════ */}
      <div style={{ padding: "12px 12px 0", overflowX: "auto" }}>
        <div>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginBottom: G, position: "sticky", top: 0, zIndex: 2 }}>
            <div style={{ padding: "8px 4px", textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`,
              borderRadius: "10px 0 0 0", fontSize: 11, color: t.txtM, fontFamily: "'DM Sans'", fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center" }}>#</div>
            {teams.map((tm, i) => (
              <div key={i} style={{ padding: "8px 6px", textAlign: "center", background: t.card, border: `1px solid ${t.brd}`,
                borderRadius: i === teams.length - 1 ? "0 10px 0 0" : 0 }}>
                <EN name={tm.name} onSave={n => ren(i, n)} sz={15} />
                <div style={{ fontSize: 12, color: t.pri, marginTop: 3, fontWeight: 700, fontFamily: "'DM Sans'" }}>{L.dropWith}: {bajadaReq(total(tm))}</div>
              </div>
            ))}
          </div>

          {/* Hand rows */}
          {Array.from({ length: maxHands }).map((_, hi) => (
            <div key={hi} style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginBottom: G }}>
              <div style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: t.pri, fontFamily: "'Playfair Display'", fontSize: 15 }}>{hi + 1}</div>
              {teams.map((tm, ti) => {
                const h = tm.hands[hi];
                if (!h) return <div key={ti} style={{ background: t.card, border: `1px solid ${t.brd}`, minHeight: 48, borderRadius: 8 }} />;
                const s = calc(h);
                const bits = [];
                if (h.pura > 0) bits.push(`${h.pura}P`);
                if (h.canasta > 0) bits.push(`${h.canasta}C`);
                if (h.puntos !== 0) bits.push(`${h.puntos > 0 ? "+" : ""}${h.puntos}`);
                if (h.cierre) bits.push("✓");
                if (!h.muerto) bits.push("−M");
                return (
                  <div key={ti} onClick={() => !adding && startEdit(hi)}
                    style={{ background: t.card, border: `1px solid ${t.brd}`, padding: "6px 8px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      borderRadius: 8, cursor: "pointer", minHeight: 48 }}>
                    <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'" }}>{bits.join(" · ")}</span>
                    <span style={{ fontFamily: "'Playfair Display'", fontSize: 16, fontWeight: 700,
                      color: s >= 0 ? t.ok : t.err, marginLeft: 6, flexShrink: 0 }}>{s >= 0 ? "+" : ""}{s}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Total row */}
          <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: G, marginTop: G }}>
            <div style={{ padding: "10px 4px", textAlign: "center", background: t.pri, borderRadius: "0 0 0 10px",
              color: "#fff", fontFamily: "'DM Sans'", fontWeight: 800, fontSize: 9,
              display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 1 }}>TOTAL</div>
            {teams.map((tm, i) => (
              <div key={i} style={{ padding: "8px 6px", textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`,
                borderRadius: i === teams.length - 1 ? "0 0 10px 0" : 0 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 26, fontWeight: 800, color: t.pri, lineHeight: 1 }}>{total(tm)}</div>
                <div style={{ fontSize: 11, color: t.txtF, marginTop: 2, fontFamily: "'DM Sans'" }}>{Math.max(0, tgt - total(tm))} {L.toWin}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ ACTIONS ══════ */}
      <div style={{ padding: "12px 16px 24px" }}>
        <div style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
          <B onClick={initHand} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.newHand}</B>
          {maxHands > 0 && <B v="err" onClick={() => setModal("undo")} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.undo}</B>}
          {redoHand && <B v="gh" onClick={() => { const r = clone(teams); r.forEach((tm, i) => { if (redoHand[i]) tm.hands.push(redoHand[i]); }); setTeams(r); setRedoHand(null); }} s={{ flex: 1, minHeight: 48, padding: "12px 16px" }}>{L.redo}</B>}
        </div>
      </div>

      {/* ── Hand wizard overlay ── */}
      {adding && <HandWizard
        teams={teams} cfg={cfg} calc={calc} hf={hf} setHf={setHf}
        onSave={saveHand} onCancel={() => { setAdding(false); setHf([]); setEditIdx(null) }}
        editIdx={editIdx} L={L} t={t}
      />}

      <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
    </div>
  );
}

export default Burako;
