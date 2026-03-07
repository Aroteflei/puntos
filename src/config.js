export const strings = {
  es: {
    chooseGame: "Elegí tu juego ✨", more: "Más juegos próximamente ✨", feedback: "Feedback", suggest: "¿Sugerencia o bug?",
    write: "Escribí acá...", close: "Cerrar", send: "Enviar", settings: "Ajustes", darkMode: "Modo oscuro",
    soundVib: "Sonidos/vibración", lang: "Idioma", contGame: "Continuar partida de", unfinished: "Tenés una partida sin terminar",
    howMany: "¿A cuántos puntos?", names: "Nombres", next: "Siguiente →", back: "← Atrás", start: "Empezar",
    newGame: "¿Nueva partida?", savesHist: "Se guarda en historial.", resetQ: "¿Reiniciar a cero?", losesAll: "Se pierde todo.",
    cancel: "Cancelar", yesNew: "Sí, nueva", reset: "Reiniciar", resetNoSave: "Reiniciar sin guardar",
    undoQ: "¿Deshacer última mano?", undoDesc: "Se borra la última mano.", undo: "Deshacer", yesUndo: "Sí, deshacer",
    remain: "faltan", toWin: "para ganar", wins: "ganan", hist: "Historial", newHand: "+ Nueva mano",
    editHand: "Editar mano", save: "Guardar", chooseClosed: "Elegí quién cerró",
    puras: "Puras", canastas: "Canastas", puntos: "Puntos", playedDead: "¿Jugó muerto?", closed: "Cerró",
    notClosed: "No cerró", sub: "Subtotal", dropWith: "Baja con",
    howPlay: "¿Cómo juegan?", pairs: "2 Parejas", threePlayers: "3 Jugadores", target: "Objetivo",
    custom: "Personalizado", values: "Valores", penaltyDead: "Penalidad muerto",
    howManyPlayers: "¿Cuántos jugadores?", turnsLeft: "turnos restantes", done: "¡Terminado!",
    chooseScore: "Elegí el puntaje", cross: "Tachar", erase: "Borrar", share: "Compartir",
    total: "TOTAL", upTo: "Hasta",
    turnWarning: "Le toca a {expected}. ¿Seguir?",
    rematch: "Revancha", continueLast: "Continuar última partida", openNow: "Abrir ahora", handNum: "Mano", redo: "Rehacer",
  },
  en: {
    chooseGame: "Choose your game ✨", more: "More games coming soon ✨", feedback: "Feedback", suggest: "Suggestion or bug?",
    write: "Write here...", close: "Close", send: "Send", settings: "Settings", darkMode: "Dark mode",
    soundVib: "Sound/vibration", lang: "Language", contGame: "Continue game of", unfinished: "You have an unfinished game",
    howMany: "How many points?", names: "Names", next: "Next →", back: "← Back", start: "Start",
    newGame: "New game?", savesHist: "Saves to history.", resetQ: "Reset to zero?", losesAll: "Loses everything.",
    cancel: "Cancel", yesNew: "Yes, new", reset: "Reset", resetNoSave: "Reset without saving",
    undoQ: "Undo last hand?", undoDesc: "Removes last hand.", undo: "Undo", yesUndo: "Yes, undo",
    remain: "left", toWin: "to win", wins: "win!", hist: "History", newHand: "+ New hand",
    editHand: "Edit hand", save: "Save", chooseClosed: "Choose who closed",
    puras: "Pure runs", canastas: "Runs", puntos: "Points", playedDead: "Played dead hand?", closed: "Closed",
    notClosed: "Didn't close", sub: "Subtotal", dropWith: "Opens with",
    howPlay: "How do you play?", pairs: "2 Pairs", threePlayers: "3 Players", target: "Target",
    custom: "Custom", values: "Values", penaltyDead: "Dead hand penalty",
    howManyPlayers: "How many players?", turnsLeft: "turns left", done: "Done!",
    chooseScore: "Choose score", cross: "Cross out", erase: "Clear", share: "Share",
    total: "TOTAL", upTo: "Up to",
    turnWarning: "{expected}'s turn. Continue?",
    rematch: "Rematch", continueLast: "Continue last game", openNow: "Open now", handNum: "Hand", redo: "Redo",
  }
};

