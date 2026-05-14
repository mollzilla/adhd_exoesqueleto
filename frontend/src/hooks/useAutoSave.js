import { useEffect, useRef, useState } from 'react';

export function useAutoSave(key, data, intervalMs = 30_000) {
  const [lastSaved, setLastSaved] = useState(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const id = setInterval(() => {
      localStorage.setItem(key, JSON.stringify(dataRef.current));
      setLastSaved(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [key, intervalMs]);

  function loadDraft() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearDraft() {
    localStorage.removeItem(key);
  }

  function saveDraftNow() {
    localStorage.setItem(key, JSON.stringify(dataRef.current));
    setLastSaved(new Date());
  }

  return { lastSaved, loadDraft, clearDraft, saveDraftNow };
}
