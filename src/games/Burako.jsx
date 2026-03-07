import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, vibWin, bajadaReq, B, EN, Hdr, NI, IcoBtn, Modal, UndoBar } from '../lib';

const BK_D = { pura: 200, canasta: 100, cierre: 100, muerto: 100 };

// NI right-side controls width: 44 + 3 + 64 + 3 + 44 = 158
const CTL_W = 158;

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
  const moveToNextName = (i) => { const nx = teamNameRefs.current[i + 1]; if (nx) { nx.focus(); nx.select?.(); } else setSStep(2); };

  // ── Persistence ──
  useEffect(() => {
    ST.load("burako-game").then(d => {
      if (d?.teams?.length) { setTeams(d.teams); setTgt(d.tgt); setCfg(d.cfg); setPC(d.pC); setSetup(false); onContinueChange?.("burako"); }
      setLoading(false);
    });
    ST.load("burako-hist").then(d => { if (d) setHist(d) });
  }, []);
  useEffect(() => { if (teams.length && !setup) { ST.save("burako-game", { teams, tgt, cfg, pC }); onContinueChange?.("burako"); } }, [teams, tgt, cfg, pC, setup]);
  useEffect(() => { if (hist.length) ST.save("burako-hist", hist); else ST.del("burako-hist") }, [hist]);

  // ── Game logic ──
  const start = () => { const fresh = teamNames.map(n => ({ name: n, hands: [] })); setTeams(fresh); setSetup(false); ST.save("burako-game", { teams: fresh, tgt, cfg, pC }); onContinueChange?.("burako") };
  const initHand = () => { setHf(teams.map(() => ({ pura: 0, canasta: 0, puntos: 0, cierre: false, muerto: true }))); setAdding(true); setEditIdx(null) };
  const startEdit = (hi) => { setHf(teams.map(tm => ({ ...tm.hands[hi] }))); setEditIdx(hi); setAdding(true) };
  const calc = (h) => { if (!h) return 0; let s = (h.pura || 0) * cfg.pura + (h.canasta || 0) * cfg.canasta + (h.puntos || 0); if (h.cierre) s += cfg.cierre; if (!h.muerto) s -= cfg.muerto; return s };
  const total = (tm) => tm.hands.reduce((s, h) => s + calc(h), 0);
  const setCierre = (i) => setHf(hf.map((h, j) => ({ ...h, cierre: j === i })));
  const upHf = (i, k, v) => { const u = [...hf]; u[i] = { ...u[i], [k]: v }; setHf(u) };
  const someoneClosed = hf.some(h => h?.cierre);
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
    const nh = [{ teams: teams.map(tm => ({ name: tm.name, t: total(tm) })), tgt, date: fmtDate(), done: !!winner }, ...hist];
    setHist(nh); await ST.save("burako-hist", nh);
    const r = teams.map(tm => ({ ...tm, hands: [] })); setTeams(r); setModal(null);
    await ST.save("burako-game", { teams: r, tgt, cfg, pC }); onContinueChange?.("burako");
  };

  const resetZ = async () => { setTeams([]); setSetup(true); setModal(null); await ST.del("burako-game"); onContinueChange?.(null) };
  const delH = i => setHist(h => h.filter((_, j) => j !== i));
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
  const G = 4; // grid gap
  const COL1 = 52; // hand number column width
  const gridCols = `${COL1}px repeat(${teams.length}, 1fr)`;

  return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <Hdr title="Burako" emoji="🃏" onBack={goBack} sub={`A ${(tgt / 1000).toFixed(tgt % 1000 ? 1 : 0)}K`} icons={<>
        <IcoBtn onClick={() => setShowCfg(!showCfg)} t={t}>⚙️</IcoBtn>
        <IcoBtn onClick={doShare} t={t}>📤</IcoBtn>
        <IcoBtn onClick={() => setModal("new")} t={t}>🔄</IcoBtn>
        {hist.length > 0 && <IcoBtn onClick={() => setShowH(!showH)} t={t}>📋</IcoBtn>}
      </>} />

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

      {/* ── Config panel ── */}
      {showCfg && (
        <div style={{ margin: "8px 16px", background: t.card, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 12, boxShadow: t.sh }}>
          <NI label={L.puras} value={cfg.pura} onChange={v => setCfg({ ...cfg, pura: v })} step={10} min={0} />
          <NI label={L.canastas} value={cfg.canasta} onChange={v => setCfg({ ...cfg, canasta: v })} step={10} min={0} />
          <NI label={L.closed} value={cfg.cierre} onChange={v => setCfg({ ...cfg, cierre: v })} step={10} min={0} />
          <NI label={L.penaltyDead} value={cfg.muerto} onChange={v => setCfg({ ...cfg, muerto: v })} step={10} min={0} />
          <B onClick={() => setShowCfg(false)} s={{ width: "100%", marginTop: 6 }}>{L.close}</B>
        </div>
      )}

      {/* ── History ── */}
      {showH && hist.length > 0 && (
        <div style={{ margin: "8px 16px", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{L.hist}</p>
          {hist.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", borderBottom: `1px solid ${t.brd}30`, fontSize: 13 }}>
              <div style={{ flex: 1 }}>{h.teams.map((s, j) => <span key={j} style={{ marginRight: 10 }}>{s.name}: <b>{s.t}</b></span>)}</div>
              <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 16, padding: 4 }}>×</button>
            </div>
          ))}
        </div>
      )}

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
          {/* Header row (sticky) */}
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
              color: "#fff", fontFamily: "'Playfair Display'", fontWeight: 800, fontSize: 11,
              display: "flex", alignItems: "center", justifyContent: "center", letterSpacing: 1 }}>Σ</div>
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

      {/* ══════ HAND FORM / ACTIONS ══════ */}
      <div style={{ padding: "12px 12px 24px" }}>
        {adding ? (
          <div style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 14, padding: 14, boxShadow: t.sh }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.pri, margin: "0 0 10px", fontFamily: "'Playfair Display'" }}>
              {editIdx !== null ? `${L.editHand} ${editIdx + 1}` : L.newHand}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {teams.map((tm, i) => {
                const other = hf.some((h, j) => j !== i && h?.cierre);
                return (
                  <div key={i} style={{ background: t.bgS, borderRadius: 12, padding: 12, border: `1px solid ${t.brd}` }}>
                    {/* Team name + bajada */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: t.pri, fontFamily: "'Playfair Display'" }}>{tm.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: t.pri, fontFamily: "'DM Sans'" }}>{L.dropWith} {bajadaReq(total(tm))}</span>
                    </div>

                    {/* NI controls */}
                    <NI label={L.puras} value={hf[i]?.pura || 0} onChange={v => upHf(i, "pura", v)} min={0} hint={`(${cfg.pura})`} />
                    <NI label={L.canastas} value={hf[i]?.canasta || 0} onChange={v => upHf(i, "canasta", v)} min={0} hint={`(${cfg.canasta})`} />
                    <NI label={L.puntos} value={hf[i]?.puntos || 0} onChange={v => upHf(i, "puntos", v)} step={5} />

                    {/* Muerto Sí/No — aligned to NI controls (width CTL_W) */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: t.txtM }}>{L.playedDead}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, width: CTL_W }}>
                        <button onClick={() => upHf(i, "muerto", true)} style={{
                          flex: 1, height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'",
                          cursor: "pointer", touchAction: "manipulation",
                          background: hf[i]?.muerto ? t.pri : t.bgS,
                          color: hf[i]?.muerto ? "#fff" : t.txt,
                          border: hf[i]?.muerto ? "none" : `1px solid ${t.brd}`,
                        }}>Sí</button>
                        <button onClick={() => upHf(i, "muerto", false)} style={{
                          flex: 1, height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'",
                          cursor: "pointer", touchAction: "manipulation",
                          background: !hf[i]?.muerto ? t.err : t.bgS,
                          color: !hf[i]?.muerto ? "#fff" : t.txt,
                          border: !hf[i]?.muerto ? "none" : `1px solid ${t.brd}`,
                        }}>No</button>
                      </div>
                    </div>

                    {/* Cerró — also width CTL_W, right-aligned */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: t.txtM }}>{L.closed}</span>
                      <div style={{ width: CTL_W }}>
                        {hf[i]?.cierre
                          ? <button onClick={() => { const u = [...hf]; u[i] = { ...u[i], cierre: false }; setHf(u) }} style={{
                              width: "100%", height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'",
                              cursor: "pointer", touchAction: "manipulation",
                              background: t.ok, color: "#fff", border: "none",
                            }}>✓ {L.closed}</button>
                          : other
                            ? <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, color: t.txtF, fontStyle: "italic" }}>{L.notClosed}</div>
                            : <button onClick={() => setCierre(i)} style={{
                                width: "100%", height: 44, borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans'",
                                cursor: "pointer", touchAction: "manipulation",
                                background: "transparent", color: t.pri, border: `1.5px solid ${t.pri}`,
                              }}>{L.closed}</button>
                        }
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div style={{ padding: "6px 8px", background: t.card, borderRadius: 8, border: `1px solid ${t.brd}`,
                      display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'" }}>{L.sub}</span>
                      <span style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700,
                        color: calc(hf[i]) >= 0 ? t.ok : t.err }}>{calc(hf[i]) >= 0 ? "+" : ""}{calc(hf[i])}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <B onClick={saveHand} disabled={!someoneClosed} s={{ flex: 1, minHeight: 48 }}>
                {someoneClosed ? L.save : L.chooseClosed}
              </B>
              <B v="gh" onClick={() => { setAdding(false); setHf([]); setEditIdx(null) }} s={{ minHeight: 48 }}>{L.cancel}</B>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <B onClick={initHand} s={{ padding: "12px 24px", minHeight: 48 }}>{L.newHand}</B>
            {maxHands > 0 && <B v="err" onClick={() => setModal("undo")} s={{ minHeight: 48 }}>{L.undo}</B>}
            {redoHand && <B v="gh" onClick={() => { const r = clone(teams); r.forEach((tm, i) => { if (redoHand[i]) tm.hands.push(redoHand[i]); }); setTeams(r); setRedoHand(null); }} s={{ minHeight: 48 }}>{L.redo}</B>}
          </div>
        )}
      </div>

      <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
    </div>
  );
}

export default Burako;