export const light = {
  bg:"#F7F3EE",bgS:"#F0E8DE",card:"#FFF",pri:"#6B4E30",priL:"#B4946A",priD:"#3C2A15",
  txt:"#2C1810",txtM:"#9C8B7A",txtF:"#C4B4A0",brd:"#E8E0D6",
  err:"#C0392B",errBg:"#FCEAE8",ok:"#27764E",okBg:"#E8F5ED",
  sh:"0 1px 6px rgba(80,50,20,.06)",shH:"0 4px 16px rgba(80,50,20,.12)",
};
export const dark = {
  bg:"#1A1714",bgS:"#242018",card:"#2C2720",pri:"#C49A6C",priL:"#DEB98E",priD:"#8B6B45",
  txt:"#E8E0D6",txtM:"#9C8E7E",txtF:"#5C5248",brd:"#3A3530",
  err:"#E8695E",errBg:"#3A2220",ok:"#5CB880",okBg:"#1E2E22",
  sh:"0 1px 6px rgba(0,0,0,.2)",shH:"0 4px 16px rgba(0,0,0,.3)",
};

export const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap";

export const vib = (ms = 15) => { try { navigator?.vibrate?.(ms) } catch (e) {} };
export const vibWin = () => { try { navigator?.vibrate?.([50, 50, 50, 50, 100]) } catch (e) {} };
export const clone = (v) => JSON.parse(JSON.stringify(v));
export const fmtDate = () => { const d = new Date(); return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}` };
export const bajadaReq = (score) => score >= 2000 ? 120 : score >= 1000 ? 90 : 50;

export async function initWakeLock() { try { if ("wakeLock" in navigator) return await navigator.wakeLock.request("screen"); } catch (e) {} return null; }

export const ST = {
  async save(k, v) {
    const json = JSON.stringify(v);
    try { localStorage.setItem(k, json) } catch (e) {}
    try { await window.storage?.set?.(k, json) } catch (e) {}
  },
  async load(k) {
    try { const r = await window.storage?.get?.(k); if (r?.value) return JSON.parse(r.value); } catch (e) {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  },
  async del(k) {
    try { localStorage.removeItem(k) } catch (e) {}
    try { await window.storage?.delete?.(k) } catch (e) {}
  },
};

export async function shareResult(title, lines) {
  const text = title + "\n" + lines.join("\n");
  try {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#F7F3EE"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#2C1810"; ctx.font = "800 72px system-ui, -apple-system, sans-serif";
    const tw = ctx.measureText(title).width; ctx.fillText(title, (c.width - tw) / 2, 200);
    ctx.strokeStyle = "#D8CFC5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(200, 240); ctx.lineTo(c.width - 200, 240); ctx.stroke();
    ctx.fillStyle = "#6B4E30"; ctx.font = "600 44px system-ui, -apple-system, sans-serif";
    let y = 310; lines.slice(0, 6).forEach(l => { const w = ctx.measureText(l).width; ctx.fillText(l, (c.width - w) / 2, y); y += 58; });
    ctx.fillStyle = "#B9AA9A"; ctx.font = "500 26px system-ui, -apple-system, sans-serif"; ctx.fillText("puntos", c.width - 180, c.height - 48);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const file = new File([blob], "marcador.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ title, files: [file] }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { if (navigator.share) { await navigator.share({ title, text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); alert("Copiado ✓"); return; } catch (e) {}
  prompt("Copiá el resultado:", text);
}

export const GAMES = { truco: { name: "Truco", emoji: "🂡" }, burako: { name: "Burako", emoji: "🃏" }, generala: { name: "Generala", emoji: "🎲" } };
