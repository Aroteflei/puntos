import React, { useState, useEffect, useRef } from 'react';
import { Ctx, FONTS, strings, light, dark, ST, initWakeLock, B, Modal, useApp } from './lib.jsx';
import Truco from './games/Truco.jsx';
import Burako from './games/Burako.jsx';
import Generala from './games/Generala.jsx';
import Burako2 from './games/Burako2.jsx';

const GAMES = {
  truco: { name: "Truco", emoji: "🂡" },
  burako: { name: "Burako", emoji: "🃏" },
  burako2: { name: "Burako 2", emoji: "🃏" },
  generala: { name: "Generala", emoji: "🎲" },
};

function App() {
  const [sel, setSel] = useState(null);
  const [dk, setDk] = useState(false);
  const [contGame, setContGame] = useState(null);
  const t = dk ? dark : light;
  const L = strings["es"];
  const wakeLockRef = useRef(null);

  const handleContinueChange = (game) => setContGame(game);

  useEffect(() => {
    ST.load("app-dark").then(d => { if (d !== null) setDk(d) });
    Promise.all([ST.load("truco-game"), ST.load("burako-game"), ST.load("burako2-game"), ST.load("generala-game")]).then(([tr, bk, bk2, ge]) => {
      if (tr?.started) setContGame("truco");
      else if (bk?.teams?.length) setContGame("burako");
      else if (bk2?.teams?.length) setContGame("burako2");
      else if (ge?.ps?.length) setContGame("generala");
    });
    initWakeLock().then(l => { wakeLockRef.current = l });
  }, []);

  useEffect(() => { ST.save("app-dark", dk) }, [dk]);

  const tog = () => setDk(!dk);
  const clearCurrent = async () => { if (!contGame) return; await ST.del(`${contGame}-game`); setContGame(null); };

  return (
    <Ctx.Provider value={{ t, dk, tog, sounds: true, L, lang: "es" }}>
      <div style={{ minHeight: "100vh", background: t.bg, color: t.txt, fontFamily: "'DM Sans',sans-serif", transition: "background .3s,color .3s" }}>
        <link href={FONTS} rel="stylesheet" />
        <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}*{box-sizing:border-box}::selection{background:${t.priL};color:#fff}
          @keyframes popIn{from{transform:scale(0.8);opacity:0}to{transform:scale(1);opacity:1}}
          button:active{transform:scale(0.95)!important;opacity:0.85!important}
        `}</style>

        {sel === "truco" ? <Truco onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
          : sel === "burako" ? <Burako onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
          : sel === "burako2" ? <Burako2 onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
          : sel === "generala" ? <Generala onBack={() => setSel(null)} onContinueChange={handleContinueChange} />
          : <Home {...{ t, dk, tog, L, setSel, contGame, clearCurrent }} />}
      </div>
    </Ctx.Provider>
  );
}

function Home({ t, dk, tog, L, setSel, contGame, clearCurrent }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "44px 20px 40px", position: "relative" }}>

      {/* Dark mode toggle */}
      <button onClick={tog} style={{
        position: "absolute", top: 16, right: 20,
        background: "none", border: "none",
        color: t.txtM, fontSize: 22, cursor: "pointer",
        padding: 8, touchAction: "manipulation",
      }}>{dk ? "☀️" : "🌙"}</button>

      {/* Title */}
      <h1 style={{ fontFamily: "'Playfair Display'", fontSize: 52, fontWeight: 800, color: t.pri, margin: "0 0 6px", letterSpacing: -1 }}>PUNTOS</h1>
      <div style={{ height: 2, width: 60, background: `linear-gradient(90deg, transparent, ${t.pri}, transparent)`, margin: "0 auto 28px" }} />

      {/* Continue last game */}
      {contGame && (
        <div style={{ background: t.okBg, border: `1px solid ${t.ok}30`, borderRadius: 16, padding: "16px 18px", marginBottom: 20, maxWidth: 380, width: "100%", boxShadow: t.sh }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: t.card, border: `1px solid ${t.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{GAMES[contGame].emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, color: t.ok, fontWeight: 800, fontFamily: "'Playfair Display'" }}>{L.continueLast}</div>
              <div style={{ fontSize: 13, color: t.txt }}>{GAMES[contGame].name}</div>
            </div>
            <button onClick={clearCurrent} style={{ background: "none", border: "none", color: t.txtM, cursor: "pointer", fontSize: 18, padding: "4px 6px" }}>×</button>
          </div>
          <B onClick={() => setSel(contGame)} s={{ width: "100%", minHeight: 50 }}>{L.openNow}</B>
        </div>
      )}

      {/* Game cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, width: "100%" }}>
        {Object.entries(GAMES).map(([key, g]) => (
          <div key={key} onClick={() => setSel(key)}
            style={{ background: t.card, border: `1px solid ${t.brd}`, borderRadius: 16, padding: "22px 24px",
              display: "flex", alignItems: "center", gap: 18, cursor: "pointer", transition: "all .25s", boxShadow: t.sh }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: t.bgS, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
              border: `1px solid ${t.brd}` }}>{g.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, color: t.pri }}>{g.name}</div>
            </div>
            <div style={{ color: t.priL, fontSize: 18 }}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
