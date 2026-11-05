import { useCallback, useEffect, useRef, useState } from 'react';

export type VisitorAction = 'idle' | 'walk' | 'sit' | 'wave' | 'observe';
export type VisitorPosition = { x: number; y: number };
export type VisitorTarget = VisitorPosition & { id?: string };
export type MotionPreference = 'on' | 'off' | null;
export const MOTION_STORAGE_KEY = 'taipei-faith-map-motion';
const CHANGE_EVENT = 'taipei-faith-map-motion-change';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const VISITOR_TIMING = { walk: 600, wave: 500, sit: 350, observe: 500 } as const;

function readPreference(): MotionPreference {
  try {
    const value = localStorage.getItem(MOTION_STORAGE_KEY);
    return value === 'on' || value === 'off' ? value : null;
  } catch { return null; }
}

function requestsReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches;
}

export function useVisitorMotion() {
  const [preference, setPreference] = useState<MotionPreference>(readPreference);
  const [reducedMotion, setReducedMotion] = useState(requestsReducedMotion);
  const [action, setAction] = useState<VisitorAction>('idle');
  const [position, setPosition] = useState<VisitorPosition>({ x: 50, y: 83 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const generation = useRef(0);
  const motionEnabled = preference !== 'off' && !reducedMotion;

  const cancel = useCallback(() => {
    generation.current++;
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);
  const skip = useCallback(() => { cancel(); setAction('idle'); }, [cancel]);
  const schedule = useCallback((delay: number, callback: () => void) => {
    const expected = generation.current;
    const timer = setTimeout(() => {
      timers.current = timers.current.filter(value => value !== timer);
      if (expected === generation.current) callback();
    }, delay);
    timers.current.push(timer);
  }, []);

  useEffect(() => {
    const sync = (event: Event) => {
      const value = event instanceof CustomEvent ? event.detail : readPreference();
      setPreference(value === 'on' || value === 'off' ? value : null);
    };
    window.addEventListener(CHANGE_EVENT, sync);
    const storage = (event: StorageEvent) => { if (event.key === MOTION_STORAGE_KEY || event.key === null) setPreference(readPreference()); };
    window.addEventListener('storage', storage);
    if (typeof window.matchMedia !== 'function') return () => {
      window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener('storage', storage);
    };
    const media = window.matchMedia(REDUCED_QUERY);
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync); window.removeEventListener('storage', storage);
      media.removeEventListener('change', update);
    };
  }, []);
  useEffect(() => { if (!motionEnabled) skip(); }, [motionEnabled, skip]);
  useEffect(() => cancel, [cancel]);

  const setMotionEnabled = useCallback((enabled: boolean) => {
    const next = enabled ? 'on' : 'off';
    setPreference(next);
    try { localStorage.setItem(MOTION_STORAGE_KEY, next); } catch { /* Storage is optional. */ }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
    if (!enabled) skip();
  }, [skip]);

  const walkTo = useCallback((target: VisitorTarget) => {
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) return;
    cancel();
    // Stay on the illustrative foreground plane instead of climbing roof objects.
    setPosition({ x: Math.min(88, Math.max(12, target.x)), y: Math.min(86, Math.max(72, target.y + 14)) });
    if (!motionEnabled) { setAction('observe'); return; }
    setAction('walk');
    schedule(VISITOR_TIMING.walk, () => {
      setAction('observe');
      schedule(VISITOR_TIMING.observe, () => setAction('idle'));
    });
  }, [cancel, motionEnabled, schedule]);

  const perform = useCallback((next: VisitorAction) => {
    cancel();
    if (next === 'walk') {
      setPosition(current => ({ ...current, x: current.x >= 50 ? current.x - 8 : current.x + 8 }));
    }
    setAction(next);
    // Sitting remains a quiet static pose; other gestures settle once into idle.
    if (motionEnabled && next !== 'sit' && next !== 'idle') schedule(VISITOR_TIMING[next], () => setAction('idle'));
  }, [cancel, motionEnabled, schedule]);

  return { action, position, motionEnabled, preference, reducedMotion, setMotionEnabled, walkTo, perform, skip };
}

export type VisitorMotionController = ReturnType<typeof useVisitorMotion>;
