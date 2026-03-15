import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, ST, clone, shareResult, vib, vibWin, vibFor, vibUndo, fmtDate, F, B, EN, Modal, HomeIcon } from '../lib.jsx';

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
  const prevScoreRef = useRef(player.p);
  const [popKey, setPopKey] = useState(0);
  const [floatDelta, setFloatDelta] = useState(null);

  useEffect(() => {
    if (player.p !== prevScoreRef.current) {
      const delta = player.p - prevScoreRef.current;
      prevScoreRef.current = player.p;
      setPopKey(k => k + 1);
      setFloatDelta(delta);
      const id = setTimeout(() => setFloatDelta(null), 600);
      return () => clearTimeout(id);
    }
  }, [player.p]);

  const handleTallyTap = () => {
    if (!winner && !picaPhase && !atTarget) {
      onAdd(idx, 1);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", opacity: dim ? 0.3 : 1, transition: "opacity .3s", paddingBottom: picaPhase ? 0 : 30 }}>
      {/* Name */}
      <div style={{ textAlign: "center", padding: "12px 10px 6px" }}>
        <EN name={player.name} onSave={n => onRen(idx, n)} sz={18} fw={700} />
      </div>

      {/* Tallies — fixed height for target, score stays in place */}
      {!picaPhase && (
        <div style={{
          height: (target === 30 && !collapsed) ? 500 : 280, flexShrink: 1, display: "flex", flexDirection: "column", alignItems: "center",
          padding: "6px 10px 4px", overflowY: "auto", WebkitOverflowScrolling: "touch",
          borderTop: `1px solid ${t.brd}`,
        }}>
          {hasBuenas && collapsed && (
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: t.ok, marginBottom: 4, fontFamily: F.sans }}>BUENAS</div>
          )}
          {hasBuenas && !collapsed && player.p > 0 && (
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: t.err, marginBottom: 4, fontFamily: F.sans }}>MALAS</div>
          )}
          <TrucoTally count={player.p} color={t.txt} divAt={hasBuenas ? 15 : null} buenasColor={t.ok} collapsed={collapsed} onClick={handleTallyTap} />
        </div>
      )}

      {/* Score number — right after tallies in normal, centered in picapica */}
      <div style={{ textAlign: "center", padding: picaPhase ? "12px 0" : "4px 0 2px", flex: picaPhase ? 1 : undefined, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${t.brd}`, position: "relative" }}>
        <div key={popKey} style={{ fontFamily: F.serif, fontSize: ph ? 40 : 52, color: t.pri, lineHeight: 1, letterSpacing: -1, animation: popKey ? "scorePop .3s ease-out" : undefined }}>
          {player.p}
        </div>
        {floatDelta !== null && (
          <div key={`f${popKey}`} style={{
            position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)",
            fontFamily: F.sans, fontSize: 18, fontWeight: 700, pointerEvents: "none",
            color: floatDelta > 0 ? t.ok : t.err,
            animation: "floatUp .6s ease-out forwards",
          }}>
            {floatDelta > 0 ? `+${floatDelta}` : floatDelta}
          </div>
        )}
      </div>

      {/* Buttons — pushed to bottom */}
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

      <div style={{ flex: "1 1 0", minHeight: 0 }} />
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
    if (!name) return teamIdx === 0 ? "Yo" : "Vos";
    return name;
  }

  const filled = members.map((n, i) => ({ name: n?.trim(), idx: start + i }))
    .filter(m => m.name && m.name.length > 0);

  if (filled.length === 0) return teamIdx === 0 ? "Nosotros" : "Ellos";
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
  const { t, dk, tog, sounds, L } = useApp();
  const [target, setTarget] = useState(15);
  const [step, setStep] = useState(0);
  const [teamSize, setTeamSize] = useState(1);
  const [started, setStarted] = useState(false);
  const [rawNames, setRawNames] = useState(defaultRawNames(1));
  const [sc, setSc] = useState([]);
  const [modal, setModal] = useState(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [picaRange, setPicaRange] = useState([5, 25]);
  const [picaMode, setPicaMode] = useState("suma");
  // Pica pica state
  const [picaPhase, setPicaPhase] = useState(false);
  const [picaDuels, setPicaDuels] = useState([]);
  const [picaCurrent, setPicaCurrent] = useState({ t0: 0, t1: 0 });
  const [picaRound, setPicaRound] = useState(0);
  const [picaEditIdx, setPicaEditIdx] = useState(null);
  const [picaEditVal, setPicaEditVal] = useState("");
  const [editingDuel, setEditingDuel] = useState(null);
  const [picaAllDuels, setPicaAllDuels] = useState([]);
  const [showDuels, setShowDuels] = useState(false);
  const [picaStartPlayer, setPicaStartPlayer] = useState(0);
  const [showMatchupPicker, setShowMatchupPicker] = useState(false);
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
        if (Array.isArray(d.picaAllDuels)) setPicaAllDuels(d.picaAllDuels);
        if (typeof d.picaStartPlayer === "number") setPicaStartPlayer(d.picaStartPlayer);
        setStarted(true);
        onContinueChange?.("truco");
      }
      setLoading(false);
    });
    ST.load("truco-hist").then(d => { if (Array.isArray(d)) setHist(d) });
  }, []);

  useEffect(() => {
    if (!started) return;
    ST.save("truco-game", { started: true, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound, picaAllDuels, picaStartPlayer });
    onContinueChange?.("truco");
  }, [started, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound, picaAllDuels, picaStartPlayer]);

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
      started: true, target, teamSize, rawNames, sc, picaRange, picaMode, picaPhase, picaDuels, picaCurrent, picaRound, picaAllDuels, picaStartPlayer,
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
    setPicaAllDuels([]);
    setStarted(true);
    await ST.save("truco-game", { started: true, target, teamSize, rawNames: safeRawNames, sc: fresh, picaRange, picaMode, picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0, picaAllDuels: [], picaStartPlayer: 0 });
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
    undoStackRef.current = [...undoStackRef.current, { sc: clone(sc), picaPhase, picaDuels: clone(picaDuels), picaCurrent: clone(picaCurrent), picaRound, picaAllDuels: clone(picaAllDuels) }];
    redoStackRef.current = [];
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
        const hasNames = rawNames.some(n => n?.trim());
        if (teamSize === 3 && hasNames) setShowMatchupPicker(true);
      }
    }

    setSc(nextSc);
    persist({ sc: nextSc });
    if (sounds) vibFor(v);
    if (sounds && newP >= target) vibWin();
  };

  // Pica pica duelo scoring
  const addDuelo = (teamIdx, v) => {
    const key = teamIdx === 0 ? "t0" : "t1";
    const next = { ...picaCurrent, [key]: Math.max(0, picaCurrent[key] + v) };
    setPicaCurrent(next);
    persist({ picaCurrent: next });
    if (sounds) vibFor(v);
  };

  const setDueloScore = (teamIdx, val) => {
    const key = teamIdx === 0 ? "t0" : "t1";
    const next = { ...picaCurrent, [key]: Math.max(0, val) };
    setPicaCurrent(next);
    persist({ picaCurrent: next });
  };

  const savePastDuel = (duelIdx, newT0, newT1) => {
    const old = picaDuels[duelIdx];
    if (!old) return;
    const updated = [...picaDuels];
    updated[duelIdx] = { t0: Math.max(0, newT0), t1: Math.max(0, newT1) };
    setPicaDuels(updated);

    // Also update the allDuels history
    const allOffset = picaAllDuels.length - picaDuels.length;
    const nextAllDuels = [...picaAllDuels];
    if (allOffset + duelIdx >= 0 && allOffset + duelIdx < nextAllDuels.length) {
      nextAllDuels[allOffset + duelIdx] = { t0: Math.max(0, newT0), t1: Math.max(0, newT1) };
    }
    setPicaAllDuels(nextAllDuels);

    // In suma mode, past duels already affected main scores — adjust the diff
    if (picaMode === "suma") {
      const diffT0 = newT0 - old.t0;
      const diffT1 = newT1 - old.t1;
      if (diffT0 !== 0 || diffT1 !== 0) {
        const nextSc = sc.map((row, idx) => ({
          ...row, p: Math.max(0, Math.min(target, row.p + (idx === 0 ? diffT0 : diffT1)))
        }));
        setSc(nextSc);
        persist({ sc: nextSc, picaDuels: updated, picaAllDuels: nextAllDuels });
      } else {
        persist({ picaDuels: updated, picaAllDuels: nextAllDuels });
      }
    } else {
      persist({ picaDuels: updated, picaAllDuels: nextAllDuels });
    }
    setEditingDuel(null);
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

    // Append completed duel to full history
    const nextAllDuels = [...picaAllDuels, picaCurrent];
    setPicaAllDuels(nextAllDuels);

    // Single persist call with all updates
    persist({
      sc: nextSc,
      picaDuels: completed,
      picaCurrent: { t0: 0, t1: 0 },
      picaRound: nextRound,
      picaAllDuels: nextAllDuels,
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
    setPicaAllDuels([]);
    setCollapsed(false);
    prevBothBuenasRef.current = false;
    setModal(null);
    undoStackRef.current = [];
    redoStackRef.current = [];
    persist({ sc: nextSc, picaPhase: false, picaDuels: [], picaCurrent: { t0: 0, t1: 0 }, picaRound: 0, picaAllDuels: [] });
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

  const doShare = async () => {
    const pri = "#1A5C52", priL = "#3D8B7A", priD = "#0E3A33";
    const brd = "#E8E8E6", bgS = "#F6F6F4";
    const txtC = "#1A1A1A", txtF = "#B5B5B2";
    const okC = "#2D7A50", errC = "#C23B22";
    const W = 1080, colW = W / 2;
    const hasBuenas = target === 30;

    // Tally square params
    const SZ = 80, PD = 6, GAP = 12, perRow = 3;

    // Exact height of a tally block for N points
    const tallyBlockH = (count) => {
      if (count === 0) return 0;
      const groups = Math.ceil(count / 5);
      const rows = Math.ceil(groups / perRow);
      return rows * (SZ + GAP) - GAP;
    };

    // Exact tally section height per team (content only)
    const tallyContentH = (score) => {
      if (score === 0) return 0;
      if (hasBuenas) {
        let h = 24 + tallyBlockH(Math.min(score, 15)) + 36;
        if (score > 15) h += tallyBlockH(score - 15);
        return h;
      }
      return tallyBlockH(score);
    };

    const maxContentH = Math.max(tallyContentH(sc[0]?.p || 0), tallyContentH(sc[1]?.p || 0));
    const tallyAreaH = Math.max(maxContentH + 40, 140);

    // Layout
    const bannerH = winner ? 180 : 0;
    const topH = winner ? bannerH + 6 : 80;
    const nameRowH = 56;
    const scoreRowH = 100;
    const footerH = 80;
    const H = topH + nameRowH + tallyAreaH + scoreRowH + footerH;

    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    // Draw tally square segments
    const drawSquare = (ox, oy, n) => {
      ctx.strokeStyle = txtC; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.globalAlpha = 0.7;
      if (n >= 1) { ctx.beginPath(); ctx.moveTo(ox + PD, oy + PD); ctx.lineTo(ox + PD, oy + SZ - PD); ctx.stroke(); }
      if (n >= 2) { ctx.beginPath(); ctx.moveTo(ox + PD, oy + SZ - PD); ctx.lineTo(ox + SZ - PD, oy + SZ - PD); ctx.stroke(); }
      if (n >= 3) { ctx.beginPath(); ctx.moveTo(ox + SZ - PD, oy + SZ - PD); ctx.lineTo(ox + SZ - PD, oy + PD); ctx.stroke(); }
      if (n >= 4) { ctx.beginPath(); ctx.moveTo(ox + SZ - PD, oy + PD); ctx.lineTo(ox + PD, oy + PD); ctx.stroke(); }
      if (n >= 5) { ctx.beginPath(); ctx.moveTo(ox + PD + 2, oy + SZ - PD - 2); ctx.lineTo(ox + SZ - PD - 2, oy + PD + 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    };

    // Draw tally groups, returns Y of bottom edge
    const drawTallies = (cx, startY, count) => {
      if (count === 0) return startY;
      const groups = Math.ceil(count / 5);
      const totalRows = Math.ceil(groups / perRow);
      for (let g = 0; g < groups; g++) {
        const row = Math.floor(g / perRow);
        const col = g % perRow;
        const inRow = Math.min(perRow, groups - row * perRow);
        const rowW = inRow * SZ + (inRow - 1) * GAP;
        const ox = cx - rowW / 2 + col * (SZ + GAP);
        const oy = startY + row * (SZ + GAP);
        const isLast = g === groups - 1;
        const segs = isLast && count % 5 !== 0 ? count % 5 : 5;
        drawSquare(ox, oy, segs);
      }
      return startY + totalRows * (SZ + GAP) - GAP;
    };

    // White bg + accent bar
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pri; ctx.fillRect(0, 0, W, 6);
    let y = 6;

    if (winner) {
      const g = ctx.createLinearGradient(0, 6, W, bannerH);
      g.addColorStop(0, priD); g.addColorStop(0.5, pri); g.addColorStop(1, priL);
      ctx.fillStyle = g; ctx.fillRect(0, 6, W, bannerH);
      ctx.textAlign = "center"; ctx.fillStyle = "#fff";
      ctx.font = "44px serif"; ctx.fillText("\u{1F3C6}", W / 2, 56);
      ctx.font = "600 14px system-ui, sans-serif"; ctx.globalAlpha = 0.6;
      ctx.fillText("V I C T O R I A", W / 2, 90); ctx.globalAlpha = 1;
      ctx.font = "700 38px Georgia, serif";
      ctx.fillText(`¡${winner.name}!`, W / 2, 132);
      ctx.font = "500 18px system-ui, sans-serif"; ctx.globalAlpha = 0.75;
      ctx.fillText(`${sc[0]?.p} — ${sc[1]?.p}`, W / 2, 160); ctx.globalAlpha = 1;
      y = 6 + bannerH;
    } else {
      ctx.fillStyle = bgS; ctx.fillRect(W - 140, 16, 110, 40);
      ctx.strokeStyle = brd; ctx.lineWidth = 1; ctx.strokeRect(W - 140, 16, 110, 40);
      ctx.fillStyle = txtF; ctx.font = "600 20px system-ui, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`A ${target}`, W - 85, 43);
      y = topH;
    }

    // Team names — full names, auto-shrink font to fit
    const nameY = y + 34;
    sc.forEach((s, i) => {
      ctx.textAlign = "center"; ctx.fillStyle = txtC;
      let fs = 28;
      ctx.font = `700 ${fs}px Georgia, serif`;
      while (ctx.measureText(s.name).width > colW - 40 && fs > 14) {
        fs -= 2;
        ctx.font = `700 ${fs}px Georgia, serif`;
      }
      ctx.fillText(s.name, i * colW + colW / 2, nameY);
    });
    y += nameRowH;

    // Separator below names
    ctx.strokeStyle = brd; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();

    // Tally area
    const tallyTop = y;
    const tallyBot = y + tallyAreaH;
    // Vertical divider
    ctx.beginPath(); ctx.moveTo(W / 2, tallyTop); ctx.lineTo(W / 2, tallyBot); ctx.stroke();

    // Draw tallies per team
    sc.forEach((s, i) => {
      const cx = i * colW + colW / 2;
      let ty = tallyTop + 20;
      if (hasBuenas && s.p > 0) {
        ctx.fillStyle = errC; ctx.font = "700 13px system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("MALAS", cx, ty + 10);
        ty += 24;
        const afterMalas = drawTallies(cx, ty, Math.min(s.p, 15));
        const divY = afterMalas + 18;
        ctx.globalAlpha = 0.5; ctx.strokeStyle = okC; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 110, divY); ctx.lineTo(cx + 110, divY); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = okC; ctx.font = "700 13px system-ui, sans-serif";
        ctx.fillText("BUENAS", cx, divY - 4);
        if (s.p > 15) drawTallies(cx, divY + 18, s.p - 15);
      } else if (s.p > 0) {
        drawTallies(cx, ty, s.p);
      } else {
        ctx.fillStyle = txtF; ctx.globalAlpha = 0.15; ctx.font = "400 40px Georgia, serif";
        ctx.textAlign = "center"; ctx.fillText("—", cx, tallyTop + tallyAreaH / 2 + 14);
        ctx.globalAlpha = 1;
      }
    });

    // Separator below tallies
    ctx.strokeStyle = brd; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, tallyBot); ctx.lineTo(W, tallyBot); ctx.stroke();

    // Big score numbers
    sc.forEach((s, i) => {
      ctx.textAlign = "center"; ctx.fillStyle = pri;
      ctx.font = "400 72px Georgia, serif";
      ctx.fillText(String(s.p), i * colW + colW / 2, tallyBot + 70);
    });

    // Date + watermark
    const now = new Date();
    const ds = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const ts = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = txtF; ctx.font = "500 22px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${ds}  ·  ${ts}`, W / 2, H - 40);
    ctx.fillStyle = pri; ctx.globalAlpha = 0.2; ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText("PUNTOS APP", W / 2, H - 14); ctx.globalAlpha = 1;

    try {
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      const file = new File([blob], "truco.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ title: "Truco", files: [file] }); return; }
    } catch (e) { if (e?.name === "AbortError") return; }
    const text = `Truco · A ${target}\n` + sc.map(s => `${s.name}: ${s.p}`).join("\n");
    try { if (navigator.share) { await navigator.share({ title: "Truco", text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); alert("Copiado"); } catch (e) { prompt("Copiá:", text); }
  };

  const picaPlayerName = (teamIdx, globalDuelIdx) => {
    if (teamSize !== 3) return null;
    const cycle = Math.floor(globalDuelIdx / 3);
    const duelInCycle = globalDuelIdx % 3;
    const playerOffset = (picaStartPlayer + cycle + duelInCycle) % teamSize;
    const rawIdx = teamIdx * teamSize + playerOffset;
    return rawNames[rawIdx]?.trim() || `J${rawIdx + 1}`;
  };

  const groupedDuels = () => {
    const groups = [[], [], []];
    picaAllDuels.forEach((d, i) => groups[i % 3].push(d));
    return groups;
  };

  const shareDuels = async () => {
    const pri = "#1A5C52", priL = "#3D8B7A", priD = "#0E3A33";
    const brd = "#E8E8E6", bgS = "#F6F6F4";
    const txtC = "#1A1A1A", txtF = "#B5B5B2", txtM = "#7A7A78";
    const okC = "#2D7A50", errC = "#C23B22";
    const W = 1080, pad = 60;
    const n0 = sc[0]?.name || "Eq 1";
    const n1 = sc[1]?.name || "Eq 2";
    const hasNames = teamSize === 3 && rawNames.some(n => n?.trim());
    const groups = groupedDuels();

    // Exact height computation
    const titleH = 60, headerH = 50, rowH = 44, groupHeaderH = 40, subtotalH = 44, totalRowH = 56, footerH = 80;
    let contentH = titleH + headerH;
    groups.forEach(duels => {
      if (!duels.length) return;
      contentH += groupHeaderH + duels.length * rowH;
      if (duels.length > 1) contentH += subtotalH;
      contentH += 10;
    });
    contentH += totalRowH + footerH;
    const H = contentH + pad * 2;

    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = pri; ctx.fillRect(0, 0, W, 6);
    let y = pad;

    // Title
    ctx.textAlign = "center"; ctx.fillStyle = pri;
    ctx.font = "700 32px Georgia, serif";
    ctx.fillText("Pica Pica \u00B7 Duelos", W / 2, y + 36);
    y += titleH;

    // Column layout
    const labelW = 80, diffW = 80;
    const innerW = W - pad * 2 - labelW - diffW;
    const leftX = pad + labelW;
    const t0X = leftX + innerW / 4;
    const t1X = leftX + innerW * 3 / 4;
    const dX = W - pad - diffW / 2;

    // Header — auto-shrink names to fit
    ctx.textAlign = "center";
    let fs0 = 20;
    ctx.font = `700 ${fs0}px system-ui, sans-serif`; ctx.fillStyle = pri;
    while (ctx.measureText(n0).width > innerW / 2 - 20 && fs0 > 13) { fs0--; ctx.font = `700 ${fs0}px system-ui, sans-serif`; }
    ctx.fillText(n0, t0X, y + 32);
    let fs1 = 20;
    ctx.font = `700 ${fs1}px system-ui, sans-serif`;
    while (ctx.measureText(n1).width > innerW / 2 - 20 && fs1 > 13) { fs1--; ctx.font = `700 ${fs1}px system-ui, sans-serif`; }
    ctx.fillText(n1, t1X, y + 32);
    ctx.font = "600 14px system-ui, sans-serif"; ctx.fillStyle = txtF;
    ctx.fillText("Dif", dX, y + 32);
    y += headerH;

    // Thick separator
    ctx.strokeStyle = pri; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();

    // Duel groups
    groups.forEach((duels, dIdx) => {
      if (!duels.length) return;
      ctx.textAlign = "left"; ctx.fillStyle = pri;
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.fillText(`D${dIdx + 1}`, pad + 8, y + 28);
      if (hasNames) {
        ctx.font = "400 14px system-ui, sans-serif"; ctx.fillStyle = txtM;
        ctx.fillText(`${picaPlayerName(0, dIdx)} vs ${picaPlayerName(1, dIdx)}`, pad + 48, y + 28);
      }
      y += groupHeaderH;

      duels.forEach((d, ci) => {
        const diff = d.t0 - d.t1;
        const w0 = d.t0 > d.t1, w1 = d.t1 > d.t0;
        if (ci % 2 === 0) { ctx.fillStyle = bgS; ctx.fillRect(pad, y, W - pad * 2, rowH); }
        ctx.textAlign = "left"; ctx.fillStyle = txtF;
        ctx.font = "500 14px system-ui, sans-serif";
        ctx.fillText(`PP${ci + 1}`, pad + 12, y + rowH / 2 + 5);
        ctx.textAlign = "center";
        ctx.font = `${w0 ? 700 : 400} 22px Georgia, serif`; ctx.fillStyle = w0 ? pri : txtC;
        ctx.fillText(String(d.t0), t0X, y + rowH / 2 + 7);
        ctx.fillStyle = txtF; ctx.font = "400 16px system-ui, sans-serif";
        ctx.fillText("-", leftX + innerW / 2, y + rowH / 2 + 5);
        ctx.font = `${w1 ? 700 : 400} 22px Georgia, serif`; ctx.fillStyle = w1 ? pri : txtC;
        ctx.fillText(String(d.t1), t1X, y + rowH / 2 + 7);
        ctx.font = "600 16px system-ui, sans-serif";
        ctx.fillStyle = diff > 0 ? okC : diff < 0 ? errC : txtF;
        ctx.fillText(diff > 0 ? `+${diff}` : diff === 0 ? "=" : String(diff), dX, y + rowH / 2 + 5);
        ctx.strokeStyle = brd; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, y + rowH); ctx.lineTo(W - pad, y + rowH); ctx.stroke();
        y += rowH;
      });

      if (duels.length > 1) {
        const sub0 = duels.reduce((s, d) => s + d.t0, 0);
        const sub1 = duels.reduce((s, d) => s + d.t1, 0);
        const subDiff = sub0 - sub1;
        ctx.textAlign = "center";
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.fillStyle = sub0 > sub1 ? pri : txtC;
        ctx.fillText(String(sub0), t0X, y + subtotalH / 2 + 6);
        ctx.fillStyle = txtF; ctx.font = "400 14px system-ui, sans-serif";
        ctx.fillText("-", leftX + innerW / 2, y + subtotalH / 2 + 4);
        ctx.font = "600 18px system-ui, sans-serif";
        ctx.fillStyle = sub1 > sub0 ? pri : txtC;
        ctx.fillText(String(sub1), t1X, y + subtotalH / 2 + 6);
        ctx.font = "700 14px system-ui, sans-serif";
        ctx.fillStyle = subDiff > 0 ? okC : subDiff < 0 ? errC : txtF;
        ctx.fillText(subDiff > 0 ? `+${subDiff}` : subDiff === 0 ? "=" : String(subDiff), dX, y + subtotalH / 2 + 4);
        y += subtotalH;
      }
      y += 10;
    });

    // Grand total
    ctx.strokeStyle = pri; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    const tot0 = picaAllDuels.reduce((s, d) => s + d.t0, 0);
    const tot1 = picaAllDuels.reduce((s, d) => s + d.t1, 0);
    const totDiff = tot0 - tot1;
    ctx.textAlign = "left"; ctx.fillStyle = txtM;
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillText("Total", pad + 8, y + totalRowH / 2 + 5);
    ctx.textAlign = "center";
    ctx.font = "700 28px Georgia, serif";
    ctx.fillStyle = tot0 > tot1 ? pri : txtC;
    ctx.fillText(String(tot0), t0X, y + totalRowH / 2 + 10);
    ctx.fillStyle = txtF; ctx.font = "400 16px system-ui, sans-serif";
    ctx.fillText("-", leftX + innerW / 2, y + totalRowH / 2 + 5);
    ctx.font = "700 28px Georgia, serif";
    ctx.fillStyle = tot1 > tot0 ? pri : txtC;
    ctx.fillText(String(tot1), t1X, y + totalRowH / 2 + 10);
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillStyle = totDiff > 0 ? okC : totDiff < 0 ? errC : txtF;
    ctx.fillText(totDiff > 0 ? `+${totDiff}` : totDiff === 0 ? "=" : String(totDiff), dX, y + totalRowH / 2 + 5);

    // Date + watermark
    const now = new Date();
    const ds = now.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const ts = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = txtF; ctx.font = "500 22px system-ui, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${ds}  \u00B7  ${ts}`, W / 2, H - 40);
    ctx.fillStyle = pri; ctx.globalAlpha = 0.2; ctx.font = "600 16px system-ui, sans-serif";
    ctx.fillText("PUNTOS APP", W / 2, H - 14); ctx.globalAlpha = 1;

    try {
      const blob = await new Promise(r => c.toBlob(r, "image/png"));
      const file = new File([blob], "picapica.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ title: "Pica Pica", files: [file] }); return; }
    } catch (e) { if (e?.name === "AbortError") return; }
    const text = `Pica Pica \u00B7 Duelos\n${n0} vs ${n1}\nTotal: ${tot0} - ${tot1}`;
    try { if (navigator.share) { await navigator.share({ title: "Pica Pica", text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); alert("Copiado"); } catch (e) { prompt("Copiá:", text); }
  };

  const restoreState = (s) => {
    setSc(s.sc);
    if (s.picaPhase !== undefined) setPicaPhase(s.picaPhase);
    if (s.picaDuels) setPicaDuels(s.picaDuels);
    if (s.picaCurrent) setPicaCurrent(s.picaCurrent);
    if (s.picaRound !== undefined) setPicaRound(s.picaRound);
    if (s.picaAllDuels) setPicaAllDuels(s.picaAllDuels);
    persist({ sc: s.sc, picaPhase: s.picaPhase, picaDuels: s.picaDuels, picaCurrent: s.picaCurrent, picaRound: s.picaRound, picaAllDuels: s.picaAllDuels });
  };

  const currentSnapshot = () => ({ sc: clone(sc), picaPhase, picaDuels: clone(picaDuels), picaCurrent: clone(picaCurrent), picaRound, picaAllDuels: clone(picaAllDuels) });

  const handleUndo = () => {
    if (!undoStackRef.current.length) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, currentSnapshot()];
    restoreState(prev);
    if (sounds) vibUndo();
  };

  const handleRedo = () => {
    if (!redoStackRef.current.length) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    undoStackRef.current = [...undoStackRef.current, currentSnapshot()];
    restoreState(next);
    if (sounds) vibUndo();
  };

  // Swipe gesture for undo/redo
  const touchRef = useRef(null);
  const onTouchStart = (e) => { touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; };
  const onTouchEnd = (e) => {
    if (!touchRef.current || winner) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.t;
    touchRef.current = null;
    if (dt > 400 || Math.abs(dy) > 40 || Math.abs(dx) < 60) return;
    if (dx < 0) handleUndo();
    else handleRedo();
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
                placeholder={i === 0 ? "Yo" : "Vos"}
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
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ display: "flex", flexDirection: "column", height: "100dvh", background: t.bg, overflow: "hidden" }}>
      {/* Header */}
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
        {!winner && (
          <div style={{ display: "inline-flex", borderRadius: 10, border: `1px solid ${t.brd}`, background: t.bgS, overflow: "hidden", flexShrink: 0 }}>
            <button onClick={handleUndo} disabled={!undoStackRef.current.length} style={{
              background: "none", border: "none", borderRight: `1px solid ${t.brd}`,
              padding: "6px 8px", cursor: undoStackRef.current.length ? "pointer" : "default",
              touchAction: "manipulation", display: "flex", alignItems: "center",
              opacity: undoStackRef.current.length ? 1 : 0.25, transition: "opacity .2s",
            }}><svg width="16" height="16" viewBox="0 0 24 24" fill={t.txtM} stroke="none"><path d="M12.5 8C9.85 8 7.45 9 5.6 10.6L2 7v10h10l-3.62-3.62C9.88 12 11.15 11.5 12.5 11.5c3.25 0 6.02 2.1 6.97 5L22.3 15.6C20.97 11.46 17.09 8 12.5 8z" /></svg></button>
            <button onClick={handleRedo} disabled={!redoStackRef.current.length} style={{
              background: "none", border: "none",
              padding: "6px 8px", cursor: redoStackRef.current.length ? "pointer" : "default",
              touchAction: "manipulation", display: "flex", alignItems: "center",
              opacity: redoStackRef.current.length ? 1 : 0.25, transition: "opacity .2s",
            }}><svg width="16" height="16" viewBox="0 0 24 24" fill={t.txtM} stroke="none"><path d="M11.5 8c2.65 0 5.05 1 6.9 2.6L22 7v10H12l3.62-3.62C14.12 12 12.85 11.5 11.5 11.5c-3.25 0-6.02 2.1-6.97 5L1.7 15.6C3.03 11.46 6.91 8 11.5 8z" /></svg></button>
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => {
          const canGoTo15 = !sc.some(s => s.p > 15);
          if (target === 30 && !canGoTo15) return;
          setTarget(target === 15 ? 30 : 15);
        }} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "6px 12px", fontSize: 13, color: (target === 30 && sc.some(s => s.p > 15)) ? t.txtF : t.txtM, fontFamily: F.sans, fontWeight: 600, cursor: (target === 30 && sc.some(s => s.p > 15)) ? "default" : "pointer", touchAction: "manipulation", opacity: (target === 30 && sc.some(s => s.p > 15)) ? 0.4 : 1, transition: "opacity .2s", flexShrink: 0 }}>
          A {target}
        </button>
        {showCollapseToggle && (
          <button onClick={() => setCollapsed(c => !c)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, padding: "6px 12px", fontSize: 13, color: t.txtM, fontFamily: F.sans, fontWeight: 600, cursor: "pointer", touchAction: "manipulation", flexShrink: 0 }}>
            {collapsed ? "Ver todo" : "Buenas"}
          </button>
        )}
        {!winner && <button onClick={() => setModal("menu")} style={{ background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 10, color: t.txt, fontSize: 14, fontFamily: F.sans, fontWeight: 600, cursor: "pointer", padding: "8px 14px", touchAction: "manipulation", flexShrink: 0 }}>Menu</button>}
      </div>

      {/* Winner banner */}
      {winner && (
        <div style={{ textAlign: "center", padding: "24px 16px 20px", background: `linear-gradient(135deg, ${t.priD}, ${t.pri}, ${t.priL})`, color: "#fff", flexShrink: 0, animation: "winnerSlideIn .5s ease-out", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent)", backgroundSize: "200% 100%", animation: "shimmer 3s ease-in-out infinite" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 40, animation: "trophyBounce .6s ease-out", marginBottom: 4 }}>🏆</div>
            <div style={{ fontSize: 11, fontFamily: F.sans, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", opacity: 0.6, marginBottom: 4, animation: "fadeInUp .4s ease-out .2s both" }}>Victoria</div>
            <div style={{ fontSize: 26, fontFamily: F.serif, fontWeight: 700, animation: "fadeInUp .4s ease-out .3s both" }}>¡{winner.name}!</div>
            <div style={{ fontSize: 15, fontFamily: F.sans, opacity: 0.75, marginTop: 2, animation: "fadeInUp .4s ease-out .35s both" }}>{sc[0]?.p} — {sc[1]?.p}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, animation: "fadeInUp .4s ease-out .45s both" }}>
              <button onClick={revancha} style={{
                background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 10, color: "#fff", fontSize: 14, fontFamily: F.sans, fontWeight: 600,
                padding: "11px 22px", cursor: "pointer", flex: 1, touchAction: "manipulation",
              }}>{L.revancha}</button>
              <button onClick={nuevaPartida} style={{
                background: "transparent", border: "1px solid rgba(255,255,255,.2)",
                borderRadius: 10, color: "rgba(255,255,255,.8)", fontSize: 14, fontFamily: F.sans, fontWeight: 500,
                padding: "11px 22px", cursor: "pointer", flex: 1, touchAction: "manipulation",
              }}>{L.nuevaPartidaSetup}</button>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10, animation: "fadeInUp .4s ease-out .55s both" }}>
              <button onClick={doShare} style={{
                background: "none", border: "none", color: "rgba(255,255,255,.5)",
                fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation",
              }}>{L.share}</button>
              {picaAllDuels.length > 0 && (
                <button onClick={() => setShowDuels(true)} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,.5)",
                  fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation",
                }}>Ver Duelos</button>
              )}
              {undoStackRef.current.length > 0 && (
                <button onClick={handleUndo} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,.5)",
                  fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation",
                }}>{L.undo}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main columns */}
      <div style={{ flex: picaPhase ? undefined : 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
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
            {teamSize === 3 && rawNames.some(n => n?.trim()) && (
              <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginTop: 2 }}>
                {picaPlayerName(0, picaAllDuels.length)} vs {picaPlayerName(1, picaAllDuels.length)}
              </div>
            )}
          </div>

          {/* Completed duelos summary — tappable to edit */}
          {picaDuels.length > 0 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
              {picaDuels.map((d, i) => (
                <span key={i} onClick={() => setEditingDuel({ idx: i, t0: String(d.t0), t1: String(d.t1) })}
                  style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, background: t.card, border: `1px solid ${t.brd}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}>
                  D{i + 1}: {d.t0}-{d.t1}
                </span>
              ))}
            </div>
          )}

          {/* Edit past duel modal */}
          {editingDuel && (
            <div style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.pri, fontFamily: F.sans, marginBottom: 6, textAlign: "center" }}>
                Editar Duelo {editingDuel.idx + 1}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: t.txtM, fontFamily: F.sans, marginBottom: 2 }}>{sc[0]?.name}</div>
                  <input type="number" inputMode="numeric" autoFocus
                    value={editingDuel.t0}
                    onChange={e => setEditingDuel({ ...editingDuel, t0: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") savePastDuel(editingDuel.idx, parseInt(editingDuel.t0) || 0, parseInt(editingDuel.t1) || 0); }}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `2px solid ${t.pri}`, fontSize: 22, fontFamily: F.serif, color: t.pri, textAlign: "center", outline: "none", borderRadius: 0, padding: 0 }}
                  />
                </div>
                <span style={{ fontSize: 16, color: t.txtM }}>vs</span>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: t.txtM, fontFamily: F.sans, marginBottom: 2 }}>{sc[1]?.name}</div>
                  <input type="number" inputMode="numeric"
                    value={editingDuel.t1}
                    onChange={e => setEditingDuel({ ...editingDuel, t1: e.target.value })}
                    onKeyDown={e => { if (e.key === "Enter") savePastDuel(editingDuel.idx, parseInt(editingDuel.t0) || 0, parseInt(editingDuel.t1) || 0); }}
                    style={{ width: "100%", background: "transparent", border: "none", borderBottom: `2px solid ${t.pri}`, fontSize: 22, fontFamily: F.serif, color: t.pri, textAlign: "center", outline: "none", borderRadius: 0, padding: 0 }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button onClick={() => setEditingDuel(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${t.brd}`, borderRadius: 6, padding: "6px 0", fontSize: 12, fontFamily: F.sans, color: t.txtM, cursor: "pointer", touchAction: "manipulation" }}>Cancelar</button>
                <button onClick={() => savePastDuel(editingDuel.idx, parseInt(editingDuel.t0) || 0, parseInt(editingDuel.t1) || 0)} style={{ flex: 1, background: t.pri, border: "none", borderRadius: 6, padding: "6px 0", fontSize: 12, fontFamily: F.sans, fontWeight: 600, color: "#fff", cursor: "pointer", touchAction: "manipulation" }}>Guardar</button>
              </div>
            </div>
          )}

          {/* Current duelo: two teams side by side */}
          <div style={{ display: "flex", gap: 8 }}>
            {[0, 1].map(ti => {
              const val = ti === 0 ? picaCurrent.t0 : picaCurrent.t1;
              return (
                <div key={ti} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: t.txtM, fontFamily: F.sans, marginBottom: 4 }}>{sc[ti]?.name}</div>
                  {picaEditIdx === ti ? (
                    <input
                      type="number" inputMode="numeric" autoFocus
                      value={picaEditVal}
                      onChange={e => setPicaEditVal(e.target.value)}
                      onBlur={() => {
                        const n = parseInt(picaEditVal);
                        if (!isNaN(n)) setDueloScore(ti, n);
                        setPicaEditIdx(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const n = parseInt(picaEditVal);
                          if (!isNaN(n)) setDueloScore(ti, n);
                          setPicaEditIdx(null);
                        }
                      }}
                      style={{
                        width: "100%", background: "transparent", border: "none", borderBottom: `2px solid ${t.pri}`,
                        fontSize: 28, fontFamily: F.serif, color: t.pri, textAlign: "center",
                        outline: "none", borderRadius: 0, marginBottom: 6, padding: 0,
                      }}
                    />
                  ) : (
                    <div onClick={() => { setPicaEditIdx(ti); setPicaEditVal(String(val)); }}
                      style={{ fontSize: 28, fontFamily: F.serif, color: t.pri, marginBottom: 6, cursor: "pointer" }}>{val}</div>
                  )}
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
        <div style={{ padding: "10px 16px", borderTop: `2px solid ${t.ok}`, background: `${t.ok}10`, textAlign: "center", flexShrink: 0, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: t.ok, fontWeight: 700, fontFamily: F.sans, letterSpacing: 1 }}>MANO REDONDA</span>
          <button onClick={advanceFromManoRedonda} style={{
            background: t.pri, color: "#fff", border: "none", borderRadius: 8,
            fontSize: 12, fontFamily: F.sans, fontWeight: 600, padding: "8px 16px",
            cursor: "pointer", touchAction: "manipulation",
          }}>Siguiente →</button>
        </div>
      )}

    </div>

    {/* Matchup picker modal */}
    {showMatchupPicker && (
      <Modal onClose={() => setShowMatchupPicker(false)}>
        <div style={{ background: t.card, borderRadius: 12, padding: 20, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 320, width: "100%" }}>
          <p style={{ fontSize: 16, color: t.pri, margin: "0 0 12px", fontFamily: F.serif, textAlign: "center" }}>¿Quién empieza?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[0, 1, 2].map(offset => {
              const p0 = rawNames[offset]?.trim() || `J${offset + 1}`;
              const p1 = rawNames[teamSize + offset]?.trim() || `J${teamSize + offset + 1}`;
              const sel = picaStartPlayer === offset;
              return (
                <button key={offset} onClick={() => { setPicaStartPlayer(offset); persist({ picaStartPlayer: offset }); }} style={{
                  background: sel ? `${t.pri}15` : "transparent",
                  border: `1.5px solid ${sel ? t.pri : t.brd}`, borderRadius: 8,
                  padding: "12px 16px", cursor: "pointer", touchAction: "manipulation",
                  fontFamily: F.sans, fontSize: 14, color: sel ? t.pri : t.txt, fontWeight: sel ? 600 : 400,
                  textAlign: "center", transition: "all .15s",
                }}>
                  {p0} <span style={{ color: t.txtF, fontSize: 12 }}>vs</span> {p1}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowMatchupPicker(false)} style={{
            width: "100%", marginTop: 14, background: t.pri, color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontFamily: F.sans, fontWeight: 600, padding: "12px 0",
            cursor: "pointer", touchAction: "manipulation",
          }}>Empezar</button>
        </div>
      </Modal>
    )}

    {/* Pica pica duel history modal */}
    {showDuels && picaAllDuels.length > 0 && <Modal onClose={() => setShowDuels(false)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 20, border: `1px solid ${t.brd}`, boxShadow: t.shH, maxWidth: 340, width: "100%", maxHeight: "70vh", overflow: "auto" }}>
        <p style={{ fontSize: 16, color: t.pri, margin: "0 0 4px", fontFamily: F.serif, textAlign: "center" }}>Pica Pica · Duelos</p>
        {/* Team header */}
        <div style={{ display: "flex", padding: "10px 0 8px", borderBottom: `2px solid ${t.pri}`, alignItems: "center" }}>
          <span style={{ width: 40 }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, fontFamily: F.sans, color: t.pri, textAlign: "center" }}>{sc[0]?.name}</span>
          <span style={{ width: 20, textAlign: "center", fontSize: 11, color: t.txtF }}>-</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, fontFamily: F.sans, color: t.pri, textAlign: "center" }}>{sc[1]?.name}</span>
          <span style={{ width: 40, textAlign: "center", fontSize: 10, color: t.txtF, fontFamily: F.sans }}>Dif</span>
        </div>
        {/* Grouped by duel position: D1, D2, D3 */}
        {(() => {
          const groups = groupedDuels();
          const hasNames = teamSize === 3 && rawNames.some(n => n?.trim());
          return groups.map((duels, dIdx) => {
            if (!duels.length) return null;
            const sub0 = duels.reduce((s, d) => s + d.t0, 0);
            const sub1 = duels.reduce((s, d) => s + d.t1, 0);
            const subDiff = sub0 - sub1;
            const sm0 = sub0 > sub1; const sm1 = sub1 > sub0;
            return <div key={dIdx} style={{ marginTop: dIdx > 0 ? 6 : 0 }}>
              {/* D header */}
              <div style={{ display: "flex", alignItems: "center", padding: "6px 0 2px" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: t.pri, fontFamily: F.sans }}>D{dIdx + 1}</span>
                {hasNames && <span style={{ fontSize: 10, color: t.txtM, fontFamily: F.sans, marginLeft: 6 }}>
                  {picaPlayerName(0, dIdx)} vs {picaPlayerName(1, dIdx)}
                </span>}
              </div>
              {/* Cycle rows */}
              {duels.map((d, c) => {
                const w0 = d.t0 > d.t1; const w1 = d.t1 > d.t0;
                const diff = d.t0 - d.t1;
                return <div key={c} style={{ display: "flex", alignItems: "center", padding: "4px 0", borderBottom: `1px solid ${t.brd}` }}>
                  <span style={{ width: 40, fontSize: 10, color: t.txtF, fontFamily: F.sans }}>PP{c + 1}</span>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontFamily: F.serif, fontWeight: w0 ? 700 : 400, color: w0 ? t.pri : t.txt }}>{d.t0}</span>
                  <span style={{ width: 20, textAlign: "center", fontSize: 11, color: t.txtF }}>-</span>
                  <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontFamily: F.serif, fontWeight: w1 ? 700 : 400, color: w1 ? t.pri : t.txt }}>{d.t1}</span>
                  <span style={{ width: 40, textAlign: "center", fontSize: 11, fontFamily: F.sans, fontWeight: 600, color: diff > 0 ? t.ok : diff < 0 ? t.err : t.txtF }}>
                    {diff > 0 ? `+${diff}` : diff === 0 ? "=" : diff}
                  </span>
                </div>;
              })}
              {/* Subtotal per duel position */}
              {duels.length > 1 && <div style={{ display: "flex", alignItems: "center", padding: "4px 0 6px" }}>
                <span style={{ width: 40 }} />
                <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontFamily: F.sans, fontWeight: 600, color: sm0 ? t.pri : t.txt }}>{sub0}</span>
                <span style={{ width: 20, textAlign: "center", fontSize: 11, color: t.txtF }}>-</span>
                <span style={{ flex: 1, textAlign: "center", fontSize: 13, fontFamily: F.sans, fontWeight: 600, color: sm1 ? t.pri : t.txt }}>{sub1}</span>
                <span style={{ width: 40, textAlign: "center", fontSize: 11, fontFamily: F.sans, fontWeight: 700, color: subDiff > 0 ? t.ok : subDiff < 0 ? t.err : t.txtF }}>
                  {subDiff > 0 ? `+${subDiff}` : subDiff === 0 ? "=" : subDiff}
                </span>
              </div>}
            </div>;
          });
        })()}
        {/* Grand total */}
        {(() => {
          const tot0 = picaAllDuels.reduce((s, d) => s + d.t0, 0);
          const tot1 = picaAllDuels.reduce((s, d) => s + d.t1, 0);
          const totDiff = tot0 - tot1;
          const m0 = tot0 > tot1; const m1 = tot1 > tot0;
          return <div style={{ display: "flex", alignItems: "center", padding: "10px 0 4px", borderTop: `2px solid ${t.pri}`, marginTop: 4 }}>
            <span style={{ width: 40, fontSize: 11, color: t.txtM, fontFamily: F.sans, fontWeight: 700 }}>Total</span>
            <span style={{ flex: 1, textAlign: "center", fontSize: 22, fontFamily: F.serif, fontWeight: 700, color: m0 ? t.pri : t.txt }}>{tot0}</span>
            <span style={{ width: 20, textAlign: "center", fontSize: 11, color: t.txtF }}>-</span>
            <span style={{ flex: 1, textAlign: "center", fontSize: 22, fontFamily: F.serif, fontWeight: 700, color: m1 ? t.pri : t.txt }}>{tot1}</span>
            <span style={{ width: 40, textAlign: "center", fontSize: 12, fontFamily: F.sans, fontWeight: 700, color: totDiff > 0 ? t.ok : totDiff < 0 ? t.err : t.txtF }}>
              {totDiff > 0 ? `+${totDiff}` : totDiff === 0 ? "=" : totDiff}
            </span>
          </div>;
        })()}
        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => setShowDuels(false)} style={{
            flex: 1, background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: 8,
            padding: "10px 0", fontSize: 13, fontFamily: F.sans, fontWeight: 500, color: t.txt, cursor: "pointer", touchAction: "manipulation",
          }}>Cerrar</button>
          <button onClick={shareDuels} style={{
            flex: 1, background: t.pri, border: "none", borderRadius: 8,
            padding: "10px 0", fontSize: 13, fontFamily: F.sans, fontWeight: 600, color: "#fff", cursor: "pointer", touchAction: "manipulation",
          }}>{L.share}</button>
        </div>
      </div>
    </Modal>}

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
          { label: L.share, action: () => { setModal(null); doShare(); } },
          ...(hist.length > 0 ? [{ label: L.hist, action: () => { setModal(null); setShowH(true); } }] : []),
          ...(picaAllDuels.length > 0 ? [{ label: "Ver Duelos", action: () => { setModal(null); setShowDuels(true); } }] : []),
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

    {(modal === "revancha" || modal === "new") && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
        <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>{modal === "revancha" ? `¿${L.revancha}?` : `¿${L.nuevaPartida}?`}</p>
        <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>{modal === "revancha" ? "Se reinician los puntos a cero." : "Se vuelve a configurar todo."}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
          {modal === "revancha" ? <B onClick={revancha} s={{ flex: 1 }}>{L.revancha}</B>
            : <B v="err" onClick={nuevaPartida} s={{ flex: 1 }}>{L.nuevaPartida}</B>}
        </div>
      </div>
    </Modal>}
  </>);
}

export default Truco;
