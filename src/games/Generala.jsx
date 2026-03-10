import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, F, B, EN, Hdr, IcoBtn, Modal, UndoBar, HomeIcon } from '../lib.jsx';

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
    if (!ps.length || pi === currentTurnIndex) return true;
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
  const doShare = () => shareResult("Generala", ps.map(p => `${p.name}: ${tot(p)}`), { accent: "#C4783D", accentLight: "#D4945C" });

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

  const darkToggle = <button onClick={tog} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", touchAction: "manipulation", fontSize: 16, lineHeight: 1 }}>{dk ? "☀️" : "🌙"}</button>;

  if (loading) return <div style={{ background: t.bg, minHeight: "100vh" }}><Hdr title="Generala" onBack={goBack} icons={darkToggle} /><div style={{ padding: 24, textAlign: "center", color: t.txtM }}>…</div></div>;
  if (!started) return <div style={{ background: t.bg, minHeight: "100vh" }}><Hdr title="Generala" onBack={goBack} icons={darkToggle} />

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
    <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 8, flexShrink: 0, borderBottom: `1px solid ${t.brd}` }}>
      <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 12px", touchAction: "manipulation", display: "flex", alignItems: "center" }}><HomeIcon color={t.txtM} /></button>
      <button onClick={tog} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", touchAction: "manipulation", fontSize: 16, lineHeight: 1 }}>
        {dk ? "☀️" : "🌙"}
      </button>
      <div style={{ flex: 1, textAlign: "center" }}>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>
          {turnsLeft > 0 ? `${turnsLeft} ${L.turnsLeft}` : L.done}
        </span>
      </div>
      {!allDone && <button onClick={() => setModal("menu")} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 8, color: t.txt, fontSize: 13, fontFamily: F.sans, fontWeight: 500, cursor: "pointer", padding: "6px 14px", touchAction: "manipulation" }}>Menu</button>}
    </div>

    {modal === "menu" && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 8, padding: 4, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 240, width: "100%" }}>
        {[
          { label: "Compartir", action: doShare },
          ...(hist.length > 0 ? [{ label: L.hist, action: () => { setModal(null); setShowH(true); } }] : []),
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

    {(modal === "new" || modal === "reset") && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
      <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
      <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
      <div style={{ display: "flex", gap: 10 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={nuevaPartida} s={{ flex: 1 }}>{L.nuevaPartida}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
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
    {allDone && <div style={{ textAlign: "center", padding: 16, background: t.pri, color: "#fff", animation: "scaleIn .3s ease" }}>
      <div style={{ fontSize: 20, fontFamily: F.serif, fontWeight: 400 }}>¡{ps.reduce((b, p) => tot(p) > tot(b) ? p : b, ps[0]).name} {L.winSg}!</div>
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
    </div>}

    {/* ══════ SCORE GRID ══════ */}
    <div style={{ padding: "10px 8px 20px", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(300, COL1 + ps.length * 72) }}>
        {/* Player header with numbered avatars */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ padding: 4 }} />
          {ps.map((p, i) => <div key={i} style={{ padding: "8px 4px 6px", textAlign: "center", background: t.card, borderRadius: "6px 6px 0 0", border: `1px solid ${t.brd}`, borderBottom: "none" }}>
            <div onClick={() => startNameEdit(i)} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: t.bgS, border: `1.5px solid ${t.brd}`, color: t.pri,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 4px", fontSize: 13, fontWeight: 700, fontFamily: F.sans,
              cursor: "pointer",
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
          return <div key={cat.k} style={{ display: "grid", gridTemplateColumns: gridCols, gap: 4, marginBottom: 4, position: "relative" }}>
            {/* Category label with dice/badge icon */}
            <div style={{ padding: "8px 6px", background: t.bgS, border: `1px solid ${t.brd}`,
              borderRadius: ci === 0 ? "6px 0 0 0" : ci === GC.length - 1 ? "0 0 0 6px" : 0,
              display: "flex", alignItems: "center", gap: 5 }}>
              {cat.n ? <DiceFace n={cat.n} size={22} color={t.pri} /> : <ComboBadge k={cat.k} color={t.pri} t={t} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: t.pri, fontFamily: F.sans, fontSize: 13, lineHeight: 1.2 }}>{cat.l}</div>
                <div style={{ fontSize: 10, color: t.txtF, fontFamily: F.sans }}>{cat.n ? `${L.upTo} ${cat.m}` : gV(cat).join("/")}</div>
              </div>
            </div>
            {/* Score cells — Doble Gen blocked if Generala not filled */}
            {ps.map((p, pi) => { const val = p.scores[cat.k];
              const isDobleBlocked = cat.k === "doble" && p.scores["gen"] === null;
              return <div key={pi} onClick={() => {
                if (isDobleBlocked) return;
                if (val === null && !askTurnGuard(pi)) return;
                setSheet({ pi, cat: cat.k });
              }}
                style={{ textAlign: "center", cursor: isDobleBlocked ? "default" : "pointer",
                  background: val !== null ? t.bgS : t.card,
                  border: val !== null ? `1px solid ${t.brd}` : `1px dashed ${t.brd}`,
                  borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 48,
                  transition: "all .2s",
                  opacity: isDobleBlocked ? 0.25 : 1,
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
              <span style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 400, color: t.pri }}>{tot(p)}</span>
            </div>
          })}
        </div>
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}

export default Generala;
