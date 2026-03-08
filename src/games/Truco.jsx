import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, vibWin, B, EN, IcoBtn, Modal } from '../lib.jsx';

// ─── TALLY MARKS (Truco-specific) ──────────────
function TrucoTally({ count, color, divAt }) {
  const SZ = 36, PD = 3, GAP = 4;

  const jitter = useMemo(() => {
    const a = [];
    for (let i = 0; i < 80; i++) {
      a.push(((Math.sin((count * 100 + i) * 9301 + 49297) % 1) * 1.2));
    }
    return a;
  }, [count]);
  let ji = 0;
  const j = () => jitter[ji++ % jitter.length];

  const els = [];
  let drawn = 0, divPlaced = !divAt;

  const fullSq = (key) => (
    <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
      <rect x={PD + j()} y={PD + j()} width={SZ - PD * 2 + j()} height={SZ - PD * 2 + j()}
        fill="none" stroke={color} strokeWidth="2.5" rx="2" strokeLinecap="round" />
      <line x1={PD + 1 + j()} y1={SZ - PD - 1 + j()} x2={SZ - PD - 1 + j()} y2={PD + 1 + j()}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  const partSq = (n, key) => {
    const segs = [];
    if (n >= 1) segs.push(<line key="l" x1={PD + j()} y1={PD + j()} x2={PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
    if (n >= 2) segs.push(<line key="b" x1={PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
    if (n >= 3) segs.push(<line key="r" x1={SZ - PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
    if (n >= 4) segs.push(<line key="t" x1={SZ - PD + j()} y1={PD + j()} x2={PD + j()} y2={PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" />);
    return <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>{segs}</svg>;
  };

  const divider = (
    <div key="div" style={{ display: "flex", alignItems: "center", width: "100%", margin: `${GAP}px 0`, padding: "0 2px" }}>
      <div style={{ flex: 1, height: 2, background: "linear-gradient(90deg, transparent, #C0392B)", borderRadius: 1 }} />
      <span style={{ fontSize: 8, color: "#C0392B", fontWeight: 700, letterSpacing: 2, padding: "0 6px", fontFamily: "'DM Sans'" }}>BUENAS</span>
      <div style={{ flex: 1, height: 2, background: "linear-gradient(270deg, transparent, #C0392B)", borderRadius: 1 }} />
    </div>
  );

  while (drawn < count) {
    const rem = count - drawn, batch = Math.min(5, rem);
    if (!divPlaced && drawn < divAt && drawn + batch > divAt) {
      const b = divAt - drawn;
      if (b > 0) { els.push(b === 5 ? fullSq(`s${drawn}`) : partSq(b, `p${drawn}`)); drawn += b; }
      els.push(divider); divPlaced = true; continue;
    }
    if (!divPlaced && drawn + batch === divAt) {
      els.push(batch === 5 ? fullSq(`s${drawn}`) : partSq(batch, `p${drawn}`)); drawn += batch;
      els.push(divider); divPlaced = true; continue;
    }
    els.push(batch === 5 ? fullSq(`s${drawn}`) : partSq(batch, `p${drawn}`)); drawn += batch;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: GAP }}>
      {els.length > 0 ? els : <div style={{ color, opacity: 0.15, fontSize: 24 }}>—</div>}
    </div>
  );
}

// ─── SCORE COLUMN ──────────────────────────────
function Col({ player, idx, target, winner, ph, onAdd, onRen, t }) {
  const dim = winner && winner !== player;
  const atTarget = player.p >= target;
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      opacity: dim ? 0.3 : 1, transition: "opacity .3s",
    }}>
      {/* Name */}
      <div style={{ textAlign: "center", padding: ph ? "8px 6px 6px" : "12px 10px 8px", borderBottom: `1px solid ${t.brd}` }}>
        <EN name={player.name} onSave={n => onRen(idx, n)} sz={ph ? 15 : 18} />
      </div>

      {/* Tally (flex-grow, scrollable) */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: ph ? "6px 6px" : "10px 10px",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
        minHeight: 0,
      }}>
        {target === 30 && (
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: t.txtM, marginBottom: 4, fontFamily: "'DM Sans'" }}>MALAS</div>
        )}
        <TrucoTally count={player.p} color={t.pri} divAt={target === 30 ? 15 : null} />
      </div>

      {/* Score */}
      <div style={{ textAlign: "center", padding: ph ? "6px 0" : "10px 0", borderTop: `1px solid ${t.brd}` }}>
        <div style={{
          fontFamily: "'Playfair Display'", fontWeight: 800,
          fontSize: ph ? 48 : 64, color: t.pri, lineHeight: 1,
        }}>{player.p}</div>
      </div>

      {/* Buttons — full-width rows, disabled when at target */}
      <div style={{ display: "flex", flexDirection: "column", gap: ph ? 4 : 6, padding: ph ? "6px 8px 10px" : "8px 14px 14px", borderTop: `1px solid ${t.brd}` }}>
        {[1, 2, 3].map(v => (
          <button key={v} onClick={() => !atTarget && onAdd(idx, v)} disabled={atTarget} style={{
            background: atTarget ? t.bgS : t.pri, color: atTarget ? t.txtF : "#fff", border: "none",
            borderRadius: 12, height: ph ? 44 : 50, width: "100%",
            fontSize: ph ? 18 : 20, fontWeight: 800, fontFamily: "'Playfair Display'",
            cursor: atTarget ? "default" : "pointer", touchAction: "manipulation",
            boxShadow: atTarget ? "none" : "0 1px 3px rgba(0,0,0,.1)",
            opacity: atTarget ? 0.4 : 1,
          }}>+{v}</button>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────
function Truco({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [target, setTarget] = useState(15);
  const [step, setStep] = useState(0);
  const nameRefs = useRef([]);
  const [started, setStarted] = useState(false);
  const [names, setNames] = useState(["Nosotros", "Ellos"]);
  const [sc, setSc] = useState([]);
  const [modal, setModal] = useState(null);
  const [lastSc, setLastSc] = useState(null);
  const [loading, setLoading] = useState(true);
  const ph = typeof window !== "undefined" && window.innerWidth <= 480;

  // Auto-hide undo after 4 seconds
  useEffect(() => {
    if (!lastSc) return;
    const id = setTimeout(() => setLastSc(null), 4000);
    return () => clearTimeout(id);
  }, [lastSc]);

  // ── Persistence ──
  useEffect(() => {
    ST.load("truco-game").then(d => {
      if (d?.started) {
        setTarget(d.target ?? 15);
        const ln = Array.isArray(d.names) && d.names.length ? d.names : ["Nosotros", "Ellos"];
        const ls = Array.isArray(d.sc) && d.sc.length ? d.sc : ln.map(n => ({ name: n, p: 0 }));
        setNames(ln); setSc(ls); setStarted(true); onContinueChange?.("truco");
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!started) return;
    ST.save("truco-game", { started: true, target, names, sc });
    onContinueChange?.("truco");
  }, [started, target, names, sc]);

  const persist = (nSc = sc, nNames = names) => {
    if (started) ST.save("truco-game", { started: true, target, names: nNames, sc: nSc });
  };

  // ── Actions ──
  const nextName = (i) => { const nx = nameRefs.current[i + 1]; if (nx) { nx.focus(); nx.select?.(); } else startGame(); };

  const startGame = async () => {
    const fn = names.map((n, i) => n?.trim() || (i === 0 ? "Nosotros" : "Ellos"));
    const fresh = fn.map(n => ({ name: n, p: 0 }));
    setNames(fn); setSc(fresh); setStarted(true);
    await ST.save("truco-game", { started: true, target, names: fn, sc: fresh });
    onContinueChange?.("truco");
  };

  const goBack = async () => { if (started) persist(); onContinueChange?.(started ? "truco" : null); onBack(); };

  const add = (i, v) => {
    // Don't allow adding past target
    if (sc[i].p >= target) return;
    setLastSc(clone(sc));
    const newP = Math.min(target, Math.max(0, sc[i].p + v));
    const u = sc.map((r, idx) => idx === i ? { ...r, p: newP } : r);
    setSc(u);
    persist(u);
    if (sounds) vib();
    if (sounds && newP >= target) vibWin();
  };

  const ren = (i, n) => {
    const safe = n?.trim() || (i === 0 ? "Nosotros" : "Ellos");
    const nn = names.map((x, idx) => idx === i ? safe : x);
    const ns = sc.map((r, idx) => idx === i ? { ...r, name: safe } : r);
    setNames(nn); setSc(ns); persist(ns, nn);
  };

  const winner = sc.find(s => s.p >= target);

  const rematch = () => { const r = sc.map(s => ({ ...s, p: 0 })); setSc(r); setModal(null); persist(r); };

  const saveNew = async () => {
    const r = sc.map(s => ({ ...s, p: 0 })); setSc(r); setModal(null); persist(r);
  };

  const resetZ = async () => { setStarted(false); setStep(0); setSc([]); setModal(null); await ST.del("truco-game"); onContinueChange?.(null); };

  const doShare = () => shareResult("Truco - " + target + " pts", sc.map(s => `${s.name}: ${s.p}`));

  // ── Loading ──
  if (loading) return <div style={{ minHeight: "100vh", background: t.bg }}><div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div></div>;

  // ── Setup ──
  if (!started) return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <div style={{ padding: "16px 16px 0" }}>
        <button onClick={goBack} style={{ background: t.card, border: `1px solid ${t.brd}`, color: t.txt, fontSize: 16, borderRadius: 10,
          width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>←</button>
      </div>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "20px 20px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step === 0 && <>
          <p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howMany}</p>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            {[15, 30].map(v => <B key={v} v={target === v ? "pri" : "gh"} onClick={() => setTarget(v)}
              s={{ fontSize: 26, padding: "18px 16px", minHeight: 68, fontFamily: "'Playfair Display'", fontWeight: 800 }}>{v}</B>)}
          </div>
          <B onClick={() => setStep(1)} s={{ width: "100%" }}>{L.next}</B>
        </>}
        {step === 1 && <>
          <p style={{ fontSize: 17, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
          {names.map((n, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
              <input autoFocus={i === 0} ref={el => { nameRefs.current[i] = el }}
                value={n} onChange={e => { const u = [...names]; u[i] = e.target.value; setNames(u) }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); nextName(i) } }}
                onFocus={e => e.target.select()} enterKeyHint={i === names.length - 1 ? "done" : "next"}
                style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt,
                  borderRadius: 12, padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} />
            </div>
          ))}
          <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <B v="gh" onClick={() => setStep(0)} s={{ flex: 1 }}>{L.back}</B>
              <B onClick={startGame} s={{ flex: 1, fontSize: 16, minHeight: 52 }}>{L.start} 🂡</B>
            </div>
          </div>
        </>}
      </div>
    </div>
  );

  // ════════════════════════════════════════════
  // GAME SCREEN — minimal header, full-screen layout
  // ════════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: t.bg, overflow: "hidden" }}>

      {/* Minimal header — just back arrow and target, share/new tucked small */}
      <div style={{ display: "flex", alignItems: "center", padding: ph ? "8px 10px" : "10px 14px", gap: 8, flexShrink: 0 }}>
        <button onClick={goBack} style={{
          background: "none", border: "none", color: t.txtM, fontSize: 18,
          cursor: "pointer", padding: "4px 8px", touchAction: "manipulation",
        }}>←</button>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'", fontWeight: 600 }}>A {target}</span>
        <div style={{ flex: 1 }} />
        <button onClick={doShare} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>📤</button>
        <button onClick={() => setModal("new")} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>🔄</button>
      </div>

      {/* Modals */}
      {modal && <Modal onClose={() => setModal(null)}>
        <div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
          <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
          <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
            {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}
          </div>
          {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
        </div>
      </Modal>}

      {/* Winner */}
      {winner && (
        <div style={{ textAlign: "center", padding: ph ? 8 : 12, background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, color: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: ph ? 16 : 20, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{winner.name} {L.wins}!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4 }}>
            <B onClick={doShare} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "4px 10px", minHeight: 30 }}>📤</B>
            <B onClick={rematch} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "4px 10px", minHeight: 30 }}>{L.rematch}</B>
            <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.15)", color: "#fff", fontSize: 11, padding: "4px 10px", minHeight: 30 }}>{L.yesNew}</B>
          </div>
        </div>
      )}

      {/* ── SCOREBOARD ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <Col player={sc[0]} idx={0} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} />
        <div style={{ width: 1, background: t.brd, flexShrink: 0 }} />
        <Col player={sc[1]} idx={1} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} />
      </div>

      {/* Simple floating undo button */}
      {lastSc && (
        <button onClick={() => { setSc(lastSc); persist(lastSc); setLastSc(null); }}
          style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
            background: t.card, border: `1px solid ${t.brd}`, borderRadius: 10,
            padding: "6px 16px", fontSize: 12, fontWeight: 600, color: t.txtM,
            cursor: "pointer", boxShadow: t.shH, zIndex: 50,
            fontFamily: "'DM Sans'", touchAction: "manipulation" }}>
          {L.undo}
        </button>
      )}
    </div>
  );
}

export default Truco;
