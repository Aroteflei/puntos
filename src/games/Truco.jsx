import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, ST, clone, shareResult, vib, vibWin, fmtDate, F, B, EN, Modal, UndoBar } from '../lib.jsx';

function TrucoTally({ count, color, divAt, buenasColor }) {
  const SZ = 48, PD = 4, GAP = 5;

  const jitter = useMemo(() => {
    const a = [];
    for (let i = 0; i < 80; i++) a.push(((Math.sin((count * 100 + i) * 9301 + 49297) % 1) * 1.2));
    return a;
  }, [count]);

  let ji = 0;
  const j = () => jitter[ji++ % jitter.length];
  const els = [];
  let drawn = 0, divPlaced = !divAt;

  const fullSq = (key) => (
    <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>
      <rect x={PD + j()} y={PD + j()} width={SZ - PD * 2 + j()} height={SZ - PD * 2 + j()}
        fill="none" stroke={color} strokeWidth="2" rx="1" strokeLinecap="round" opacity=".7" />
      <line x1={PD + 1 + j()} y1={SZ - PD - 1 + j()} x2={SZ - PD - 1 + j()} y2={PD + 1 + j()}
        stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );

  const partSq = (n, key) => {
    const segs = [];
    if (n >= 1) segs.push(<line key="l" x1={PD + j()} y1={PD + j()} x2={PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 2) segs.push(<line key="b" x1={PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={SZ - PD + j()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 3) segs.push(<line key="r" x1={SZ - PD + j()} y1={SZ - PD + j()} x2={SZ - PD + j()} y2={PD + j()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    if (n >= 4) segs.push(<line key="t" x1={SZ - PD + j()} y1={PD + j()} x2={PD + j()} y2={PD + j()} stroke={color} strokeWidth="2" strokeLinecap="round" opacity=".7" />);
    return <svg key={key} width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>{segs}</svg>;
  };

  const bc = buenasColor || color;
  const divider = (
    <div key="div" style={{ display: "flex", alignItems: "center", width: "100%", margin: `${GAP}px 0`, padding: "0 2px" }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${bc})`, opacity: .4 }} />
      <span style={{ fontSize: 8, color: bc, fontWeight: 600, letterSpacing: 2, padding: "0 6px", fontFamily: F.sans }}>BUENAS</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(270deg, transparent, ${bc})`, opacity: .4 }} />
    </div>
  );

  while (drawn < count) {
    const rem = count - drawn;
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: GAP }}>
      {els.length > 0 ? els : <div style={{ color, opacity: 0.15, fontSize: 24 }}>—</div>}
    </div>
  );
}

function Col({ player, idx, target, winner, ph, onAdd, onRen, t }) {
  const dim = winner && winner !== player;
  const atTarget = player.p >= target;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", opacity: dim ? 0.3 : 1, transition: "opacity .3s" }}>
      <div style={{ textAlign: "center", padding: "12px 10px 10px", borderBottom: `1px solid ${t.brd}` }}>
        <EN name={player.name} onSave={n => onRen(idx, n)} sz={18} fw={700} />
      </div>

      <div style={{
        flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "10px 10px", overflowY: "auto", WebkitOverflowScrolling: "touch", minHeight: 80, maxHeight: "42vh",
      }}>
        {target === 30 && <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 2, color: t.err, marginBottom: 4, fontFamily: F.sans }}>MALAS</div>}
        <TrucoTally count={player.p} color={t.txt} divAt={target === 30 ? 15 : null} buenasColor={t.ok} />
      </div>

      <div style={{ textAlign: "center", padding: "10px 0", borderTop: `1px solid ${t.brd}` }}>
        <div style={{ fontFamily: F.serif, fontSize: ph ? 48 : 64, color: t.pri, lineHeight: 1, letterSpacing: -1 }}>
          {player.p}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "8px 12px 14px", borderTop: `1px solid ${t.brd}` }}>
        {[1, 2, 3].map(v => (
          <button key={v} onClick={() => !atTarget && onAdd(idx, v)} disabled={atTarget} style={{
            background: "transparent", color: atTarget ? t.txtF : t.pri, border: `1px solid ${atTarget ? t.brd : t.pri}`,
            borderRadius: 6, height: 48, flex: 1, fontSize: 20,
            fontFamily: F.serif, cursor: atTarget ? "default" : "pointer", touchAction: "manipulation",
            opacity: atTarget ? 0.3 : 1, transition: "all .15s",
          }}>+{v}</button>
        ))}
      </div>
    </div>
  );
}

const TEAM_SIZE_OPTIONS = [
  { teamSize: 1, label: "2 jugadores" },
  { teamSize: 2, label: "4 jugadores" },
  { teamSize: 3, label: "6 jugadores" },
];

const defaultRawNames = (teamSize) => Array.from({ length: teamSize * 2 }, (_, i) => `Jugador ${i + 1}`);
const maxScore = (scores) => Math.max(...scores.map((s) => s.p), 0);

