import React, { useState, useEffect, useRef } from 'react';
import { Ctx, FONTS, F, strings, light, dark, ST, initWakeLock, B, Modal, useApp } from './lib.jsx';
import Truco from './games/Truco.jsx';
import Generala from './games/Generala.jsx';
import Burako2 from './games/Burako2.jsx';

const GAMES = {
  truco: { name: "Truco", emoji: "🂡" },
  burako2: { name: "Burako", emoji: "🃏" },
  generala: { name: "Generala", emoji: "🎲" },
};

function App() {
  const [sel, setSel] = useState(null);
  const [dk, setDk] = useState(false);
  const [contGame, setContGame] = useState(null);
  const [lockedGame, setLockedGame] = useState(null);
  const [ready, setReady] = useState(false);
  const t = dk ? dark : light;
  const L = strings["es"];
  const wakeLockRef = useRef(null);

  const handleContinueChange = (game) => setContGame(game);

  useEffect(() => {
    ST.load("app-dark").then(d => { if (d !== null) setDk(d) });
    Promise.all([
      ST.load("truco-game"), ST.load("burako2-game"), ST.load("generala-game"), ST.load("app-game"),
    ]).then(([tr, bk2, ge, lock]) => {
      // Continue game detection
      if (tr?.started) setContGame("truco");
      else if (bk2?.teams?.length) setContGame("burako2");
      else if (ge?.ps?.length) setContGame("generala");

      // Game lock-in: permanent until user explicitly changes
      if (lock?.game && GAMES[lock.game]) {
        setLockedGame(lock.game);
        setSel(lock.game); // auto-navigate into game
      }
      setReady(true);
    });
    initWakeLock().then(l => { wakeLockRef.current = l });
  }, []);

  useEffect(() => { ST.save("app-dark", dk) }, [dk]);

  const tog = () => setDk(!dk);

  const pickGame = async (key) => {
    await ST.save("app-game", { game: key });
    setLockedGame(key);
    setSel(key);
  };

  // Go back to Home, keep the lock (only shows locked game on Home)
  const goBackHome = () => setSel(null);

  // Fully unlock: clear lock, show all games on Home
  const unlockGames = async () => {
    await ST.del("app-game");
    setLockedGame(null);
    setSel(null);
  };

  const clearCurrent = async () => {
    if (!contGame) return;
    await ST.del(`${contGame}-game`);
    setContGame(null);
  };

  if (!ready) return <div style={{ minHeight: "100vh", background: t.bg }} />;

  return (
    <Ctx.Provider value={{ t, dk, tog, sounds: true, L, lang: "es" }}>
      <div style={{ minHeight: "100vh", background: t.bg, color: t.txt, fontFamily: F.sans, transition: "background .3s,color .3s" }}>
        <link href={FONTS} rel="stylesheet" />
        <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}*{box-sizing:border-box}::selection{background:${t.priL};color:#fff}
          @keyframes popIn{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
          button:active{transform:scale(0.97)!important}
        `}</style>

        {sel === "truco" ? <Truco onBack={goBackHome} onContinueChange={handleContinueChange} onChangeGame={goBackHome} />
          : sel === "burako2" ? <Burako2 onBack={goBackHome} onContinueChange={handleContinueChange} onChangeGame={goBackHome} />
          : sel === "generala" ? <Generala onBack={goBackHome} onContinueChange={handleContinueChange} onChangeGame={goBackHome} />
          : <Home {...{ t, dk, tog, L, pickGame, contGame, clearCurrent, lockedGame, unlockGames }} />}
      </div>
    </Ctx.Provider>
  );
}

function Home({ t, dk, tog, L, pickGame, contGame, clearCurrent, lockedGame, unlockGames }) {
  const gamesToShow = lockedGame ? [[lockedGame, GAMES[lockedGame]]] : Object.entries(GAMES);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px 48px", maxWidth: 400, margin: "0 auto" }}>

      {/* Title */}
      <h1 style={{ fontFamily: F.serif, fontSize: 48, fontWeight: 400, color: t.pri, margin: 0, letterSpacing: -.5, animation: "fadeUp .4s ease" }}>PUNTOS</h1>
      <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 400, letterSpacing: 3, color: t.txtM, textTransform: "uppercase", marginTop: 4, animation: "fadeUp .4s ease .05s both" }}>marcador</span>

      {/* Continue last game — only if it matches locked game (or no lock) */}
      {contGame && GAMES[contGame] && (!lockedGame || contGame === lockedGame) && (
        <div onClick={() => pickGame(contGame)} style={{ width: "100%", marginTop: 40, padding: "14px 0", borderBottom: `1px solid ${t.pri}20`, cursor: "pointer", display: "flex", alignItems: "center", animation: "fadeUp .4s ease .1s both" }}>
          <span style={{ flex: 1, fontFamily: F.sans, fontSize: 14, fontWeight: 500, color: t.pri }}>Continuar: {GAMES[contGame].name}</span>
          <button onClick={e => { e.stopPropagation(); clearCurrent() }} style={{ background: "none", border: "none", color: t.txtF, cursor: "pointer", fontSize: 14, padding: "4px 8px", fontFamily: F.sans }}>×</button>
        </div>
      )}

      {/* Game list */}
      <div style={{ width: "100%", marginTop: (contGame && (!lockedGame || contGame === lockedGame)) ? 8 : 40 }}>
        {gamesToShow.map(([key, g], i) => (
          <div key={key} onClick={() => pickGame(key)}
            style={{ padding: "20px 0", borderBottom: i < gamesToShow.length - 1 ? `1px solid ${t.brd}` : "none",
              display: "flex", alignItems: "center", cursor: "pointer", animation: `fadeUp .4s ease ${(i + 2) * .06}s both` }}>
            <span style={{ flex: 1, fontFamily: F.serif, fontSize: 22, color: t.txt }}>{g.name}</span>
            <span style={{ color: t.txtF, fontSize: 14, fontFamily: F.sans }}>→</span>
          </div>
        ))}
      </div>

      {/* Cambiar juego — only visible when locked to a game */}
      {lockedGame && (
        <button onClick={unlockGames} style={{ background: "none", border: "none", color: t.txtF, cursor: "pointer",
          fontSize: 12, fontFamily: F.sans, marginTop: 32, padding: "4px 8px", animation: "fadeUp .4s ease .3s both" }}>
          Cambiar juego
        </button>
      )}

      {/* Dark mode toggle */}
      <div style={{ marginTop: lockedGame ? 16 : 48, display: "flex", gap: 4, fontFamily: F.sans, fontSize: 12, animation: "fadeUp .4s ease .4s both" }}>
        <button onClick={() => { if (dk) tog() }} style={{ background: "none", border: "none", color: dk ? t.txtF : t.pri, cursor: "pointer", padding: "4px 8px", fontWeight: dk ? 400 : 600, fontFamily: F.sans, fontSize: 12 }}>Light</button>
        <span style={{ color: t.txtF }}>/</span>
        <button onClick={() => { if (!dk) tog() }} style={{ background: "none", border: "none", color: dk ? t.pri : t.txtF, cursor: "pointer", padding: "4px 8px", fontWeight: dk ? 600 : 400, fontFamily: F.sans, fontSize: 12 }}>Dark</button>
      </div>
    </div>
  );
}

export default App;
