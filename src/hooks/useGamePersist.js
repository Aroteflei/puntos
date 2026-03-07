import { useState, useEffect, useCallback } from 'react';
import { ST } from '../lib';

export function useGamePersist(key) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    ST.load(key).then(d => { setData(d); setLoading(false); });
  }, [key]);

  const save = useCallback(async (val) => {
    setData(val);
    await ST.save(key, val);
  }, [key]);

  const del = useCallback(async () => {
    setData(null);
    await ST.del(key);
  }, [key]);

  return { data, loading, save, del };
}
