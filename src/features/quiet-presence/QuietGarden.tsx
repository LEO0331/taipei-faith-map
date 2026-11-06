import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../../types';
import { joinQuietGarden } from './presenceClient';
import type { GardenConnection } from './presenceClient';
import type { GardenGesture, PresenceState } from './presenceTypes';
import { QuietVerificationRequiredError } from '../../services/supabaseClient';
import './quiet-presence.css';

const labels = {
  zh: { title: '靜心庭院', introduction: '可以安靜停留，也可以輕輕打個招呼。', enter: '進入靜心庭院', leave: '離開共享庭院', close: '返回原本的探索', connecting: '正在連接庭院…', reconnecting: '共享連線暫時中斷，正在短暫等待恢復。', empty: '此刻庭院裡沒有其他連線訪客。', others: '其他連線訪客', privacy: '這裡只分享短暫的中性動作，不分享教別、場所、地點或閱讀紀錄。', idle: '自在停留', sit: '坐一會兒', wave: '揮手', acknowledge: '回應問候', pause: '共享連線已在背景暫停。可自行再次進入。', unavailable: '共享空間目前無法使用，仍可自由探索。', disabled: '共享陪伴目前未啟用。' },
  en: { title: 'Quiet Garden', introduction: 'Stay quietly, or exchange a gentle greeting.', enter: 'Enter Quiet Garden', leave: 'Leave shared garden', close: 'Return to exploration', connecting: 'Connecting to the garden…', reconnecting: 'The shared connection is interrupted; waiting briefly to reconnect.', empty: 'No other visitors are connected here right now.', others: 'Other connected visitors', privacy: 'Only temporary neutral gestures are shared, never religions, places, locations or reading history.', idle: 'Rest freely', sit: 'Sit quietly', wave: 'Wave', acknowledge: 'Acknowledge a greeting', pause: 'The shared connection was paused in the background. You may enter again yourself.', unavailable: 'Shared presence is temporarily unavailable. Solo exploration remains available.', disabled: 'Shared companionship is not enabled.' },
};

