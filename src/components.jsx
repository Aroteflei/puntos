import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './context';
import { vib } from './config';

export function B({ children, onClick, disabled, v = "pri", s, ...r }) {
  const { t, sounds } = useApp();
  const vars = { pri: { background: t.pri, color: "#fff", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,.1)" },
    out: { background: "transparent", color: t.pri, border: `1.5px solid ${t.pri}`, boxShadow: "none" },
    err: { background: "transparent", color: t.err, border: `1.5px solid ${t.err}`, boxShadow: "none" },
    gh: { background: t.bgS, color: t.txt, border: `1px solid ${t.brd}`, boxShadow: "none" } };
  const handle = () => { if (!disabled && onClick) { if (sounds) vib(); onClick() } };
  return <button onClick={handle} disabled={disabled} style={{ borderRadius: 12, padding: "12px 18px", minHeight: 44, fontSize: 15, fontWeight: 700,
    fontFamily: "'DM Sans'", cursor: disabled ? "default" : "pointer", transition: "all .15s", opacity: disabled ? .35 : 1, touchAction: "manipulation", ...vars[v], ...s }} {...r}>{children}</button>;
}

export function EN({ name, onSave, sz = 18 }) {
  const { t } = useApp(); const [ed, setEd] = useState(false); const [val, setVal] = useState(name);
  useEffect(() => setVal(name), [name]);
  if (ed) return <input autoFocus value={val} onChange={e => setVal(e.target.value)} onBlur={() => { onSave(val); setEd(false) }}
    onKeyDown={e => { if (e.key === "Enter") { onSave(val); setEd(false) } }}
    style={{ background: t.bgS, border: `1.5px solid ${t.pri}`, color: t.txt, fontSize: sz, fontWeight: 600, fontFamily: "'Playfair Display'",
      borderRadius: 8, padding: "2px 8px", outline: "none", width: "100%" }} />;
  return <span onClick={() => setEd(true)} style={{ fontSize: sz, fontWeight: 600, color: t.txt, cursor: "pointer",
    fontFamily: "'Playfair Display'" }}>{name} <span style={{ fontSize: 10, color: t.txtF }}>✎</span></span>;
}

export function IcoBtn({ onClick, children }) {
  const { t } = useApp();
  return <button onClick={onClick} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt,
    borderRadius: 12, width: 48, height: 48, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>{children}</button>;
}

