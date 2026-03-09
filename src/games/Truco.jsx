import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, ST, clone, shareResult, vib, vibWin, fmtDate, F, B, EN, Modal, UndoBar, HomeIcon } from '../lib.jsx';

function TrucoTally({ count, color, divAt, buenasColor, collapsed, onClick }) {
  const SZ = 64, PD = 5, GAP = 6;
  const displayCount = collapsed ? Math.max(0, count - (divAt || 0)) : count;
  const showDiv = divAt && !collapsed;

  const jitter = useMemo(() => {
    const a = [];
    for (let i = 0; i < 80; i++) a.push(((Math.sin((count * 100 + i) * 9301 + 49297) % 1) * 1.2));
    return a;
  }, [count]);

  let ji = 0;
  const j = () => jitter[ji++ % jitter.length];
  const els = [];
  let drawn = 0, divPlaced = !showDiv;

  const fullSq = (key) => (
    <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
      <rect x={PD + j()} y={PD + j()} width={SZ - PD * 2 + j()} height={SZ - PD * 2 + j()}
        fill="none" stroke={color} strokeWidth="2.5" rx="1" strokeLinecap="round" opacity=".7" />
      <line x1={PD + 1 + j()} y1={SZ - PD - 1 + j()} x2={SZ - PD - 1 + j()} y2={PD + 1 + j()}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
    </svg>
  );

  const partSq = (n, key) => {
    const segs = [];
    if (n >= 1) segs.push(<line key="l" x1={PD + j()} y1={PD + j()} x2={PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />);
    if (n >= 2) segs.push(<line key="b" x1={PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />);
    if (n >= 3) segs.push(<line key="r" x1={SZ - PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />);
    if (n >= 4) segs.push(<line key="t" x1={SZ - PD + j()} y1={PD + j()} x2={PD + j()} y2={PD + j()} stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity=".7" />);
    return <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>{segs}</svg>;
  };

  const bc = buenasColor || color;
  const divider = (
    <div key="div" style={{ display: "flex", alignItems: "center", width: "100%", margin: `${GAP + 2}px 0`, padding: "0 2px" }}>
      <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${bc})`, opacity: .5 }} />
      <span style={{ fontSize: 9, color: bc, fontWeight: 700, letterSpacing: 2, padding: "0 8px", fontFamily: F.sans }}>BUENAS</span>
      <div style={{ flex: 1, height: 2, background: `linear-gradient(270deg, transparent, ${bc})`, opacity: .5 }} />
    </div>
  );

  while (drawn < displayCount) {
    const rem = displayCount - drawn;
    const batch = Math.min(5, rem);

    if (!divPlaced && drawn < divAt && drawn + batch > divAt) {
      const before = divAt - drawn;
      if (before > 0) {
        els.push(before === 5 ? fullSq(`s${drawn}`) : partSq(before, `p${drawn}`));
        drawn += before;
      }
      els.push(divider);
      divPlaced = true;
      continue;
    }

    if (!divPlaced && drawn + batch === divAt) {
      els.push(batch === 5 ? fullSq(`s${drawn}`) : partSq(batch, `p${drawn}`));
      drawn += batch;
      els.push(divider);
      divPlaced = true;
      continue;
    }

    els.push(batch === 5 ? fullSq(`s${drawn}`) : partSq(batch, `p${drawn}`));
    drawn += batch;
  }

  return (
    <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: GAP, cursor: onClick ? "pointer" : undefined }}>
      {els.length > 0 ? els : <div style={{ color, opacity: 0.15, fontSize: 24 }}>—</div>}
    </div>
  );
}

function Col({ player, idx, target, winner, ph, onAdd, onRen, t, picaPhase, collapsed, onToggleCollapse, showCollapseToggle }) {
  const dim = winner && winner !== player;
  const atTarget = player.p >= target;
  const hasBuenas = target === 30;

  const handleTallyTap = () => {
    if (!winner && !picaPhase && !atTarget) {
      onAdd(idx, 1);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", opacity: dim ? 0.3 : 1, transition: "opacity .3s" }}>
      {/* Name */}
      <div style={{ textAlign: "center", padding: "12px 10px 6px" }}>
        <EN name={player.name} onSave={n => onRen(idx, n)} sz={18} fw={700} />
      </div>

      {/* Score number — compact in normal, centered in picapica */}
      <div style={{ textAlign: "center", padding: picaPhase ? "12px 0" : "4px 0 2px", flex: picaPhase ? 1 : undefined, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${t.brd}` }}>
        <div style={{ fontFamily: F.serif, fontSize: ph ? 40 : 52, color: t.pri, lineHeight: 1, letterSpacing: -1 }}>
          {player.p}
        </div>
      </div>

      {/* Tallies — scrollable, tap to add +1 */}
      {!picaPhase && (
        <div style={{
          flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
          padding: "6px 10px 4px", overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 60,
          borderTop: `1px solid ${t.brd}`,
        }}>
          {hasBuenas && collapsed && (
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: t.ok, marginBottom: 4, fontFamily: F.sans }}>BUENAS</div>
          )}
          {hasBuenas && !collapsed && player.p > 0 && (
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: t.err, marginBottom: 4, fontFamily: F.sans }}>MALAS</div>
          )}
          <TrucoTally count={player.p} color={t.txt} divAt={hasBuenas ? 15 : null} buenasColor={t.ok} collapsed={collapsed} onClick={handleTallyTap} />
          {showCollapseToggle && (
            <button onClick={(e) => { e.stopPropagation(); onToggleCollapse?.(); }} style={{
              background: "none", border: `1px solid ${t.brd}`, borderRadius: 10, fontSize: 10, color: t.txtM,
              fontFamily: F.sans, cursor: "pointer", padding: "2px 8px", marginTop: 6, touchAction: "manipulation",
            }}>
              {collapsed ? "Ver todo" : "Solo buenas"}
            </button>
          )}
        </div>
      )}

      {/* Buttons */}
      {!picaPhase && !winner && (
        <div style={{ display: "flex", gap: 5, padding: "8px 8px 14px", borderTop: `1px solid ${t.brd}` }}>
          <button onClick={() => player.p > 0 && onAdd(idx, -1)} disabled={atTarget || player.p <= 0} style={{
            background: "transparent", color: (player.p <= 0) ? t.txtF : t.err,
            border: `1px solid ${(player.p <= 0) ? t.brd : t.err}`,
            borderRadius: 6, height: 48, flex: 0.65, fontSize: 18,
            fontFamily: F.serif, cursor: player.p <= 0 ? "default" : "pointer", touchAction: "manipulation",
            opacity: player.p <= 0 ? 0.3 : 1, transition: "all .15s",
          }}>−1</button>
          {[1, 2, 3].map(v => (
            <button key={v} onClick={() => !atTarget && onAdd(idx, v)} disabled={atTarget} style={{
              background: "transparent", color: atTarget ? t.txtF : t.pri, border: `1px solid ${atTarget ? t.brd : t.pri}`,
              borderRadius: 6, height: 48, flex: 1, fontSize: 20,
              fontFamily: F.serif, cursor: atTarget ? "default" : "pointer", touchAction: "manipulation",
              opacity: atTarget ? 0.3 : 1, transition: "all .15s",
            }}>+{v}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const TEAM_SIZE_OPTIONS = [
  { teamSize: 1, label: "2 jugadores" },
  { teamSize: 2, label: "4 jugadores" },
  { teamSize: 3, label: "6 jugadores" },
];

const defaultRawNames = (teamSize) => Array.from({ length: teamSize * 2 }, () => "");
const maxScore = (scores) => Math.max(...scores.map((s) => s.p), 0);

function buildTeamName(rawNames, teamSize, teamIdx) {
  const start = teamIdx * teamSize;
  const members = rawNames.slice(start, start + teamSize);

  if (teamSize === 1) {
    const name = members[0]?.trim();
    if (!name) return teamIdx === 0 ? "Nosotros" : "Ellos";
    return name;
  }

  const filled = members.map((n, i) => ({ name: n?.trim(), idx: start + i }))
    .filter(m => m.name && m.name.length > 0);

  if (filled.length === 0) return `Jugadores ${start + 1}-${start + teamSize}`;
  if (filled.length === 1) return filled[0].name;
  return filled.map(m => m.name).join(" - ");
}

function buildScore(rawNames, teamSize) {
  return [0, 1].map((teamIdx) => ({ name: buildTeamName(rawNames, teamSize, teamIdx), p: 0 }));
}

function toRawNames(names, teamSize) {
  if (Array.isArray(names) && names.length === teamSize * 2) return names;
  if (teamSize === 1 && Array.isArray(names) && names.length === 2) return names;
  return defaultRawNames(teamSize);
}

function Truco({ onBack, onContinueChange, onChangeGame }) {
  const { t, sounds, L } = useApp();
  const [target, setTarget] = useState(15);
  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState(1);
  const [started, setStarted] = useState(false);
  const [rawNames, setRawNames] = useState(defaultRawNames(1));
  const [sc, setSc] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const lastStateRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [picaRange, setPicaRange] = useState([5, 25]);
  const [picaMode, setPicaMode] = useState("suma");
  // Pica pica state
  const [picaPhase, setPicaPhase] = useState(false);
  const [picaNotif, setPicaNotif] = useState(null);
  const [picaDuels, setPicaDuels] = useState([]);
  const [picaCurrent, setPicaCurrent] = useState({ t0: 0, t1: 0 });
  const [picaRound, setPicaRound] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);
  const nameRefs = useRef([]);
  const prevBothBuenasRef = useRef(false);
  const ph = typeof window !== "undefined" && window.innerWidth <= 480;

  useEffect(() => {
    ST.load("truco-game").then(d => {
      if (d?.started) {
        const savedTeamSize = d.teamSize ?? 1;
        const savedRawNames = toRawNames(d.rawNames ?? d.names, savedTeamSize);
        const savedScore = Array.isArray(d.sc) && d.sc.length === 2 ? d.sc : buildScore(savedRawNames, savedTeamSize);
        setTarget(d.target ?? 15);
        setTeamSize(savedTeamSize);
        setRawNames(savedRawNames);
        setSc(savedScore);
        if (Array.isArray(d.picaRange) && d.picaRange.length === 2) setPicaRange(d.picaRange);
        if (d.picaMode === "suma" || d.picaMode === "diff") setPicaMode(d.picaMode);
        if (d.picaPhase) setPicaPhase(true);
        if (Array.isArray(d.picaDuels)) setPicaDuels(d.picaDuels);
        if (d.picaCurrent) setPicaCurrent(d.picaCurrent);
        if (typeof d.picaRound === "number") setPicaRound(d.picaRound);
        setStarted(true);
        onContinueChange?.("truco");
      }
      setLoading(false);
    });
    ST.load("truco-hist").then(d => { if (Array.isArray(d)) setHist(d) });
  }, []);

  useEffect(() => {
    if (!started) return;
    ST.save("truco-game", { started: true, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound });
    onContinueChange?.("truco");
  }, [started, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound]);

  // Auto-collapse both when both pass buenas (15+ in a game to 30)
  const bothInBuenas = target === 30 && sc.length === 2 && sc[0]?.p >= 15 && sc[1]?.p >= 15;
  const showCollapseToggle = bothInBuenas;
  useEffect(() => {
    if (bothInBuenas && !prevBothBuenasRef.current) {
      setCollapsed(true);
    }
    prevBothBuenasRef.current = bothInBuenas;
  }, [bothInBuenas]);

  const persist = (next = {}) => {
    if (!started) return;
    ST.save("truco-game", {
      started: true, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound,
      ...next,
    });
  };

  const handleTeamSize = (nextTeamSize) => {
    setTeamSize(nextTeamSize);
    setRawNames(defaultRawNames(nextTeamSize));
    nameRefs.current = [];
  };

  const nextName = (i) => {
    const nx = nameRefs.current[i + 1];
    if (nx) { nx.focus(); nx.select?.(); }
    else startGame();
  };

  const startGame = async () => {
    const safeRawNames = rawNames.map((name, i) => name?.trim() || "");
    const fresh = buildScore(safeRawNames, teamSize);
    setRawNames(safeRawNames);
    setSc(fresh);
    setPicaPhase(false);
    setPicaDuels([]);
    setPicaCurrent({ t0: 0, t1: 0 });
    setPicaRound(0);
    setStarted(true);
    await ST.save("truco-game", { started: true, target, teamSize, rawNames: safeRawNames, sc: fresh, picaRange, picaMode, picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0 });
    onContinueChange?.("truco");
  };

  const goBack = async () => {
    if (started) persist();
    onContinueChange?.(started ? "truco" : null);
    onChangeGame?.();
  };

  const isInPicaRange = (scores) => teamSize === 3 && maxScore(scores) >= picaRange[0] && maxScore(scores) < picaRange[1];

  const add = (i, v) => {
    if (v > 0 && sc[i].p >= target) return;
    if (v < 0 && sc[i].p <= 0) return;
    lastStateRef.current = { sc: clone(sc), picaPhase, picaDuels: clone(picaDuels), picaCurrent: clone(picaCurrent), picaRound };
    setToast({ text: `${sc[i].name}: ${v > 0 ? "+" : ""}${v}`, undo: true });
    const newP = Math.min(target, Math.max(0, sc[i].p + v));
    const nextSc = sc.map((row, idx) => idx === i ? { ...row, p: newP } : row);

    // Check pica pica entry — only when NOT already in picaPhase
    // Exit is handled at cycle boundaries (advanceFromManoRedonda), not mid-cycle
    if (!picaPhase) {
      const wasInRange = isInPicaRange(sc);
      const nowInRange = isInPicaRange(nextSc);
      if (!wasInRange && nowInRange) {
        setPicaPhase(true);
        setPicaDuels([]);
        setPicaCurrent({ t0: 0, t1: 0 });
        setPicaRound(0);
        setPicaNotif("start");
        setTimeout(() => setPicaNotif(null), 3500);
      }
    }

    setSc(nextSc);
    persist({ sc: nextSc });
    if (sounds) vib();
    if (sounds && newP >= target) vibWin();
  };

  // Pica pica duelo scoring
  const addDuelo = (teamIdx, v) => {
    const key = teamIdx === 0 ? "t0" : "t1";
    const next = { ...picaCurrent, [key]: Math.max(0, picaCurrent[key] + v) };
    setPicaCurrent(next);
    persist({ picaCurrent: next });
    if (sounds) vib();
  };

  const nextDuelo = () => {
    const completed = [...picaDuels, picaCurrent];
    const nextRound = picaRound + 1;
    const nextDueloInCycle = nextRound % 4;
    const nextIsManoRedonda = nextDueloInCycle === 3;

    // Calculate updated scores
    let nextSc = sc;

    if (picaMode === "suma") {
      // Suma mode: add each duelo's scores to main immediately
      nextSc = sc.map((row, idx) => ({
        ...row, p: Math.min(target, row.p + (idx === 0 ? picaCurrent.t0 : picaCurrent.t1))
      }));
    }

    if (nextIsManoRedonda && picaMode === "diff") {
      // Diferencia mode: after 3 duelos, calc total diff and add to winner only
      const t0Total = completed.reduce((s, d) => s + d.t0, 0);
      const t1Total = completed.reduce((s, d) => s + d.t1, 0);
      if (t0Total !== t1Total) {
        const diff = Math.abs(t0Total - t1Total);
        const winnerIdx = t0Total > t1Total ? 0 : 1;
        nextSc = nextSc.map((row, idx) => idx === winnerIdx ? { ...row, p: Math.min(target, row.p + diff) } : row);
      }
    }

    // Apply state — never exit picapica mid-cycle, let advanceFromManoRedonda handle it
    if (nextSc !== sc) setSc(nextSc);
    setPicaDuels(completed);
    setPicaCurrent({ t0: 0, t1: 0 });
    setPicaRound(nextRound);

    // Single persist call with all updates
    persist({
      sc: nextSc,
      picaDuels: completed,
      picaCurrent: { t0: 0, t1: 0 },
      picaRound: nextRound,
    });
    if (sounds) vib();
  };

  const advanceFromManoRedonda = () => {
    // Move from mano redonda to the next duelo cycle
    const nextRound = picaRound + 1;
    // Check if still in pica range
    const stillInRange = isInPicaRange(sc);
    if (!stillInRange) {
      setPicaPhase(false);
      setPicaDuels([]);
      setPicaCurrent({ t0: 0, t1: 0 });
      setPicaRound(0);
      setPicaNotif("end");
      setTimeout(() => setPicaNotif(null), 3500);
      persist({ picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0 });
    } else {
      // Reset duels for next cycle, advance round
      setPicaDuels([]);
      setPicaCurrent({ t0: 0, t1: 0 });
      setPicaRound(nextRound);
      persist({ picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: nextRound });
    }
    if (sounds) vib();
  };

  // Both modes: 3 duelos + 1 mano redonda = cycle of 4
  const picaDueloInCycle = picaRound % 4;
  const isManoRedonda = picaDueloInCycle === 3;
  const picaDueloNum = picaDueloInCycle + 1;

  const ren = (i, nextName) => {
    const members = nextName.split("-").map((part) => part.trim()).filter(Boolean);
    const nextRawNames = [...rawNames];
    for (let offset = 0; offset < teamSize; offset++) {
      nextRawNames[i * teamSize + offset] = members[offset] || nextRawNames[i * teamSize + offset] || "";
    }
    const nextSc = sc.map((row, idx) => idx === i ? { ...row, name: buildTeamName(nextRawNames, teamSize, i) } : row);
    setRawNames(nextRawNames);
    setSc(nextSc);
    persist({ rawNames: nextRawNames, sc: nextSc });
  };

  const winner = sc.find(s => s.p >= target);

  const saveToHistory = async () => {
    if (sc.some(s => s.p > 0)) {
      const entry = { players: sc.map(s => ({ name: s.name, t: s.p })), date: fmtDate() };
      const nextHist = [entry, ...hist];
      setHist(nextHist);
      await ST.save("truco-hist", nextHist);
    }
  };

  const revancha = async () => {
    await saveToHistory();
    const nextSc = sc.map(s => ({ ...s, p: 0 }));
    setSc(nextSc);
    setPicaPhase(false);
    setPicaDuels([]);
    setPicaCurrent({ t0: 0, t1: 0 });
    setPicaRound(0);
    setCollapsed(false);
    prevBothBuenasRef.current = false;
    setModal(null);
    lastStateRef.current = null;
    setToast({ text: L.revancha });
    persist({ sc: nextSc, picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0 });
  };

  const nuevaPartida = async () => {
    await saveToHistory();
    resetAll();
  };

  const delH = async (i) => {
    const next = hist.filter((_, j) => j !== i);
    setHist(next);
    if (next.length) await ST.save("truco-hist", next);
    else await ST.del("truco-hist");
  };

  const doShare = () => shareResult(`Truco · A ${target}`, sc.map((s) => `${s.name}: ${s.p}`), { accent: "#1A5C52", accentLight: "#3D8B7A" });

  const handleUndo = () => {
    const ls = lastStateRef.current;
    if (!ls) return;
    setSc(ls.sc);
    if (ls.picaPhase !== undefined) setPicaPhase(ls.picaPhase);
    if (ls.picaDuels) setPicaDuels(ls.picaDuels);
    if (ls.picaCurrent) setPicaCurrent(ls.picaCurrent);
    if (ls.picaRound !== undefined) setPicaRound(ls.picaRound);
    persist({ sc: ls.sc, picaPhase: ls.picaPhase, picaDuels: ls.picaDuels, picaCurrent: ls.picaCurrent, picaRound: ls.picaRound });
    lastStateRef.current = null;
  };

  const resetAll = async () => {
    setStarted(false);
    setStep(0);
    setModal(null);
    setSc([]);
    setPicaPhase(false);
    setPicaDuels([]);
    setPicaCurrent({ t0: 0, t1: 0 });
    setPicaRound(0);
    setCollapsed(false);
    prevBothBuenasRef.current = false;
    await ST.del("truco-game");
    onContinueChange?.(null);
  };

  const rawCount = teamSize * 2;

  if (loading) return <div style={{ minHeight: "100vh", background: t.bg }}><div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div></div>;

  if (!started) return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <div style={{ padding: "12px 16px 0" }}>
        <button onClick={goBack} style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "8px", touchAction: "manipulation", display: "flex", alignItems: "center",
        }}>
          <HomeIcon color={t.txtM} />
        </button>
      </div>

      <div style={{ maxWidth: 400, margin: "0 auto", padding: "20px 24px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step === 0 && <>
          <p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>{L.howMany}</p>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
            {[15, 30].map(v => (
              <button key={v} onClick={() => setTarget(v)} style={{
                background: "transparent", border: `1.5px solid ${target === v ? t.pri : t.brd}`, borderRadius: 6,
                height: 100, fontSize: 36, fontFamily: F.serif, color: target === v ? t.pri : t.txt,
                cursor: "pointer", touchAction: "manipulation", transition: "all .15s",
              }}>{v}</button>
            ))}
          </div>
          <B onClick={() => setStep(1)} s={{ width: "100%" }}>{L.next}</B>
        </>}

        {step === 1 && <>
          <p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>¿Cuántos jugadores?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TEAM_SIZE_OPTIONS.map((opt) => (
              <button key={opt.teamSize} onClick={() => handleTeamSize(opt.teamSize)} style={{
                background: "transparent", border: `1.5px solid ${teamSize === opt.teamSize ? t.pri : t.brd}`, borderRadius: 6,
                padding: 16, textAlign: "left", fontSize: 15, fontFamily: F.sans, fontWeight: 500,
                color: teamSize === opt.teamSize ? t.pri : t.txt, cursor: "pointer", touchAction: "manipulation", transition: "all .15s",
              }}>{opt.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setStep(0)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={() => setStep(teamSize === 3 ? 2 : 3)} s={{ flex: 1 }}>{L.next}</B>
          </div>
        </>}

        {step === 2 && teamSize === 3 && <>
          <p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>Picapica</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontFamily: F.sans, color: t.txtM }}>De</span>
            <input type="number" inputMode="numeric" value={picaRange[0]}
              onChange={e => setPicaRange([parseInt(e.target.value) || 0, picaRange[1]])}
              style={{ width: 56, background: "transparent", border: `1.5px solid ${t.brd}`, borderRadius: 6,
                padding: "10px 8px", fontSize: 18, fontFamily: F.serif, color: t.txt, textAlign: "center", outline: "none" }} />
            <span style={{ fontSize: 14, fontFamily: F.sans, color: t.txtM }}>a</span>
            <input type="number" inputMode="numeric" value={picaRange[1]}
              onChange={e => setPicaRange([picaRange[0], parseInt(e.target.value) || 0])}
              style={{ width: 56, background: "transparent", border: `1.5px solid ${t.brd}`, borderRadius: 6,
                padding: "10px 8px", fontSize: 18, fontFamily: F.serif, color: t.txt, textAlign: "center", outline: "none" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => setPicaMode("suma")} style={{
              background: "transparent", border: `1.5px solid ${picaMode === "suma" ? t.pri : t.brd}`, borderRadius: 6,
              padding: "14px 16px", textAlign: "left", cursor: "pointer", touchAction: "manipulation", transition: "all .15s",
            }}>
              <div style={{ fontSize: 15, fontFamily: F.sans, fontWeight: 500, color: picaMode === "suma" ? t.pri : t.txt }}>Suma todo</div>
              <div style={{ fontSize: 12, fontFamily: F.sans, color: t.txtM, marginTop: 2 }}>Se anota cada duelo por separado</div>
            </button>
            <button onClick={() => setPicaMode("diff")} style={{
              background: "transparent", border: `1.5px solid ${picaMode === "diff" ? t.pri : t.brd}`, borderRadius: 6,
              padding: "14px 16px", textAlign: "left", cursor: "pointer", touchAction: "manipulation", transition: "all .15s",
            }}>
              <div style={{ fontSize: 15, fontFamily: F.sans, fontWeight: 500, color: picaMode === "diff" ? t.pri : t.txt }}>Diferencia</div>
              <div style={{ fontSize: 12, fontFamily: F.sans, color: t.txtM, marginTop: 2 }}>Se anota la diferencia al final</div>
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <B v="gh" onClick={() => setStep(1)} s={{ flex: 1 }}>{L.back}</B>
            <B onClick={() => setStep(3)} s={{ flex: 1 }}>{L.next}</B>
          </div>
        </>}

        {step === 3 && <>
          <p style={{ fontSize: 22, color: t.txt, textAlign: "center", margin: 0, fontFamily: F.serif }}>{L.names}</p>

          {teamSize === 1 ? (
            Array.from({ length: rawCount }).map((_, i) => (
              <input key={i} autoFocus={i === 0} autoCapitalize="words" ref={el => { nameRefs.current[i] = el; }}
                value={rawNames[i] ?? ""}
                onChange={e => {
                  const nextRawNames = [...rawNames];
                  nextRawNames[i] = e.target.value;
                  setRawNames(nextRawNames);
                }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); nextName(i); } }}
                onFocus={e => e.target.select()}
                enterKeyHint={i === rawCount - 1 ? "done" : "next"}
                placeholder={i === 0 ? "Nosotros" : "Ellos"}
                style={{
                  width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${t.brd}`, color: t.txt,
                  padding: "14px 0", fontSize: 16, fontFamily: F.sans, outline: "none", borderRadius: 0, textTransform: "capitalize",
                }} />
            ))
          ) : (
            [0, 1].map((teamIdx) => (
              <div key={teamIdx}>
                <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginBottom: 6, fontWeight: 400, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {teamIdx === 0 ? "Primera pareja" : "Segunda pareja"}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {Array.from({ length: teamSize }).map((_, offset) => {
                    const idx = teamIdx * teamSize + offset;
                    return (
                      <input key={idx} autoFocus={idx === 0} autoCapitalize="words" ref={el => { nameRefs.current[idx] = el; }}
                        value={rawNames[idx] ?? ""}
                        onChange={e => {
                          const nextRawNames = [...rawNames];
                          nextRawNames[idx] = e.target.value;
                          setRawNames(nextRawNames);
                        }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); nextName(idx); } }}
                        onFocus={e => e.target.select()}
                        enterKeyHint={idx === rawCount - 1 ? "done" : "next"}
                        placeholder={`Jugador ${idx + 1}`}
                        style={{
                          width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${t.brd}`, color: t.txt,
                          padding: "14px 0", fontSize: 16, fontFamily: F.sans, outline: "none", borderRadius: 0, textTransform: "capitalize",
                        }} />
                    );
                  })}
                </div>
              </div>
            ))
          )}

          <div style={{ position: "sticky", bottom: 10, marginTop: 8, background: `linear-gradient(180deg, transparent, ${t.bg} 28%)`, paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <B v="gh" onClick={() => setStep(teamSize === 3 ? 2 : 1)} s={{ flex: 1 }}>{L.back}</B>
              <B onClick={startGame} s={{ flex: 1 }}>{L.start}</B>
            </div>
          </div>
        </>}
      </div>
    </div>
  );

  return (<>
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: t.bg, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: ph ? "8px 10px" : "10px 14px", gap: 8, flexShrink: 0, borderBottom: `1px solid ${t.brd}` }}>
        <button onClick={goBack} style={{
          background: "none", border: "none", cursor: "pointer", padding: "4px", touchAction: "manipulation", display: "flex", alignItems: "center",
        }}>
          <HomeIcon color={t.txtM} />
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "2px 10px", fontSize: 11, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>
          A {target}
        </div>
        {!winner && <button onClick={() => setModal("menu")} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 8, color: t.txt, fontSize: 13, fontFamily: F.sans, fontWeight: 500, cursor: "pointer", padding: "6px 14px", touchAction: "manipulation" }}>Menu</button>}
      </div>

      {/* Winner banner */}
      {winner && (
        <div style={{ textAlign: "center", padding: ph ? 12 : 16, background: t.pri, color: "#fff", flexShrink: 0, animation: "scaleIn .3s ease" }}>
          <div style={{ fontSize: ph ? 18 : 20, fontFamily: F.serif, fontWeight: 400 }}>¡{winner.name} {L.winPl}!</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
            <button onClick={revancha} style={{
              background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 600,
              padding: "10px 20px", cursor: "pointer", flex: 1, touchAction: "manipulation",
            }}>{L.revancha}</button>
            <button onClick={nuevaPartida} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,.3)",
              borderRadius: 8, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 500,
              padding: "10px 20px", cursor: "pointer", flex: 1, touchAction: "manipulation",
            }}>{L.nuevaPartidaSetup}</button>
          </div>
          <button onClick={doShare} style={{
            background: "none", border: "none", color: "rgba(255,255,255,.6)",
            fontSize: 12, fontFamily: F.sans, cursor: "pointer", marginTop: 8, padding: "4px 8px", touchAction: "manipulation",
          }}>{L.share}</button>
        </div>
      )}

      {/* Pica pica notification */}
      {picaNotif && (
        <div style={{
          padding: "10px 16px", background: `${t.pri}15`, borderBottom: `1px solid ${t.pri}30`,
          textAlign: "center", animation: "fadeUp .2s ease", flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, color: t.pri, fontWeight: 600, fontFamily: F.sans }}>
            {picaNotif === "start" ? `${L.picapicaStart} · De ${picaRange[0]} a ${picaRange[1]}` : L.picapicaEnd}
          </span>
        </div>
      )}

      {/* Main columns */}
      <div style={{ flex: (picaPhase && !isManoRedonda) ? undefined : 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <Col player={sc[0]} idx={0} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} picaPhase={picaPhase && !isManoRedonda} collapsed={bothInBuenas && collapsed} onToggleCollapse={() => setCollapsed(c => !c)} showCollapseToggle={showCollapseToggle} />
        <div style={{ width: 1, background: t.brd, flexShrink: 0 }} />
        <Col player={sc[1]} idx={1} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} picaPhase={picaPhase && !isManoRedonda} collapsed={bothInBuenas && collapsed} onToggleCollapse={() => setCollapsed(c => !c)} showCollapseToggle={showCollapseToggle} />
      </div>

      {/* Pica pica duelo scorer */}
      {picaPhase && !winner && !isManoRedonda && (
        <div style={{ borderTop: `2px solid ${t.pri}`, background: t.bgS, flexShrink: 0, padding: "10px 12px 14px" }}>
          {/* Phase label */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.pri, fontFamily: F.sans, letterSpacing: 1 }}>
              PICAPICA · {L.duelo} {picaDueloNum} de 3
            </span>
          </div>

          {/* Completed duelos summary */}
          {picaDuels.length > 0 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
              {picaDuels.slice(-3).map((d, i) => (
                <span key={i} style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, background: t.card, border: `1px solid ${t.brd}`, borderRadius: 6, padding: "2px 8px" }}>
                  D{picaDuels.length - 2 + i}: {d.t0}-{d.t1}
                </span>
              ))}
            </div>
          )}

          {/* Current duelo: two teams side by side */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(ti => {
              const val = ti === 0 ? picaCurrent.t0 : picaCurrent.t1;
              return (
                <div key={ti} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginBottom: 4 }}>{sc[ti]?.name}</div>
                  <div style={{ fontSize: 28, fontFamily: F.serif, color: t.pri, marginBottom: 6 }}>{val}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => val > 0 && addDuelo(ti, -1)} disabled={val <= 0} style={{
                      background: "transparent", color: val <= 0 ? t.txtF : t.err, border: `1px solid ${val <= 0 ? t.brd : t.err}`,
                      borderRadius: 6, height: 40, flex: 0.6, fontSize: 16, fontFamily: F.serif, cursor: "pointer", touchAction: "manipulation",
                      opacity: val <= 0 ? 0.3 : 1,
                    }}>−1</button>
                    {[1, 2, 3].map(v => (
                      <button key={v} onClick={() => addDuelo(ti, v)} style={{
                        background: "transparent", color: t.pri, border: `1px solid ${t.pri}`,
                        borderRadius: 6, height: 40, flex: 1, fontSize: 16, fontFamily: F.serif, cursor: "pointer", touchAction: "manipulation",
                      }}>+{v}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next duelo button */}
          <button onClick={nextDuelo} style={{
            width: "100%", marginTop: 10, background: t.pri, color: "#fff", border: "none", borderRadius: 8,
            fontSize: 13, fontFamily: F.sans, fontWeight: 600, padding: "10px 0",
            cursor: "pointer", touchAction: "manipulation",
          }}>{L.sigDuelo}</button>
        </div>
      )}

      {/* Mano redonda indicator */}
      {picaPhase && !winner && isManoRedonda && (
        <div style={{ padding: "12px 16px", borderTop: `2px solid ${t.ok}`, background: `${t.ok}10`, textAlign: "center", flexShrink: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: t.ok, fontWeight: 700, fontFamily: F.sans, letterSpacing: 1 }}>MANO REDONDA</span>
          </div>
          <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginBottom: 10 }}>
            Usá los botones de arriba para anotar
          </div>
          <button onClick={advanceFromManoRedonda} style={{
            background: t.pri, color: "#fff", border: "none", borderRadius: 8,
            fontSize: 13, fontFamily: F.sans, fontWeight: 600, padding: "10px 24px",
            cursor: "pointer", touchAction: "manipulation",
          }}>Siguiente picapica →</button>
        </div>
      )}

      <UndoBar toast={toast} onUndo={handleUndo} onClose={() => { setToast(null); lastStateRef.current = null; }} />
    </div>

    {showH && hist.length > 0 && <Modal onClose={() => setShowH(false)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 16, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 340, width: "100%", maxHeight: "70vh", overflow: "auto" }}>
        <p style={{ fontSize: 16, color: t.pri, margin: "0 0 10px", fontFamily: F.serif }}>{L.hist}</p>
        {hist.map((h, i) => {
          if (!h || !Array.isArray(h.players)) return null;
          return <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", borderBottom: `1px solid ${t.brd}`, fontSize: 13, fontFamily: F.sans }}>
            <div style={{ flex: 1 }}>{h.players.map((s, j) => <span key={j} style={{ marginRight: 8 }}>{s.name}: <b>{s.t}</b></span>)}</div>
            <span style={{ fontSize: 10, color: t.txtF, whiteSpace: "nowrap" }}>{h.date || ""}</span>
            <button onClick={() => delH(i)} style={{ background: "none", border: "none", color: t.err, cursor: "pointer", fontSize: 20, padding: "4px 8px", touchAction: "manipulation" }}>×</button>
          </div>;
        })}
      </div>
    </Modal>}

    {modal === "menu" && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 8, padding: 4, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 240, width: "100%" }}>
        {[
          { label: L.share, action: () => { setModal(null); doShare(); } },
          ...(hist.length > 0 ? [{ label: L.hist, action: () => { setModal(null); setShowH(true); } }] : []),
          { label: L.nuevaPartida, action: () => setModal("new") },
          { label: L.reset, action: () => setModal("reset") },
        ].map((item, i) => (
          <button key={i} onClick={item.action} style={{
            display: "block", width: "100%", textAlign: "left", padding: "12px 14px",
            background: "none", border: "none", color: t.txt, fontSize: 14, fontWeight: 500,
            cursor: "pointer", borderRadius: 4, fontFamily: F.sans, touchAction: "manipulation",
          }}>{item.label}</button>
        ))}
      </div>
    </Modal>}

    {(modal === "new" || modal === "reset") && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
        <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>{modal === "new" ? `${L.nuevaPartida}?` : L.resetQ}</p>
        <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>{modal === "new" ? "Se reinician los puntos a cero." : L.losesAll}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
          {modal === "new" ? <B onClick={async () => { await saveToHistory(); const nextSc = sc.map(s => ({ ...s, p: 0 })); setSc(nextSc); setPicaPhase(false); setPicaDuels([]); setPicaCurrent({ t0: 0, t1: 0 }); setPicaRound(0); setCollapsed(false); prevBothBuenasRef.current = false; setModal(null); lastStateRef.current = null; setToast({ text: L.nuevaPartida }); persist({ sc: nextSc, picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0 }); }} s={{ flex: 1 }}>{L.nuevaPartida}</B>
            : <B v="err" onClick={resetAll} s={{ flex: 1 }}>{L.reset}</B>}
        </div>
      </div>
    </Modal>}
  </>);
}

export default Truco;
