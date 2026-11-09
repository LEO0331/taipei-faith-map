import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../../types';
import { joinQuietGarden } from './presenceClient';
import type { GardenConnection } from './presenceClient';
import type { GardenGesture, PresenceState } from './presenceTypes';
import { GARDEN_JOIN_TIMEOUT_MS } from './presenceTypes';
import { QuietVerificationRequiredError } from '../../services/supabaseClient';
import GardenScene, { GARDEN_DEFAULT_SEAT, GARDEN_DEFAULT_BENCH } from './GardenScene';
import './quiet-presence.css';

const labels = {
  zh: { title: '靜心庭院', introduction: '可以安靜停留，也可以輕輕打個招呼。', enter: '進入靜心庭院', leave: '離開共享庭院', close: '返回原本的探索', connecting: '正在連接庭院…', reconnecting: '共享連線暫時中斷，正在短暫等待恢復。', empty: '此刻庭院裡沒有其他連線訪客。', others: '其他連線訪客', privacy: '這裡只分享短暫的中性動作，不分享教別、場所、地點或閱讀紀錄。', idle: '自在停留', sit: '坐一會兒', wave: '揮手', acknowledge: '回應問候', pause: '共享連線已在背景暫停。可自行再次進入。', unavailable: '共享空間目前無法使用，仍可自由探索。', disabled: '共享陪伴目前未啟用。' },
  en: { title: 'Quiet Garden', introduction: 'Stay quietly, or exchange a gentle greeting.', enter: 'Enter Quiet Garden', leave: 'Leave shared garden', close: 'Return to exploration', connecting: 'Connecting to the garden…', reconnecting: 'The shared connection is interrupted; waiting briefly to reconnect.', empty: 'No other visitors are connected here right now.', others: 'Other connected visitors', privacy: 'Only temporary neutral gestures are shared, never religions, places, locations or reading history.', idle: 'Rest freely', sit: 'Sit quietly', wave: 'Wave', acknowledge: 'Acknowledge a greeting', pause: 'The shared connection was paused in the background. You may enter again yourself.', unavailable: 'Shared presence is temporarily unavailable. Solo exploration remains available.', disabled: 'Shared companionship is not enabled.' },
};

const actionMessages = {
  zh: {
    gesture: { wave: '你揮了揮手。', sit: '你選了一處坐下。', idle: '你正在自在停留。' },
    sync: { pending: '正在分享動作…', shared: '動作已送到庭院。', failed: '角色已回應，暫時無法分享動作。' },
    retry: '再試一次',
  },
  en: {
    gesture: { wave: 'You offered a wave. ', sit: 'You found a place to sit. ', idle: 'You are resting freely. ' },
    sync: { pending: 'Sharing your action…', shared: 'Your action reached the garden.', failed: 'Your character responded. Sharing is temporarily unavailable.' },
    retry: 'Try sharing again',
  },
};

