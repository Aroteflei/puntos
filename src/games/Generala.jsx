import React, { useState, useEffect, useRef } from 'react';
import { useApp, ST, clone, fmtDate, shareResult, vib, B, EN, Hdr, NI, IcoBtn, Modal, UndoBar } from '../lib';

const GC = [
  { k: "uno", l: "Uno", n: 1, m: 5 }, { k: "dos", l: "Dos", n: 2, m: 10 }, { k: "tres", l: "Tres", n: 3, m: 15 },
  { k: "cuatro", l: "Cuatro", n: 4, m: 20 }, { k: "cinco", l: "Cinco", n: 5, m: 25 }, { k: "seis", l: "Seis", n: 6, m: 30 },
  { k: "esc", l: "Escalera", f: [20, 25] }, { k: "full", l: "Full", f: [30, 35] },
  { k: "poker", l: "Póker", f: [40, 45] }, { k: "gen", l: "Generala", f: [50] },
  { k: "doble", l: "Doble Gen.", f: [100] },
];
const gV = (c) => c.f ? c.f : Array.from({ length: Math.floor(c.m / c.n) }, (_, i) => (i + 1) * c.n);

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

  return <div>
    <Hdr title="Generala" emoji="🎲" onBack={goBack} sub={turnsLeft > 0 ? `${turnsLeft} ${L.turnsLeft}` : `¡${L.done}!`} icons={<>
      <IcoBtn onClick={doShare} t={t}>📤</IcoBtn>
      <IcoBtn onClick={() => setModal("new")} t={t}>🔄</IcoBtn>
      {hist.length > 0 && <IcoBtn onClick={() => setShowH(!showH)} t={t}>📋</IcoBtn>}
    </>} />

    {modal && <Modal onClose={() => setModal(null)}><div style={{ background: t.card, borderRadius: 16, padding: 24, textAlign: "center", boxShadow: t.shH }}>
      <p style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Playfair Display'", margin: "0 0 6px" }}>{modal === "new" ? L.newGame : L.resetQ}</p>
      <p style={{ fontSize: 12, color: t.txtM, margin: "0 0 16px" }}>{modal === "new" ? L.savesHist : L.losesAll}</p>
      <div style={{ display: "flex", gap: 8 }}><B v="gh" onClick={() => setModal(null)} s={{ flex: 1 }}>{L.cancel}</B>
        {modal === "new" ? <B onClick={saveNew} s={{ flex: 1 }}>{L.yesNew}</B> : <B v="err" onClick={resetZ} s={{ flex: 1 }}>{L.reset}</B>}</div>
      {modal === "new" && <B v="err" onClick={() => setModal("reset")} s={{ marginTop: 8, width: "100%", fontSize: 12 }}>{L.resetNoSave}</B>}
    </div></Modal>}

    {sheet && <Modal onClose={() => setSheet(null)}>
      <div style={{ background: t.card, borderRadius: 20, padding: 20, boxShadow: t.shH }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: t.pri, margin: "0 0 4px", fontFamily: "'Playfair Display'" }}>
          {ps[sheet.pi]?.name} — {GC.find(c => c.k === sheet.cat)?.l}</p>
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

    {allDone && <div style={{ textAlign: "center", padding: 14, margin: "8px 12px", background: `linear-gradient(135deg, ${t.pri}, ${t.priL})`, borderRadius: 14, color: "#fff" }}>
      <div style={{ fontSize: 20, fontFamily: "'Playfair Display'", fontWeight: 800 }}>🏆 ¡{ps.reduce((b, p) => tot(p) > tot(b) ? p : b, ps[0]).name} {L.wins}!</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
        <B onClick={doShare} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>📤 {L.share}</B>
        <B onClick={rematch} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.rematch}</B>
        <B onClick={() => setModal("new")} s={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{L.yesNew}</B></div></div>}

    <div style={{ padding: "10px 8px 20px", overflowX: "auto" }}>
      <div style={{ minWidth: Math.max(300, 100 + ps.length * 76) }}>
        <div style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginBottom: 3, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ padding: 4, fontSize: 10, color: t.txtF }}></div>
          {ps.map((p, i) => <div key={i} style={{ padding: "8px 4px", textAlign: "center", background: t.card, borderRadius: "10px 10px 0 0", border: `1px solid ${t.brd}`, borderBottom: "none" }}>
            <EN name={p.name} onSave={n => ren(i, n)} sz={12} /></div>)}
        </div>
        {GC.map((cat, ci) => { const same = allSame(cat);
          return <div key={cat.k} style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginBottom: 3, position: "relative" }}>
            <div style={{ padding: "10px 6px", fontSize: 11, background: t.bgS, border: `1px solid ${t.brd}`,
              borderRadius: ci === 0 ? "8px 0 0 0" : ci === GC.length - 1 ? "0 0 0 8px" : 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ fontWeight: 600, color: t.pri, fontFamily: "'Playfair Display'", fontSize: 12 }}>{cat.l}</span>
              <span style={{ fontSize: 9, color: t.txtF }}>{cat.n ? `${L.upTo} ${cat.m}` : gV(cat).join("/")}</span></div>
            {ps.map((p, pi) => { const val = p.scores[cat.k];
              return <div key={pi} onClick={() => { if (val === null && !askTurnGuard(pi)) return; setSheet({ pi, cat: cat.k }) }}
                style={{ padding: 3, textAlign: "center", cursor: "pointer",
                  background: val === "x" ? t.errBg : val !== null ? t.okBg : t.card, border: `1px solid ${t.brd}`,
                  borderRadius: ci === 0 && pi === ps.length - 1 ? "0 8px 0 0" : ci === GC.length - 1 && pi === ps.length - 1 ? "0 0 8px 0" : 0,
                  display: "flex", alignItems: "center", justifyContent: "center", minHeight: 52, transition: "background .15s" }}>
                {val === "x" ? <span style={{ color: t.err, fontSize: 15, fontWeight: 700 }}>✗</span>
                  : val !== null ? <span style={{ fontFamily: "'Playfair Display'", fontSize: 17, fontWeight: 700, color: t.pri }}>{val}</span>
                  : <span style={{ color: t.txtF, fontSize: 13 }}>·</span>}
              </div> })}
            {same && <div style={{ position: "absolute", top: "50%", left: 102, right: 2, height: 2, background: t.pri, opacity: .35, pointerEvents: "none" }} />}
          </div> })}
        <div style={{ display: "grid", gridTemplateColumns: `110px repeat(${ps.length}, minmax(64px, 1fr))`, gap: 3, marginTop: 6 }}>
          <div style={{ padding: "8px 5px", fontSize: 12, fontWeight: 800, color: t.pri, fontFamily: "'Playfair Display'",
            background: t.bgS, border: `1px solid ${t.brd}`, borderRadius: "0 0 0 8px" }}>{L.total}</div>
          {ps.map((p, pi) => <div key={pi} style={{ padding: 5, textAlign: "center", background: t.bgS, border: `1px solid ${t.brd}`,
            borderRadius: pi === ps.length - 1 ? "0 0 8px 0" : 0 }}>
            <span style={{ fontFamily: "'Playfair Display'", fontSize: 24, fontWeight: 800, color: t.pri }}>{tot(p)}</span></div>)}
        </div>
      </div>
    </div>
    <UndoBar toast={toast} onUndo={() => toast?.undo?.()} onClose={() => setToast(null)} />
  </div>;
}
// ═══════════════════════════════════════════════
// HOME + APP
// ═══════════════════════════════════════════════
const GAMES = { truco: { name: "Truco", emoji: "🂡" },
  burako: { name: "Burako", emoji: "🃏" },
  generala: { name: "Generala", emoji: "🎲" } };