export function Hdr({ title, emoji, onBack, sub, icons }) {
  const { t } = useApp();
  return <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${t.brd}` }}>
    <button onClick={onBack} style={{ background: t.card, border: `1px solid ${t.brd}`, color: t.txt, fontSize: 16, borderRadius: 10,
      width: 48, height: 48, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "manipulation" }}>←</button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontFamily: "'Playfair Display'", fontSize: 20, color: t.pri, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      {sub && <p style={{ margin: "1px 0 0 26px", fontSize: 11, color: t.txtM }}>{sub}</p>}
    </div>
    {icons && <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>{icons}</div>}
  </div>;
}

export function NI({ label, value, onChange, step = 1, min, hint }) {
  const { t } = useApp();
  const [raw, setRaw] = useState(String(value)); useEffect(() => setRaw(String(value)), [value]);
  const commit = (v) => { const n = v === "" || v === "-" ? 0 : Number(v); onChange(min !== undefined ? Math.max(min, n) : n) };
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
    <div><span style={{ fontSize: 13 }}>{label}</span>{hint && <span style={{ fontSize: 10, color: t.txtF, marginLeft: 4 }}>{hint}</span>}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <button onClick={() => onChange(min !== undefined ? Math.max(min, value - step) : value - step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 44, height: 44, borderRadius: 10, cursor: "pointer", fontSize: 18, touchAction: "manipulation" }}>−</button>
      <input type="number" value={raw} onChange={e => setRaw(e.target.value)} onBlur={() => commit(raw)} onKeyDown={e => { if (e.key === "Enter") commit(raw) }} onFocus={e => e.target.select()}
        style={{ width: 64, minHeight: 44, textAlign: "center", background: t.card, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 6, padding: 2, fontSize: 14, fontFamily: "'DM Sans'", outline: "none" }} />
      <button onClick={() => onChange(value + step)} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, width: 44, height: 44, borderRadius: 10, cursor: "pointer", fontSize: 18, touchAction: "manipulation" }}>+</button>
    </div></div>;
}

export function Modal({ children, onClose }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ maxWidth: 340, width: "100%" }}>{children}</div></div>;
}

export function UndoBar({ toast, onUndo, onClose }) {
  const { t, L } = useApp();
  useEffect(() => { if (!toast) return; const id = setTimeout(() => onClose?.(), 2500); return () => clearTimeout(id); }, [toast, onClose]);
  if (!toast) return null;
  return <div style={{ position: "fixed", left: 12, right: 12, top: 68, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
    <div style={{ pointerEvents: "auto", maxWidth: 320, width: "auto", background: t.card, border: `1px solid ${t.brd}`, boxShadow: t.shH, borderRadius: 10, padding: "5px 10px", display: "flex", alignItems: "center", gap: 8, opacity: 0.95 }}>
      <div style={{ fontSize: 12, color: t.txtM, whiteSpace: "nowrap" }}>{toast.text}</div>
      {toast.redo && <button onClick={() => { toast.redo?.(); onClose?.(); }} style={{ background: t.bgS, border: `1px solid ${t.brd}`, color: t.txt, borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.redo}</button>}
      {toast.undo && <button onClick={() => { onUndo?.(); onClose?.(); }} style={{ background: t.pri, border: "none", color: "#fff", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans'", whiteSpace: "nowrap" }}>{L.undo}</button>}
    </div>
  </div>;
}

// ─── TALLY (hand-drawn, stable offsets) ────────
export function Tally({ count, color, divAt }) {
  const s = 44, p = 4, gap = 8;
  const offsets = useMemo(() => { const arr = []; for (let i = 0; i < 60; i++) arr.push((Math.random() - .5) * 1.5); return arr; }, [count]);
  let oi = 0; const r = () => offsets[oi++ % offsets.length];
  const els = []; let drawn = 0, divDone = !divAt;
  const sq = (k) => <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ animation: "popIn .25s ease" }}>
    <rect x={p+r()} y={p+r()} width={s-p*2+r()} height={s-p*2+r()} fill="none" stroke={color} strokeWidth="2.2" rx="1" opacity=".8" />
    <line x1={p+1+r()} y1={s-p-1+r()} x2={s-p-1+r()} y2={p+1+r()} stroke={color} strokeWidth="2.2" opacity=".8" /></svg>;
  const part = (n, k) => { const l = [];
    if(n>=1) l.push(<line key="l" x1={p+r()} y1={p+r()} x2={p+r()} y2={s-p+r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if(n>=2) l.push(<line key="b" x1={p+r()} y1={s-p+r()} x2={s-p+r()} y2={s-p+r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if(n>=3) l.push(<line key="r" x1={s-p+r()} y1={s-p+r()} x2={s-p+r()} y2={p+r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    if(n>=4) l.push(<line key="t" x1={s-p+r()} y1={p+r()} x2={p+r()} y2={p+r()} stroke={color} strokeWidth="2.2" strokeLinecap="round" opacity=".8" />);
    return <svg key={k} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{l}</svg> };
  const div = <div key="div" style={{ display:"flex",alignItems:"center",gap:0,margin:"8px 0",width:"100%",padding:"4px 0" }}>
    <div style={{ flex:1,height:2,background:"linear-gradient(90deg, transparent, #C0392B)",borderRadius:2 }} />
    <span style={{ fontSize:9,color:"#C0392B",fontWeight:700,letterSpacing:1.5,padding:"0 8px",whiteSpace:"nowrap" }}>BUENAS</span>
    <div style={{ flex:1,height:2,background:"linear-gradient(270deg, transparent, #C0392B)",borderRadius:2 }} /></div>;
  while(drawn<count){const rem=count-drawn,batch=Math.min(5,rem);
    if(!divDone&&drawn<divAt&&drawn+batch>divAt){const b=divAt-drawn;if(b>0){els.push(b===5?sq(`s${drawn}`):part(b,`p${drawn}`));drawn+=b}els.push(div);divDone=true;continue}
    if(!divDone&&drawn+batch===divAt){els.push(batch===5?sq(`s${drawn}`):part(batch,`p${drawn}`));drawn+=batch;els.push(div);divDone=true;continue}
    els.push(batch===5?sq(`s${drawn}`):part(batch,`p${drawn}`));drawn+=batch}
  return <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",gap,minHeight:24,padding:"2px 0" }}>
    {els.length>0?els:<span style={{ color,opacity:.3,fontSize:12 }}>—</span>}</div>;
}