export default function QuietGarden({ language, onClose, enabled = false, captchaToken, onCaptchaConsumed, challenge, notesSlot, motionEnabled = true }: { language: Language; onClose: () => void; enabled?: boolean; captchaToken?: string; onCaptchaConsumed?: () => void; challenge?: ReactNode; notesSlot?: ReactNode; motionEnabled?: boolean }) {
  const t = labels[language];
  const actions = actionMessages[language];
  const [status, setStatus] = useState<'idle' | 'verification' | 'joining' | 'connected' | 'reconnecting' | 'paused' | 'unavailable'>('idle');
  const [peers, setPeers] = useState<PresenceState[]>([]);
  const [ownGesture, setOwnGesture] = useState<GardenGesture>('idle');
  const [ownGuestKey, setOwnGuestKey] = useState<string>();
  const [ownSeatId, setOwnSeatId] = useState<NonNullable<PresenceState['seatId']>>(GARDEN_DEFAULT_SEAT);
  const [ownMoving, setOwnMoving] = useState(false);
  const [ownWaveKey, setOwnWaveKey] = useState(0);
  const [feedback, setFeedback] = useState<{ gesture: GardenGesture; sync: 'pending' | 'shared' | 'failed' }>();
  const [greeting, setGreeting] = useState(false);
  const connection = useRef<GardenConnection | undefined>(undefined);
  const controller = useRef<AbortController | undefined>(undefined);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const generation = useRef(0);
  const actionSequence = useRef(0);
  const restingPose = useRef<'sit' | 'idle'>('idle');
  const localSeat = useRef<NonNullable<PresenceState['seatId']>>(GARDEN_DEFAULT_SEAT);
  const waveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const greetingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const waveButton = useRef<HTMLButtonElement>(null);
  const acknowledgeButton = useRef<HTMLButtonElement>(null);
  const lastRequest = useRef<{ gesture: GardenGesture; seatId?: NonNullable<PresenceState['seatId']> } | undefined>(undefined);

  const clear = () => { for (const timer of timers.current) clearTimeout(timer); timers.current.clear(); };
  const cancelTimer = (timer: ReturnType<typeof setTimeout> | undefined) => { if (timer) { clearTimeout(timer); timers.current.delete(timer); } };
  const later = (delay: number, callback: () => void) => {
    const timer = setTimeout(() => { timers.current.delete(timer); callback(); }, delay);
    timers.current.add(timer); return timer;
  };
  const leave = () => {
    ++generation.current; ++actionSequence.current; controller.current?.abort(); controller.current = undefined;
    const current = connection.current; connection.current = undefined; void current?.leave();
    clear(); setPeers([]); setGreeting(false); setOwnGesture('idle'); setOwnGuestKey(undefined); setOwnMoving(false); setOwnWaveKey(0); setFeedback(undefined);
    restingPose.current = 'idle'; localSeat.current = GARDEN_DEFAULT_SEAT; setOwnSeatId(GARDEN_DEFAULT_SEAT); lastRequest.current = undefined;
  };
  useEffect(() => {
    const hidden = () => { if (document.hidden && (controller.current || connection.current)) { leave(); setStatus('paused'); } };
    document.addEventListener('visibilitychange', hidden);
    return () => { ++generation.current; ++actionSequence.current; controller.current?.abort(); void connection.current?.leave(); clear(); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  useEffect(() => { if (!enabled) { leave(); setStatus('idle'); } }, [enabled]);

  const enter = async () => {
    if (!enabled || status === 'joining') return;
    leave(); const active = ++generation.current;
    const abort = new AbortController(); controller.current = abort; setStatus('joining');
    const deadline = setTimeout(() => {
      timers.current.delete(deadline);
      if (active === generation.current) { leave(); setStatus('unavailable'); }
    }, GARDEN_JOIN_TIMEOUT_MS);
    timers.current.add(deadline);
    try {
      const joined = await joinQuietGarden({ captchaToken, onCaptchaConsumed, signal: abort.signal, onPeers: next => { if (active === generation.current) setPeers(next); },
        onStatus: next => { if (active === generation.current) { if (next === 'unavailable') leave(); if (next !== 'connected' || connection.current) setStatus(next); } },
        onGesture: event => {
          if (active !== generation.current || event.gesture !== 'wave') return;
          // Broadcast payloads are not proof of an individual sender's identity.
          // Offer a garden-wide greeting without animating a claimed peer.
          setGreeting(true);
          cancelTimer(greetingTimer.current);
          greetingTimer.current = later(3500, () => { if (active === generation.current) { if (document.activeElement === acknowledgeButton.current) waveButton.current?.focus(); setGreeting(false); } });
        } });
      if (active !== generation.current) { await joined.leave(); return; }
      clearTimeout(deadline); timers.current.delete(deadline);
      connection.current = joined; setOwnGuestKey(joined.guestKey); setStatus('connected');
    } catch (error) {
      clearTimeout(deadline); timers.current.delete(deadline);
      if (active === generation.current) {
        controller.current = undefined;
        setStatus(error instanceof QuietVerificationRequiredError ? 'verification' : 'unavailable');
        setPeers([]);
      }
    }
  };
  const perform = async (gesture: GardenGesture, seatId?: NonNullable<PresenceState['seatId']>) => {
    if (status !== 'connected') return;
    const active = generation.current, sequence = ++actionSequence.current;
    lastRequest.current = { gesture, seatId };
    // A local action is immediate; network acknowledgement only changes the
    // sharing feedback, never whether a visitor can see their own response.
    cancelTimer(waveTimer.current);
    if (seatId && seatId !== localSeat.current) {
      localSeat.current = seatId; setOwnSeatId(seatId); setOwnMoving(motionEnabled);
      cancelTimer(moveTimer.current);
      moveTimer.current = later(600, () => { if (active === generation.current) setOwnMoving(false); });
    }
    if (gesture !== 'wave') restingPose.current = gesture;
    setOwnGesture(gesture); setFeedback({ gesture, sync: 'pending' });
    if (gesture === 'wave') {
      setOwnWaveKey(value => value + 1);
      waveTimer.current = later(900, () => { if (active === generation.current) setOwnGesture(restingPose.current); });
    }
    let shared = false;
    try { shared = await (seatId ? connection.current?.perform(gesture, seatId) : connection.current?.perform(gesture)) ?? false; } catch { /* Keep local response and offer an explicit retry. */ }
    if (active === generation.current && sequence === actionSequence.current) setFeedback({ gesture, sync: shared ? 'shared' : 'failed' });
  };

  return <section className="quiet-garden" aria-label={t.title} data-motion={motionEnabled ? 'on' : 'off'}>
    <header className="garden-heading"><div><p className="garden-kicker">{language === 'zh' ? '一座小庭院，一段慢時光' : 'A LITTLE GARDEN, A SLOWER MOMENT'}</p><h2>{language === 'zh' ? '找一處樹蔭，坐一會兒。' : 'Find a little shade. Stay a while.'}</h2><p>{t.introduction}</p></div><span className="garden-connection-pill" data-connected={status === 'connected'}>{status === 'connected' ? language === 'zh' ? '已連線' : 'Connected' : status === 'reconnecting' ? language === 'zh' ? '重新連接中' : 'Reconnecting' : language === 'zh' ? '自在探索' : 'At your own pace'}</span></header>
    <GardenScene language={language} connected={status === 'connected'} motionEnabled={motionEnabled} ownGuestKey={ownGuestKey} ownGesture={ownGesture} ownRestingPose={restingPose.current} ownSeatId={ownSeatId} ownMoving={ownMoving} ownWaveKey={ownWaveKey} peers={peers} onChooseSeat={seat => void perform('sit', seat)} />
    {status === 'joining' && <p role="status">{t.connecting}</p>}
    {status === 'connected' || status === 'reconnecting' ? <>
      <div className="garden-presence-summary">{status === 'connected' ? <><p>{t.others}: {peers.length}</p>{peers.length === 0 && <p>{t.empty}</p>}</> : <p>{t.reconnecting}</p>}</div>
      <div className="quiet-garden-actions garden-action-dock" role="group" aria-label={language === 'zh' ? '你的庭院動作' : 'Your garden actions'}>
        <button disabled={status !== 'connected'} aria-disabled={status !== 'connected'} aria-pressed={restingPose.current === 'sit'} onClick={() => void perform('sit', ownSeatId === GARDEN_DEFAULT_SEAT ? GARDEN_DEFAULT_BENCH : ownSeatId)}><ActionIcon action="sit" />{t.sit}</button>
        <button ref={waveButton} disabled={status !== 'connected'} aria-disabled={status !== 'connected'} aria-pressed={ownGesture === 'wave'} onClick={() => void perform('wave')}><ActionIcon action="wave" />{t.wave}</button>
        <button disabled={status !== 'connected'} aria-disabled={status !== 'connected'} aria-pressed={ownGesture === 'idle'} onClick={() => void perform('idle', ownSeatId)}><ActionIcon action="idle" />{t.idle}</button>
        {greeting && <button ref={acknowledgeButton} disabled={status !== 'connected'} aria-disabled={status !== 'connected'} onClick={() => { cancelTimer(greetingTimer.current); setGreeting(false); void perform('wave'); }}>{t.acknowledge}</button>}
        <button className="garden-leave" onClick={() => { leave(); setStatus('idle'); }}>{t.leave}</button>
      </div>
      {greeting && <p className="garden-greeting">{language === 'zh' ? '庭院裡傳來一聲輕輕的問候。' : 'A gentle greeting arrives in the garden.'}</p>}
      {feedback && <div className="garden-action-feedback" data-sync={feedback.sync}>
        <span role="status">{actions.gesture[feedback.gesture]}{actions.sync[feedback.sync]}</span>
        {feedback.sync === 'failed' && <button className="text-button" disabled={status !== 'connected'} onClick={() => {
          const request = lastRequest.current;
          if (request) void perform(request.gesture, request.seatId);
        }}>{actions.retry}</button>}
      </div>}
    </> : <div className="garden-join-panel">{enabled ? <>{status === 'verification' && <div className="garden-verification"><p role="status">{language === 'zh' ? '進入前，請先完成訪客驗證。' : 'Please verify guest access before entering.'}</p>{challenge}</div>}<button className="primary-button" disabled={status === 'joining' || (status === 'verification' && !captchaToken)} onClick={() => void enter()}>{t.enter}</button></> : <p>{t.disabled}</p>}</div>}
    {status === 'unavailable' && <p>{t.unavailable}</p>}{status === 'paused' && <p>{t.pause}</p>}
    <p className="quiet-garden-privacy">{t.privacy}</p>
    {notesSlot}<button className="text-button garden-return" onClick={() => { leave(); onClose(); }}>{t.close}</button>
  </section>;
}

function ActionIcon({ action }: { action: GardenGesture }) {
  return <svg className="garden-action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{action === 'sit' ? <><path d="M5 11h14v4H5zM7 15v5m10-5v5M6 11V5h12v6" /></> : action === 'wave' ? <><path d="m8 13-2-3c-1-2 1-3 2-1l2 2V5c0-2 3-2 3 0v5l1-6c0-2 3-1 2 1l-1 6 2-4c1-2 3-1 2 1l-2 7c-2 6-7 7-10 2l-2-3c-1-2 1-3 3-1Z" /></> : <><path d="M4 17h16M8 17c-4-7-2-10 3-8 0-6 5-7 6-2 5-1 6 4 0 6-1 3-3 4-9 4Z" /></>}</svg>;
}
