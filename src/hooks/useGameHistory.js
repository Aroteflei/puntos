import { useState, useEffect, useCallback } from 'react';
import { ST } from '../lib.jsx';

export function useGameHistory(key) {
  const [hist, setHist] = useState([]);
  const [showH, setShowH] = useState(false);

  useEffect(() => {
    ST.load(key).then(d => { if (Array.isArray(d)) setHist(d) });
  }, [key]);

  const addEntry = useCallback(async (entry) => {
    const next = [entry, ...hist];
    setHist(next);
    await ST.save(key, next);
  }, [key, hist]);

  const delEntry = useCallback(async (i) => {
    const next = hist.filter((_, j) => j !== i);
    setHist(next);
    if (next.length) await ST.save(key, next);
    else await ST.del(key);
  }, [key, hist]);

  return { hist, showH, setShowH, addEntry, delEntry };
}
