import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, B, EN, Hdr, IcoBtn, Modal, UndoBar } from '../lib.jsx';

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
      <rect x={0.5} y={0.5} width={size - 1} height={size - 1} rx={2.5 * s} fill="none" stroke={color} strokeWidth={1} opacity={0.4} />
      {(dots[n] || []).map(([x, y], i) => (
        <circle key={i} cx={x * s} cy={y * s} r={r} fill={color} />
      ))}
    </svg>
  );
}

// ─── COMBO BADGE ────────────────────────────────
const COMBO_LABELS = { esc: "E", full: "F", poker: "P", gen: "G", doble: "2G" };
function ComboBadge({ k, color }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 800, color, fontFamily: "'DM Sans'",
    }}>{COMBO_LABELS[k]}</div>
  );
}

function Generala({ onBack, onContinueChange }) {
  const { t, sounds, L } = useApp();
  const [sStep, setSStep] = useState(0); const [pCount, setPCount] = useState(2);
  const [pNames, setPNames] = useState(["Jugador 1", "Jugador 2"]);
  const [ps, setPs] = useState([]); const [started, setStarted] = useState(false);
  const [sheet, setSheet] = useState(null); const [modal, setModal] = useState(null);
  const [hist, setHist] = useState([]); const [showH, setShowH] = useState(false); const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const playerNameRefs = useRef([]);

  const handleCount = (n) => { setPCount(n); setPNames(Array.from({ length: n }, (_, i) => pNames[i] || `Jugador ${i + 1}`)) };

  useEffect(() => { ST.load("generala-game").then(d => { if (d?.ps?.length) { setPs(d.ps); setStarted(true); onContinueChange?.("generala") } setLoading(false); });
    ST.load("generala-hist").then(d => { if (d) setHist(d) }) }, []);
  useEffect(() => { if (started && ps.length) { ST.save("generala-game", { ps }); onContinueChange?.("generala") } }, [ps, started, onContinueChange]);
  useEffect(() => { if (hist.length) ST.save("generala-hist", hist) }, [hist]);

  const freshScores = () => { const fresh = {}; GC.forEach(c => { fresh[c.k] = null }); return fresh; };
  const startGame = () => { const finalNames = pNames.map((n, i) => n?.trim() || `Jugador ${i + 1}`); setPNames(finalNames); setPs(finalNames.map(n => ({ name: n, scores: freshScores() }))); setStarted(true); onContinueChange?.("generala") };
  const moveToNextGeneralaName = (i) => {
    const next = playerNameRefs.current[i + 1];
    if (next) { next.focus(); next.select?.(); }
    else startGame();
  };
  const setSc = (pi, k, v) => { const prev = clone(ps); const u = clone(ps); u[pi].scores[k] = v; setPs(u); setSheet(null); setToast({ text: `${u[pi].name} · ${GC.find(c => c.k === k)?.l}`, undo: () => setPs(prev) }); if (sounds) vib() };
  const tot = p => Object.values(p.scores).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const ren = (i, n) => { const u = clone(ps); u[i].name = n; setPs(u) };
  const allSame = (c) => { const v = ps.map(p => p.scores[c.k]); if (v.some(x => x === null || x === "x")) return false; return v.every(x => x === v[0]) && ps.length > 1 };
  const allDone = GC.every(c => ps.every(p => p.scores[c.k] !== null));
  const filledCount = ps.length > 0 ? Math.min(...ps.map(p => GC.filter(c => p.scores[c.k] !== null).length)) : 0;
  const turnCounts = ps.map(p => GC.filter(c => p.scores[c.k] !== null).length);
  const currentTurnIndex = ps.length ? Math.max(0, turnCounts.findIndex(c => c === filledCount)) : 0;
  const currentTurnName = ps[currentTurnIndex]?.name;
  const askTurnGuard = (pi) => {
    if (!ps.length || pi === currentTurnIndex) return true;
    const msg = L.turnWarning.replace('{name}', ps[pi]?.name || '').replace('{expected}', currentTurnName || '');
    return window.confirm(msg);
  };
  const turnsLeft = 11 - filledCount;
  const rematch = async () => { const next = ps.map(p => ({ name: p.name, scores: freshScores() })); setPs(next); setModal(null); setToast({ text: L.rematch, undo: null }); await ST.save("generala-game", { ps: next }); onContinueChange?.("generala") };
  const saveNew = async () => { const nextHist = [{ players: ps.map(p => ({ name: p.name, t: tot(p) })), date: fmtDate() }, ...hist];
    setHist(nextHist); await ST.save("generala-hist", nextHist); setStarted(false); setSStep(0); setModal(null); ST.del("generala-game"); onContinueChange?.(null) };
  const resetZ = async () => { setStarted(false); setSStep(0); setModal(null); setPs([]); await ST.del("generala-game"); onContinueChange?.(null) };
  const delH = i => setHist(h => h.filter((_, j) => j !== i));
  const doShare = () => shareResult("Generala", ps.map(p => `${p.name}: ${tot(p)}`));
  const goBack = () => { onContinueChange?.(started ? "generala" : null); onBack() };
  const maxTot = ps.length ? Math.max(...ps.map(p => tot(p))) : 0;

  if (loading) return <div><Hdr title="Generala" emoji="🎲" onBack={goBack} /><div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (!started) return <div><Hdr title="Generala" emoji="🎲" onBack={goBack} />
    <div style={{ maxWidth: 360, margin: "0 auto", padding: "20px 20px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
      {sStep === 0 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.howManyPlayers}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {[2, 3, 4, 5, 6].map(n => <B key={n} v={pCount === n ? "pri" : "gh"} onClick={() => handleCount(n)}
            s={{ width: 52, height: 52, fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</B>)}</div>
        <B onClick={() => setSStep(1)} s={{ width: "100%", padding: 12 }}>{L.next}</B></>}
      {sStep === 1 && <><p style={{ fontSize: 16, color: t.pri, textAlign: "center", margin: 0, fontFamily: "'Playfair Display'", fontWeight: 700 }}>{L.names}</p>
        {pNames.map((n, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: t.txtF, width: 20 }}>{i + 1}.</span>
          <input autoFocus={i === 0} ref={el => { playerNameRefs.current[i] = el }} value={n} onChange={e => { const u = [...pNames]; u[i] = e.target.value; setPNames(u) }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); moveToNextGeneralaName(i) } }} onFocus={e => e.target.select()} enterKeyHint={i === pNames.length - 1 ? "done" : "next"}
            style={{ flex: 1, background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, padding: "13px 14px", minHeight: 48, fontSize: 16, fontFamily: "inherit", outline: "none" }} /></div>)}
        <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setSStep(0)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={startGame} s={{ flex: 1, padding: 12, fontSize: 15, minHeight: 52 }}>{L.start} 🎲</B></div>
        </div></>}
    </div></div>;

  const COL1 = 96;
  const gridCols = `${COL1}px repeat(${ps.length}, minmax(60px, 1fr))`;

  return <div style={{ minHeight: "100dvh", background: t.bg }}>
    {/* Minimal header */}
    <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8, flexShrink: 0 }}>
      <button onClick={goBack} style={{ background: "none", border: "none", color: t.txtM, fontSize: 18, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation" }}>←</button>
      <span style={{ fontSize: 12, color: t.txtM, fontFamily: "'DM Sans'", fontWeight: 600 }}>
        🎲 {turnsLeft > 0 ? `${turnsLeft} ${L.turnsLeft}` : `¡${L.done}!`}
      </span>
      <div style={{ flex: 1 }} />
      <button onClick={doShare} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>📤</button>
      <button onClick={() => setModal("new")} style={{ background: "none", border: "none", color: t.txtM, fontSize: 14, cursor: "pointer", padding: 4, touchAction: "manipulation" }}>🔄</button>
    </div>

    {modal && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
      <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
      <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
      {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
    </div></Modal>}

    {/* Score entry modal with dice icon */}
    {sheet && <Modal onClose={() => setSheet(null)}>
      <div style={{ background: t.card, borderRadius: 20, padding: 20, boxShadow: t.shH }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          {GC.find(c => c.k === sheet.cat)?.n && <DiceFace n={GC.find(c => c.k === sheet.cat).n} size={28} color={t.pri} />}
          {!GC.find(c => c.k === sheet.cat)?.n && <ComboBadge k={sheet.cat} color={t.pri} />}
          <p style={{ fontSize: 14, fontWeight: 600, color: t.pri, margin: 0, fontFamily: "'Playfair Display'" }}>
            {ps[sheet.pi]?.name} — {GC.find(c => c.k === sheet.cat)?.l}</p>
        </div>
        {sheet.pi !== currentTurnIndex && <p style={{ fontSize: 10, color: t.err, margin: "0 0 8px", opacity: 0.7 }}>⚠ {L.turnWarning.replace('{name}', ps[sheet.pi]?.name || '').replace('{expected}', currentTurnName || '')}</p>}
        <p style={{ fontSize: 11, color: t.txtM, margin: "0 0 12px" }}>{L.chooseScore}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {gV(GC.find(c => c.k === sheet.cat)).map(v => <B key={v} onClick={() => setSc(sheet.pi, sheet.cat, v)}
            s={{ fontSize: 18, padding: "14px 8px", fontFamily: "'Playfair Display'", fontWeight: 700 }}>{v}</B>)}
          <B v="err" onClick={() => setSc(sheet.pi, sheet.cat, "x")} s={{ fontSize: 16, padding: "14px 8px" }}>✗ {L.cross}</B>
          {ps[sheet.pi]?.scores[sheet.cat] !== null && <B v="gh" onClick={() => setSc(sheet.pi, sheet.cat, null)} s={{ fontSize: 12, padding: "14px 8px" }}>↩ {L.erase}</B>}
        </div>
        <B v="gh" onClick={() => setSheet(null)} s={{ width: "100%", marginTop: 10 }}>{L.cancel}</B>
      </div></Modal>}

    {showH && hist.length > 0 && <div style={{ margin: "8px 12px", background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 12, padding: 10 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: t.pri, margin: "0 0 6px", fontFamily: "'Playfair Display'" }}>{L.hist}</p>
      {hist.map((h, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderBottom: `1px solid ${t.brd}30`, fontSize: 12 }}>
        <div style={{ flex: 1 }}>{h.players.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
        <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 14, padding: 2 }}>×</button></div>)}</div>}

    {/* Winner banner */}
    {allDone && <div style={{ textAlign: "center", padding: 14, margin: "8px 12px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
      <div style={{ fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{ps.reduce((b, p) => tot(p) > tot(b) ? p : b, ps[0]).name} {L.wins}!</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <B onClick={doShare} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>📤 {L.share}</B>
        <B onClick={rematch} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.rematch}</B>
        <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.yesNew}</B></div></div>}

    {/* ══════ SCORE GRID ══════ */}
    <div style={{ padding: "10px 8px 20px", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(300, COL1 + ps.length * 72) }}>
        {/* Player header with initial avatars */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ padding: 4 }} />
          {ps.map((p, i) => <div key={i} style={{ padding: "8px 4px 6px", textAlign: "center", background: t.card, borderRadius: "10px 10px 0 0", border: `1px solid ${t.brd}`, borderBottom: "none" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: t.pri + "18", color: t.pri,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 4px", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'",
            }}>{p.name.charAt(0).toUpperCase()}</div>
            <EN name={p.name} onSave={n => ren(i, n)} sz={11} /></div>)}
        </div>

        {/* Category rows */}
        {GC.map((cat, ci) => { const same = allSame(cat);
          return <div key={cat.k} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "relative" }}>
            {/* Category label with dice/badge icon */}
            <div style={{ padding: "8px 6px", background: t.bgS, border: `1px solid ${t.brd}`,
              borderRadius: ci === 0 ? "8px 0 0 0" : ci === GC.length - 1 ? "0 0 0 8px" : 0,
              display: "flex", alignItems: "center", gap: 5 }}>
              {cat.n ? <DiceFace n={cat.n} size={22} color={t.pri} /> : <ComboBadge k={cat.k} color={t.pri} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: t.pri, fontFamily: "'Playfair Display'", fontSize: 11, lineHeight: 1.2 }}>{cat.l}</div>
                <div style={{ fontSize: 8, color: t.txtF }}>{cat.n ? `${L.upTo} ${cat.m}` : gV(cat).join("/")}</div>
              </div>
            </div>
            {/* Score cells */}
            {ps.map((p, pi) => { const val = p.scores[cat.k];
              return <div key={pi} onClick={() => { if (val === null && !askTurnGuard(pi)) return; setSheet({ pi, cat: cat.k }) }}
                style={{ textAlign: "center", cursor: "pointer",
                  background: val === "x"
                    ? `linear-gradient(135deg, ${t.errBg}, ${t.card})`
                    : val !== null
                    ? `linear-gradient(135deg, ${t.okBg}, ${t.card})`
                    : t.card,
                  border: val !== null ? `1px solid ${t.brd}40` : `1px dashed ${t.brd}`,
                  borderRadius: ci === 0 && pi === ps.length - 1 ? "0 8px 0 0" : ci === GC.length - 1 && pi === ps.length - 1 ? "0 0 8px 0" : 8,
                  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48,
                  transition: "all .2s",
                  boxShadow: val !== null ? "inset 0 1px 3px rgba(0,0,0,.04)" : "none",
                }}>
                {val === "x" ? <span style={{ color: t.err, fontSize: 15, fontWeight: 700 }}>✗</span>
                  : val !== null ? <span style={{ fontFamily: "'Playfair Display'", fontSize: 17, fontWeight: 700, color: t.pri }}>{val}</span>
                  : <span style={{ color: t.txtF, fontSize: 13, opacity: 0.4 }}>·</span>}
              </div> })}
            {same && <div style={{ position: "absolute", top: "50%", left: COL1 - 4, right: 2, height: 2, background: t.pri, opacity: .25, pointerEvents: "none" }} />}
          </div> })}

        {/* Total row — styled */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginTop: 6 }}>
          <div style={{ padding: "10px 5px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1,
            fontFamily: "'DM Sans'", background: t.pri, borderRadius: "0 0 0 10px",
            display: "flex", alignItems: "center", justifyContent: "center" }}>TOTAL</div>
          {ps.map((p, pi) => {
            const isLeader = ps.length > 1 && tot(p) === maxTot && maxTot > 0;
            return <div key={pi} style={{ padding: "6px 4px", textAlign: "center",
              background: isLeader ? t.pri + "12" : t.bgS,
              border: isLeader ? `1.5px solid ${t.pri}40` : `1px solid ${t.brd}`,
              borderRadius: pi === ps.length - 1 ? "0 0 10px 0" : 0 }}>
              <span style={{ fontFamily: "'Playfair Display'", fontSize: 24, fontWeight: 800, color: t.pri }}>{tot(p)}</span>
            </div>
          })}
        </div>
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}

export default Generala;
