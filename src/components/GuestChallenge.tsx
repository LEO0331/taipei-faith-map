/// <reference types="vite/client" />
import { useEffect, useRef, useState } from 'react';
import type { Language } from '../types';

type ChallengeAction = 'quiet-garden' | 'quiet-note' | 'quiet-report';
type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string; action: ChallengeAction; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void; theme: 'light' }) => string;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
let loader: Promise<Turnstile> | undefined;

function loadChallenge(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) loader = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true; script.referrerPolicy = 'no-referrer';
    const timeout = setTimeout(() => fail(), 8000);
    const cleanup = () => { clearTimeout(timeout); script.onload = null; script.onerror = null; };
    const fail = () => { cleanup(); script.remove(); loader = undefined; reject(new Error('Verification unavailable')); };
    script.onerror = fail;
    script.onload = () => { if (!window.turnstile) { fail(); return; } cleanup(); resolve(window.turnstile); };
    document.head.append(script);
  });
  return loader;
}

/** Mounted only in an explicitly opened shared feature, never in solo exploration. */
export function GuestChallenge({ language, action, onToken, resetKey = 0, autoStart = false, siteKey = import.meta.env.VITE_SUPABASE_TURNSTILE_SITE_KEY }: {
  language: Language; action: ChallengeAction; onToken: (token: string | undefined) => void; resetKey?: number; autoStart?: boolean; siteKey?: string;
}) {
  const [started, setStarted] = useState(autoStart);
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'unavailable'>('idle');
  const holder = useRef<HTMLDivElement>(null);
  const report = useRef(onToken); report.current = onToken;
  useEffect(() => {
    report.current(undefined);
    if (!started) return;
    if (!siteKey || !/^[A-Za-z0-9_-]{8,200}$/.test(siteKey)) { setStatus('unavailable'); return; }
    let active = true, widget: string | undefined, provider: Turnstile | undefined;
    setStatus('checking');
    loadChallenge().then(api => {
      if (!active || !holder.current) return;
      provider = api;
      try {
        widget = api.render(holder.current, { sitekey: siteKey, action, theme: 'light',
          callback: token => { if (active && typeof token === 'string' && token.length <= 4096) { report.current(token); setStatus('ready'); } },
          'expired-callback': () => { if (active) { report.current(undefined); setStatus('unavailable'); } },
          'error-callback': () => { if (active) { report.current(undefined); setStatus('unavailable'); } },
        });
      } catch { setStatus('unavailable'); }
    }).catch(() => { if (active) setStatus('unavailable'); });
    return () => { active = false; if (widget) provider?.remove(widget); report.current(undefined); };
  }, [action, siteKey, started, resetKey, retry]);
  const zh = language === 'zh';
  return <div className="guest-challenge">
    <div ref={holder} />
    {status === 'checking' && <p role="status">{zh ? '正在進行訪客驗證…' : 'Checking guest access…'}</p>}
    {status === 'ready' && <p>{zh ? '驗證完成。' : 'Verification complete.'}</p>}
    {status === 'unavailable' && <p>{zh ? '訪客驗證目前無法使用，共享功能可稍後再試。' : 'Guest verification is unavailable. You can try shared features later.'}</p>}
    {(!started || status === 'unavailable') && <button type="button" className="text-button" onClick={() => { setStarted(true); setRetry(value => value + 1); }}>{zh ? '完成訪客驗證' : 'Verify guest access'}</button>}
  </div>;
}