function buildTeamName(rawNames, teamSize, teamIdx) {
  const start = teamIdx * teamSize;
  const members = rawNames.slice(start, start + teamSize).map((name, idx) => name?.trim() || `Jugador ${start + idx + 1}`);
  return members.join(" - ");
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
  const [picapicaStep, setPicapicaStep] = useState(0);
  const [picaRange, setPicaRange] = useState([5, 25]);
  const [picaMode, setPicaMode] = useState("suma");
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);
  const nameRefs = useRef([]);
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
        setPicapicaStep(d.picapicaStep ?? 0);
        if (Array.isArray(d.picaRange) && d.picaRange.length === 2) setPicaRange(d.picaRange);
        if (d.picaMode === "suma" || d.picaMode === "diff") setPicaMode(d.picaMode);
        setStarted(true);
        onContinueChange?.("truco");
      }
      setLoading(false);
    });
    ST.load("truco-hist").then(d => { if (Array.isArray(d)) setHist(d) });
  }, []);

  useEffect(() => {
    if (!started) return;
    ST.save("truco-game", { started: true, target, teamSize, rawNames, sc, picapicaStep, picaRange, picaMode });
    onContinueChange?.("truco");
  }, [started, target, teamSize, rawNames, sc, picapicaStep, picaRange, picaMode]);

  const persist = (next = {}) => {
    if (!started) return;
    ST.save("truco-game", {
      started: true,
      target,
      teamSize,
      rawNames,
      sc,
      picapicaStep,
      picaRange,
      picaMode,
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
    if (nx) {
      nx.focus();
      nx.select?.();
    } else {
      startGame();
    }
  };

  const startGame = async () => {
    const safeRawNames = rawNames.map((name, i) => name?.trim() || `Jugador ${i + 1}`);
    const fresh = buildScore(safeRawNames, teamSize);
    setRawNames(safeRawNames);
    setSc(fresh);
    setPicapicaStep(0);
    setStarted(true);
    await ST.save("truco-game", { started: true, target, teamSize, rawNames: safeRawNames, sc: fresh, picapicaStep: 0, picaRange, picaMode });
    onContinueChange?.("truco");
  };

  const goBack = async () => {
    if (started) persist();
    onContinueChange?.(started ? "truco" : null);
    onChangeGame?.();
  };

  const add = (i, v) => {
    if (sc[i].p >= target) return;
    lastStateRef.current = { sc: clone(sc), picapicaStep };
    setToast({ text: `${sc[i].name}: +${v}`, undo: true });
    const newP = Math.min(target, Math.max(0, sc[i].p + v));
    const nextSc = sc.map((row, idx) => idx === i ? { ...row, p: newP } : row);

    let nextPicaStep = picapicaStep;
    if (teamSize === 3) {
      const wasInPhase = maxScore(sc) >= picaRange[0] && maxScore(sc) < picaRange[1];
      const nowInPhase = maxScore(nextSc) >= picaRange[0] && maxScore(nextSc) < picaRange[1];
      if (!nowInPhase) nextPicaStep = 0;
      else if (wasInPhase) nextPicaStep = picapicaStep + 1;
      else nextPicaStep = 0;
    }

    setSc(nextSc);
    setPicapicaStep(nextPicaStep);
    persist({ sc: nextSc, picapicaStep: nextPicaStep });
    if (sounds) vib();
    if (sounds && newP >= target) vibWin();
  };

  const ren = (i, nextName) => {
    const members = nextName.split("-").map((part) => part.trim()).filter(Boolean);
    const nextRawNames = [...rawNames];
    for (let offset = 0; offset < teamSize; offset++) {
      nextRawNames[i * teamSize + offset] = members[offset] || nextRawNames[i * teamSize + offset] || `Jugador ${i * teamSize + offset + 1}`;
    }
    const nextSc = sc.map((row, idx) => idx === i ? { ...row, name: buildTeamName(nextRawNames, teamSize, i) } : row);
    setRawNames(nextRawNames);
    setSc(nextSc);
    persist({ rawNames: nextRawNames, sc: nextSc });
  };

  const winner = sc.find(s => s.p >= target);

  const nuevaPartida = async () => {
    // Save to history if game had points
    if (sc.some(s => s.p > 0)) {
      const entry = { players: sc.map(s => ({ name: s.name, t: s.p })), date: fmtDate() };
      const nextHist = [entry, ...hist];
      setHist(nextHist);
      await ST.save("truco-hist", nextHist);
    }
    const nextSc = sc.map(s => ({ ...s, p: 0 }));
    setSc(nextSc);
    setPicapicaStep(0);
    setModal(null);
    lastStateRef.current = null;
    setToast({ text: L.nuevaPartida });
    persist({ sc: nextSc, picapicaStep: 0 });
  };

  const delH = async (i) => {
    const next = hist.filter((_, j) => j !== i);
    setHist(next);
    if (next.length) await ST.save("truco-hist", next);
    else await ST.del("truco-hist");
  };

  const doShare = () => shareResult(`Truco - ${target} pts`, sc.map((s) => `${s.name}: ${s.p}`));

  const handleUndo = () => {
    const ls = lastStateRef.current;
    if (!ls) return;
    setSc(ls.sc);
    setPicapicaStep(ls.picapicaStep);
    persist({ sc: ls.sc, picapicaStep: ls.picapicaStep });
    lastStateRef.current = null;
  };

  const picaActive = teamSize === 3 && started && sc.length > 0 && maxScore(sc) >= picaRange[0] && maxScore(sc) < picaRange[1];
  const picaLabel = picaActive
    ? (picaMode === "suma"
      ? (picapicaStep % 4 < 3 ? `Picapica · Duelo ${(picapicaStep % 4) + 1} de 3` : "Mano redonda")
      : (picapicaStep % 2 === 0 ? "Picapica" : "Mano redonda"))
    : null;
  const picaHint = picaActive ? `De ${picaRange[0]} a ${picaRange[1]}` : null;
  const rawCount = teamSize * 2;

  if (loading) return <div style={{ minHeight: "100vh", background: t.bg }}><div style={{ padding: 40, textAlign: "center", color: t.txtM }}>…</div></div>;

  if (!started) return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <div style={{ padding: "12px 16px 0" }}>
        <button onClick={goBack} style={{
          background: "none", border: "none", color: t.txtM, fontSize: 15, fontFamily: F.sans, fontWeight: 500,
          cursor: "pointer", padding: "8px 12px", touchAction: "manipulation"
        }}>←</button>
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
                placeholder={`Jugador ${i + 1}`}
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
      <div style={{ display: "flex", alignItems: "center", padding: ph ? "8px 10px" : "10px 14px", gap: 8, flexShrink: 0, borderBottom: `1px solid ${t.brd}` }}>
        <button onClick={goBack} style={{
          background: "none", border: "none", color: t.txtM, fontSize: 15, fontFamily: F.sans, fontWeight: 500, cursor: "pointer", padding: "4px 8px", touchAction: "manipulation",
        }}>←</button>
        <span style={{ fontSize: 12, color: t.txtM, fontFamily: F.sans, fontWeight: 500 }}>A {target}</span>
        <div style={{ flex: 1 }} />
        {hist.length > 0 && <button onClick={() => setShowH(!showH)} style={{ background: "none", border: `1px solid ${showH ? t.pri : t.brd}`, borderRadius: 6, color: showH ? t.pri : t.txtM, fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", touchAction: "manipulation" }}>{L.hist}</button>}
        {!winner && <>
          <button onClick={doShare} style={{ background: "none", border: `1px solid ${t.brd}`, borderRadius: 6, color: t.txtM, fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", touchAction: "manipulation" }}>Compartir</button>
          <button onClick={() => setModal("new")} style={{ background: "none", border: `1px solid ${t.brd}`, borderRadius: 6, color: t.txtM, fontSize: 12, fontFamily: F.sans, cursor: "pointer", padding: "4px 10px", touchAction: "manipulation" }}>Nueva</button>
        </>}
      </div>

      {winner && (
        <div style={{ textAlign: "center", padding: ph ? 10 : 14, background: t.pri, color: "#fff", flexShrink: 0, animation: "scaleIn .3s ease" }}>
          <div style={{ fontSize: ph ? 16 : 18, fontFamily: F.serif }}>¡{winner.name} {L.winPl}!</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
            <button onClick={doShare} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: F.sans, padding: "6px 12px", cursor: "pointer" }}>Compartir</button>
            <button onClick={nuevaPartida} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.3)", borderRadius: 6, color: "#fff", fontSize: 12, fontFamily: F.sans, padding: "6px 12px", cursor: "pointer" }}>{L.nuevaPartida}</button>
          </div>
        </div>
      )}

      {picaActive && (
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${t.pri}20`, flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: t.pri, fontWeight: 600, textAlign: "center", fontFamily: F.sans }}>{picaLabel}</div>
          <div style={{ fontSize: 11, color: t.txtM, textAlign: "center", marginTop: 2, fontFamily: F.sans }}>{picaHint}</div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <Col player={sc[0]} idx={0} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} />
        <div style={{ width: 1, background: t.brd, flexShrink: 0 }} />
        <Col player={sc[1]} idx={1} target={target} winner={winner} ph={ph} onAdd={add} onRen={ren} t={t} />
      </div>

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

    {modal && <Modal onClose={() => setModal(null)}>
      <div style={{ background: t.card, borderRadius: 12, padding: 24, textAlign: "center", border: `1px solid ${t.brd}`, boxShadow: t.shH }}>
        <p style={{ fontSize: 18, fontFamily: F.serif, margin: "0 0 6px" }}>{L.nuevaPartida}?</p>
        <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 16px", fontFamily: F.sans }}>Se reinician los puntos a cero.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
          <B onClick={nuevaPartida} s={{ flex: 1 }}>{L.nuevaPartida}</B>
        </div>
      </div>
    </Modal>}
  </>);
}

export default Truco;
