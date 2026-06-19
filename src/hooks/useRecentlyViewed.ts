import { useEffect, useState, useCallback } from 'react';

const KEY = 'recently_viewed_v1';
const MAX = 12;

const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<string[]>(() => read());

  useEffect(() => {
    const onStorage = () => setIds(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((id: string) => {
    const current = read().filter(x => x !== id);
    const next = [id, ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    setIds(next);
  }, []);

  return { ids, add };
};