function App() {
  const [sel, setSel] = useState(null); const [dk, setDk] = useState(false);
  const [sounds, setSounds] = useState(true); const [lang, setLang] = useState("es");
  const [showSettings, setShowSettings] = useState(false); const [showFb, setShowFb] = useState(false);
  const [contGame, setContGame] = useState(null);
  const handleContinueChange = (game) => setContGame(game);
  const t = dk ? dark : light; const L = strings[lang]; const wakeLockRef = useRef(null);

  useEffect(() => {
    ST.load("app-sounds").then(d => { if (d !== null) setSounds(d) });
    ST.load("app-dark").then(d => { if (d !== null) setDk(d) });
    ST.load("app-lang").then(d => { if (d) setLang(d) });
    Promise.all([ST.load("truco-game"), ST.load("burako-game"), ST.load("generala-game")]).then(([tr, bk, ge]) => {
      if (tr?.started) setContGame("truco"); else if (bk?.teams?.length) setContGame("burako"); else if (ge?.ps?.length) setContGame("generala") });
    initWakeLock().then(l => { wakeLockRef.current = l }) }, []);

  useEffect(() => { ST.save("app-dark", dk) }, [dk]);
  useEffect(() => { ST.save("app-sounds", sounds) }, [sounds]);
  useEffect(() => { ST.save("app-lang", lang) }, [lang]);
  const tog = () => setDk(!dk);
  const toggleLang = () => setLang(l => l === "es" ? "en" : "es");

  const clearCurrent = async () => {
    if (!contGame) return;
    await ST.del(`${contGame}-game`);
    setContGame(null);
  };

  return <Ctx.Provider value={{ t, dk, tog, sounds, setSounds, L, lang }}>
    <div style={{ minHeight: "100vh", background: t.bg, color: t.txt, fontFamily: "'DM Sans',sans-serif", transition: "background .3s,color .3s" }}>
      <link href={FONTS} rel="stylesheet" />
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}*{box-sizing:border-box}::selection{background:${t.priL};color:#fff}
        @keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
        button:active{transform:scale(0.95)!important;opacity:0.85!important}
      `}</style>

      {sel === "truco" ? <Truco onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : sel === "burako" ? <Burako onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : sel === "generala" ? <Generala onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
        : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 20px 40px" }}>
          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <button onClick={() => setShowFb(true)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, width: 52, height: 52, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>💬</button>
            <button onClick={() => setShowSettings(true)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 12, width: 52, height: 52, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</button>
          </div>

          {showFb && <Modal onClose={() => setShowFb(false)}><div style={{ background: t.card, borderRadius: 16, padding: 24, boxShadow: t.shH }}>
            <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display'", color: t.pri, margin: "0 0 8px" }}>{L.feedback}</p>
            <p style={{ fontSize: 13, color: t.txtM, margin: "0 0 12px" }}>{L.suggest}</p>
            <textarea placeholder={L.write} rows={4} style={{ width: "100%", background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 10, padding: 10, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}><B v="gh" onClick={() => setShowFb(false)} s={{ flex: 1 }}>{L.close}</B>
              <B onClick={() => setShowFb(false)} s={{ flex: 1 }}>{L.send}</B></div></div></Modal>}

          {showSettings && <Modal onClose={() => setShowSettings(false)}><div style={{ background: t.card, borderRadius: 16, padding: 24, boxShadow: t.shH }}>
            <p style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Playfair Display'", color: t.pri, margin: "0 0 16px" }}>{L.settings}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.darkMode}</span>
              <button onClick={tog} style={{ background: dk ? t.pri : t.bgS, color: dk ? "#fff" : t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{dk ? "🌙 On" : "☀️ Off"}</button></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.soundVib}</span>
              <button onClick={() => setSounds(!sounds)} style={{ background: sounds ? t.pri : t.bgS, color: sounds ? "#fff" : t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{sounds ? "🔊 On" : "🔇 Off"}</button></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>{L.lang}</span>
              <button onClick={toggleLang} style={{ background: t.bgS, color: t.txt, border: `1px solid ${t.brd}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans'" }}>{lang === "es" ? "🇦🇷 Español" : "🇺🇸 English"}</button></div>
            <B v="gh" onClick={() => setShowSettings(false)} s={{ width: "100%", marginTop: 8 }}>{L.close}</B>
          </div></Modal>}

          <h1 style={{ fontFamily: "'Playfair Display'", fontSize: 52, fontWeight: 800, color: t.pri, margin: "0 0 6px", letterSpacing: -1 }}>PUNTOS</h1>
          <div style={{ height: 2, width: 60, background: `linear-gradient(90deg, transparent, ${t.pri}, transparent)`, margin: "0 auto 28px" }} />
          
          {contGame && <div style={{ background: t.okBg, border: `1px solid ${t.ok}30`, borderRadius: 16, padding: "16px 18px", marginBottom: 20, maxWidth: 380, width: "100%", boxShadow: t.sh }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: t.card, border: `1px solid ${t.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{GAMES[contGame].emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, color: t.ok, fontWeight: 800, fontFamily: "'Playfair Display'" }}>{L.continueLast}</div>
                <div style={{ fontSize: 13, color: t.txt }}>{GAMES[contGame].name}</div>
              </div>
              <button onClick={clearCurrent} style={{ background: "none", border: "none", color: t.txtM, cursor: "pointer", fontSize: 18, padding: "4px 6px" }}>×</button>
            </div>
            <B onClick={() => setSel(contGame)} s={{ width: "100%", minHeight: 50 }}>{L.openNow}</B>
          </div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, width: "100%" }}>
            {Object.entries(GAMES).map(([key, g]) => <div key={key} onClick={() => setSel(key)}
              style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 16, padding: "22px 24px",
                display: "flex", alignItems: "center", gap: 18, cursor: "pointer", transition: "all .25s", boxShadow: t.sh }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: t.bgS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                border: `1px solid ${t.brd}` }}>{g.emoji}</div>
              <div style={{ flex: 1 }}><div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, color: t.pri }}>{g.name}</div></div>
              <div style={{ color: t.priL, fontSize: 18 }}>→</div>
            </div>)}
          </div>
          <p style={{ fontSize: 11, color: t.txtF, marginTop: 32 }}>{L.more}</p>
        </div>}
    </div>

export default Generala;