export default function QuietGarden({ language, onClose, enabled = false, captchaToken, onCaptchaConsumed, challenge, notesSlot, motionEnabled = true }: { language: Language; onClose: () => void; enabled?: boolean; captchaToken?: string; onCaptchaConsumed?: () => void; challenge?: ReactNode; notesSlot?: ReactNode; motionEnabled?: boolean }) {
  const t = labels[language];
  const [status, setStatus] = useState<'idle' | 'verification' | 'joining' | 'connected' | 'reconnecting' | 'paused' | 'unavailable'>('idle');
  const [peers, setPeers] = useState<PresenceState[]>([]);
  const [ownGesture, setOwnGesture] = useState<GardenGesture>('idle');
  const [greeting, setGreeting] = useState(false);
  const connection = useRef<GardenConnection | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const generation = useRef(0);

  const clear = () => { for (const timer of timers.current) clearTimeout(timer); timers.current.clear(); };
  const leave = () => {
    ++generation.current; controller.current?.abort(); controller.current = undefined;
    const current = connection.current; connection.current = undefined; void current?.leave();
    clear(); setPeers([]); setGreeting(false); setOwnGesture('idle');
  };
  useEffect(() => {
    const hidden = () => { if (document.hidden && (controller.current || connection.current)) { leave(); setStatus('paused'); } };
    document.addEventListener('visibilitychange', hidden);
    return () => { ++generation.current; controller.current?.abort(); void connection.current?.leave(); clear(); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => { if (!enabled) { leave(); setStatus('idle'); } }, [enabled]);

  const enter = async () => {
    if (!enabled || status === 'joining') return;
    leave(); const active = ++generation.current;
    const abort = new AbortController(); controller.current = abort; setStatus('joining');
    const deadline = setTimeout(() => {
      timers.current.delete(deadline);
      if (active === generation.current) { leave(); setStatus('unavailable'); }
    }, 10_000);
    timers.current.add(deadline);
    try {
      const joined = await joinQuietGarden({ captchaToken, onCaptchaConsumed, signal: abort.signal, onPeers: next => { if (active === generation.current) setPeers(next); },
        onStatus: next => { if (active === generation.current) { if (next === 'unavailable') leave(); setStatus(next); } },
        onGesture: event => {
          if (active !== generation.current || event.gesture !== 'wave') return;
          // Broadcast payloads are not proof of an individual sender's identity.
          // Offer a garden-wide greeting without animating a claimed peer.
          setGreeting(true);
          const timer = setTimeout(() => { timers.current.delete(timer); if (active === generation.current) setGreeting(false); }, 650);
          timers.current.add(timer);
        } });
      if (active !== generation.current) { await joined.leave(); return; }
      clearTimeout(deadline); timers.current.delete(deadline);
      connection.current = joined; setStatus('connected');
    } catch (error) {
      clearTimeout(deadline); timers.current.delete(deadline);
      if (active === generation.current) {
        controller.current = undefined;
        setStatus(error instanceof QuietVerificationRequiredError ? 'verification' : 'unavailable');
        setPeers([]);
      }
    }
  };
  const perform = async (gesture: GardenGesture) => {
    if (status !== 'connected') return;
    const active = generation.current;
    const resting = ownGesture === 'sit' ? 'sit' : 'idle';
    if (!await connection.current?.perform(gesture)) return;
    if (active !== generation.current) return;
    setOwnGesture(gesture);
    if (gesture === 'wave') {
      const timer = setTimeout(() => { timers.current.delete(timer); if (active === generation.current) setOwnGesture(resting); }, 650);
      timers.current.add(timer);
    }
  };

  return <section className="quiet-garden" aria-label={t.title} data-motion={motionEnabled ? 'on' : 'off'}>
    <header><h2>{t.title}</h2><p>{t.introduction}</p></header>
    <div className="quiet-garden-art" aria-hidden="true">
      <svg viewBox="0 0 720 280" focusable="false"><path d="M0 0H720V280H0Z" fill="#e5eadb"/><path d="M0 155Q190 113 360 174Q540 218 720 145V280H0Z" fill="#a7bca3"/><path d="M0 230Q310 173 720 251V280H0Z" fill="#d5c9a9"/><g fill="#56765e"><path d="M66 171Q5 103 55 75Q105 93 66 171Z"/><path d="M641 184Q588 111 640 83Q696 108 641 184Z"/></g><g fill="#8c7960"><rect x="126" y="188" width="112" height="12" rx="3"/><path d="M137 200V224M227 200V224" stroke="#8c7960" strokeWidth="8"/><rect x="486" y="188" width="112" height="12" rx="3"/><path d="M497 200V224M587 200V224" stroke="#8c7960" strokeWidth="8"/></g></svg>
      {status === 'connected' && <GardenVisitor own gesture={ownGesture} index={0} />}
      {peers.map((peer, index) => <GardenVisitor key={peer.guestKey} gesture={peer.gesture} index={index + 1} variant={peer.avatarVariant} />)}
    </div>
    <p className="quiet-garden-privacy">{t.privacy}</p>
    {status === 'joining' && <p role="status">{t.connecting}</p>}
    {status === 'connected' || status === 'reconnecting' ? <>
      {status === 'connected' ? <><p>{t.others}: {peers.length}</p>{peers.length === 0 && <p>{t.empty}</p>}</> : <p>{t.reconnecting}</p>}
      <div className="quiet-garden-actions"><button aria-disabled={status !== 'connected'} onClick={() => void perform('sit')}>{t.sit}</button><button aria-disabled={status !== 'connected'} onClick={() => void perform('wave')}>{t.wave}</button><button aria-disabled={status !== 'connected'} onClick={() => void perform('idle')}>{t.idle}</button>{greeting && <button aria-disabled={status !== 'connected'} onClick={() => void perform('wave')}>{t.acknowledge}</button>}<button onClick={() => { leave(); setStatus('idle'); }}>{t.leave}</button></div>
    </> : <>{enabled ? <>{status === 'verification' && <div className="garden-verification"><p role="status">{language === 'zh' ? '進入前，請先完成訪客驗證。' : 'Please verify guest access before entering.'}</p>{challenge}</div>}<button className="primary-button" disabled={status === 'joining' || (status === 'verification' && !captchaToken)} onClick={() => void enter()}>{t.enter}</button></> : <p>{t.disabled}</p>}</>}
    {status === 'unavailable' && <p>{t.unavailable}</p>}{status === 'paused' && <p>{t.pause}</p>}
    {notesSlot}<button className="text-button" onClick={() => { leave(); onClose(); }}>{t.close}</button>
  </section>;
}

function GardenVisitor({ index, gesture, variant = 'sage', own = false }: { index: number; gesture: GardenGesture; variant?: PresenceState['avatarVariant']; own?: boolean }) {
  return <svg className={`garden-visitor garden-gesture-${gesture}${own ? ' garden-own' : ''}`} style={{ left: `${15 + index % 8 * 10}%`, top: `${55 + Math.floor(index / 8) % 3 * 11}%` }} viewBox="0 0 48 64" focusable="false" data-variant={variant}>
    <ellipse cx="24" cy="57" rx="17" ry="4" fill="#243b2d" opacity=".18"/><path d="M13 32Q24 24 35 32L37 50H11Z" fill={variant === 'clay' ? '#a46c55' : variant === 'ochre' ? '#b49451' : '#51766a'}/><circle cx="24" cy="20" r="11" fill="#d4ae86"/><path d="M13 19Q13 4 24 7Q37 6 35 20Q25 11 13 19" fill="#4d463b"/><path className="garden-visitor-arm" d="M34 34 42 42" fill="none" stroke="#d4ae86" strokeWidth="5" strokeLinecap="round"/><path d="M18 49V58M30 49V58" stroke="#4d463b" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
}
