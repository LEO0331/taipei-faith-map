import { useId } from 'react';
import type { CSSProperties } from 'react';
import type { Language } from '../../types';
import type { GardenGesture, PresenceState } from './presenceTypes';
import { AVATAR_VARIANTS } from './presenceTypes';
import { GARDEN_DEFAULT_SEAT, GARDEN_SEATS, gardenSeat } from './gardenSceneModel';
import type { GardenSeatId } from './gardenSceneModel';

export { GARDEN_DEFAULT_SEAT, GARDEN_DEFAULT_BENCH, GARDEN_SEATS } from './gardenSceneModel';

type Props = {
  language: Language;
  connected: boolean;
  motionEnabled: boolean;
  ownGuestKey?: string;
  ownGesture: GardenGesture;
  ownRestingPose?: 'sit' | 'idle';
  ownSeatId: GardenSeatId;
  ownMoving: boolean;
  ownWaveKey: number;
  peers: PresenceState[];
  onChooseSeat: (seatId: GardenSeatId) => void;
};

/** A small original vector diorama. Only actual connected sessions become people. */
export default function GardenScene({ language, connected, motionEnabled, ownGuestKey, ownGesture, ownRestingPose = 'idle', ownSeatId = GARDEN_DEFAULT_SEAT, ownMoving, ownWaveKey, peers, onChooseSeat }: Props) {
  const id = useId().replace(/:/g, '');
  const zh = language === 'zh';
  const shownPeers = connected ? [...peers].sort((a, b) => a.guestKey.localeCompare(b.guestKey)).slice(0, 16) : [];
  const occupants = new Map<string, number>();
  const ownVariant = ownGuestKey ? AVATAR_VARIANTS[parseInt(ownGuestKey.slice(0, 2), 16) % AVATAR_VARIANTS.length] : 'sage';
  return <div className="garden-diorama" data-motion={motionEnabled ? 'on' : 'off'}>
    <div className="garden-scene-label" aria-hidden="true"><span>{zh ? '一方小小天地' : 'A LITTLE ROOM TO BREATHE'}</span><span>{zh ? '共用庭院' : 'SHARED GARDEN'}</span></div>
    <div className="quiet-garden-art garden-isometric-scene">
      <svg className="garden-landscape" viewBox="0 0 900 560" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#e6eee3"/><stop offset="1" stopColor="#f2efdf"/></linearGradient>
          <linearGradient id={`${id}-earth`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8b9e74"/><stop offset="1" stopColor="#6d835d"/></linearGradient>
          <linearGradient id={`${id}-water`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8bbdb6"/><stop offset="1" stopColor="#4d8d87"/></linearGradient>
          <linearGradient id={`${id}-leaf`} x1="0" x2="1" y2="1"><stop stopColor="#69896b"/><stop offset="1" stopColor="#365c4c"/></linearGradient>
          <radialGradient id={`${id}-light`}><stop stopColor="#fff9da" stopOpacity=".9"/><stop offset="1" stopColor="#fff9da" stopOpacity="0"/></radialGradient>
          <filter id={`${id}-shadow`} x="-25%" y="-25%" width="150%" height="170%"><feGaussianBlur stdDeviation="9"/></filter>
        </defs>
        <rect width="900" height="560" fill={`url(#${id}-sky)`}/>
        <ellipse cx="664" cy="128" rx="240" ry="174" fill={`url(#${id}-light)`}/>
        <path d="M87 379 454 169 823 379 454 550Z" fill="#334e3c" opacity=".12" filter={`url(#${id}-shadow)`}/>
        <path d="M80 330 450 120 820 330 450 531Z" fill="#a3b18c"/>
        <path d="M80 330 450 531 450 495 80 295Z" fill="#8e9479"/>
        <path d="M450 495 820 295 820 330 450 531Z" fill="#737f64"/>
        <path d="M80 295 450 85 820 295 450 495Z" fill="#c2cba8"/>
        <path d="M80 295 450 85 820 295 450 495Z" fill="none" stroke="#e2e5cd" strokeWidth="6" strokeLinejoin="round"/>
        <path d="M126 286 447 105 778 293 453 473Z" fill={`url(#${id}-earth)`}/>
        <path d="m126 286 321-181 86 49-326 179Z" fill="#a0b48a" opacity=".72"/>
        <path d="m225 343 113-62 79-45 76 39-94 53 149 82-95 54Z" fill="#d7c9a4"/>
        <path d="m324 279 138-78 182 99-88 51-141-76-63 36Z" fill="#ded1ae"/>
        <path d="m438 386 53-30 90 50-53 30Z" fill="#e9ddbd"/>
        <g fill="#f1e8ce" stroke="#b8ae91" strokeWidth="1.5"><path d="m329 385 28-15 26 14-28 16Z"/><path d="m370 408 27-15 26 14-28 16Z"/><path d="m411 432 27-15 26 14-28 16Z"/><path d="m388 207 24-13 22 12-24 14Z"/></g>
        <path d="M601 251c23-32 83-24 115-4 38 23 33 59-1 79-34 20-93 20-121-2-25-20-18-45 7-73Z" fill="#425e50" opacity=".14" transform="translate(0 7)"/>
        <path d="M601 241c23-32 83-24 115-4 38 23 33 59-1 79-34 20-93 20-121-2-25-20-18-45 7-73Z" fill="#d4d5bd" stroke="#dce0c8" strokeWidth="9"/>
        <path d="M612 246c18-23 66-20 91-5 30 18 27 43 0 59-27 15-72 15-93-1-19-15-17-34 2-53Z" fill={`url(#${id}-water)`}/>
        <g fill="none" stroke="#c8e0cb" strokeWidth="2" opacity=".7"><path d="M614 265q31-13 58 1"/><path d="M639 286q25 9 47-1"/></g>
        <g fill="#6d9774"><ellipse cx="691" cy="258" rx="12" ry="6"/><ellipse cx="626" cy="284" rx="9" ry="5"/></g><circle cx="693" cy="255" r="3" fill="#f0dec0"/>
        <g fill="#d0c7ab" stroke="#b0ad93" strokeWidth="1.5"><path d="m681 330 24-13 24 13-24 15Z"/><path d="m707 345 24-13 24 13-24 15Z"/><path d="m660 351 24-13 24 13-24 15Z"/></g>
        <Bench x={251} y={221}/><Bench x={581} y={245}/><Bench x={217} y={338}/><Bench x={542} y={431}/>
        <g fill="#c8b692"><path d="m417 366 29-16 31 17-29 16Z"/><path d="m417 366 31 17v8l-31-17Z" fill="#aa9c80"/><path d="m448 383 29-16v8l-29 16Z" fill="#948d73"/></g>
        <Tree x={208} y={201} scale={1.1} fill={`url(#${id}-leaf)`}/><Tree x={450} y={126} scale={.9} fill={`url(#${id}-leaf)`}/><Tree x={756} y={306} scale={.92} fill={`url(#${id}-leaf)`}/>
        <Tree x={139} y={308} scale={.66} fill="#5b7c5b"/><Tree x={684} y={210} scale={.65} fill="#75936c"/>
        <g fill="#67865d"><ellipse cx="287" cy="188" rx="22" ry="11"/><ellipse cx="517" cy="150" rx="26" ry="12"/><ellipse cx="735" cy="355" rx="24" ry="12"/><ellipse cx="222" cy="373" rx="27" ry="13"/><ellipse cx="557" cy="456" rx="24" ry="11"/></g>
        <g stroke="#68815a" strokeWidth="3" fill="none"><path d="M286 209v-24m0 14-13-12m13 4 12-13M555 177v-20m0 12-12-9m12 3 10-12M174 334v-22m0 13-11-8m11 3 10-10"/></g>
        <g fill="#e2b890"><circle cx="213" cy="366" r="4"/><circle cx="228" cy="370" r="4"/><circle cx="221" cy="360" r="3"/><circle cx="548" cy="451" r="4"/><circle cx="562" cy="448" r="3"/><circle cx="737" cy="350" r="3"/></g>
        <g fill="#e4e8d2" opacity=".6"><circle cx="336" cy="122" r="3"/><circle cx="588" cy="98" r="2"/><circle cx="799" cy="210" r="3"/></g>
      </svg>
      <div className="garden-seat-layer" role="group" aria-label={zh ? '選擇庭院裡的停留位置' : 'Choose a place in the garden'}>
        {GARDEN_SEATS.map(seat => <button key={seat.id} type="button" className="garden-seat-target" style={{ left: `${seat.x}%`, top: `${seat.y}%`, zIndex: Math.round(seat.y * 10) + 3 }}
          disabled={!connected} aria-label={`${zh ? '走到' : 'Go to'}${zh ? '' : ' '}${zh ? seat.zh : seat.en}`} aria-pressed={connected && ownSeatId === seat.id}
          onClick={() => onChooseSeat(seat.id)}><span className="garden-seat-ring" aria-hidden="true"/><span className="garden-seat-tooltip">{zh ? seat.zh : seat.en}</span></button>)}
      </div>
      {connected && <Visitor guestKey={ownGuestKey ?? 'own'} own language={language} gesture={ownGesture} restingPose={ownRestingPose} seatId={ownSeatId} variant={ownVariant} moving={ownMoving} waveKey={ownWaveKey} motionEnabled={motionEnabled} />}
      {shownPeers.map(peer => {
        const seat = gardenSeat(peer.seatId, peer.guestKey);
        const index = occupants.get(seat.id) ?? 0; occupants.set(seat.id, index + 1);
        return <Visitor key={peer.guestKey} guestKey={peer.guestKey} language={language} gesture={peer.gesture} seatId={peer.seatId} variant={peer.avatarVariant} offset={index} motionEnabled={motionEnabled} />;
      })}
    </div>
    <div className="garden-scene-caption"><span className="garden-scene-dot" aria-hidden="true"/><p>{connected ? zh ? '點一處停留，讓腳步慢下來。' : 'Choose a place. Let your footsteps slow down.' : zh ? '一方安靜的天地，等你自行走進來。' : 'A quiet little world, ready when you are.'}</p>{connected && peers.length > shownPeers.length && <span>{zh ? `另有 ${peers.length - shownPeers.length} 位連線訪客` : `${peers.length - shownPeers.length} more connected visitors`}</span>}</div>
  </div>;
}

function Bench({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><ellipse cx="16" cy="22" rx="49" ry="14" fill="#304936" opacity=".12"/><path d="m-35 0 16-9 72 39-16 9Z" fill="#bf9668"/><path d="m-35 0 72 39v9L-35 9Z" fill="#87684c"/><path d="m37 39 16-9v9l-16 9Z" fill="#705b45"/><path d="M-27 10v23m54 6v22M46 37v13" stroke="#6d5945" strokeWidth="7"/><path d="m-33-22 75 40v14l-75-40Z" fill="#a78159"/><path d="M-27-18v30M35 16v27" stroke="#765d45" strokeWidth="5"/><path d="m-29-17 66 35m-66-27 66 35" stroke="#c3a478" strokeWidth="2"/></g>;
}

function Tree({ x, y, scale, fill }: { x: number; y: number; scale: number; fill: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="9" rx="38" ry="14" fill="#294a38" opacity=".16"/><path d="M0 10v-85" stroke="#78664d" strokeWidth="11" strokeLinecap="round"/><path d="m0-43-17-18m17 8 18-19" stroke="#78664d" strokeWidth="6"/><path d="M-3-139C-57-122-65-55-26-39c-32 3-20 34 14 27 44 15 74-15 48-37 40-26 9-79-39-90Z" fill={fill}/><path d="M-13-116c-24 16-29 39-20 53" fill="none" stroke="#a3b28b" strokeWidth="5" strokeLinecap="round" opacity=".5"/></g>;
}

function Visitor({ guestKey, gesture, restingPose = 'idle', seatId, language, own = false, variant = 'sage', moving = false, waveKey = 0, offset = 0, motionEnabled }: { guestKey: string; gesture: GardenGesture; restingPose?: 'sit' | 'idle'; seatId?: GardenSeatId; language: Language; own?: boolean; variant?: PresenceState['avatarVariant']; moving?: boolean; waveKey?: number; offset?: number; motionEnabled: boolean }) {
  const seat = gardenSeat(seatId, guestKey);
  const pose = moving && gesture === 'sit' ? 'idle' : gesture;
  const seatedWave = !moving && gesture === 'wave' && restingPose === 'sit';
  const style = { left: `${seat.x + Math.min(offset, 4) * 1.3}%`, top: `${seat.y + Math.min(offset, 4) * .5}%`, zIndex: Math.round(seat.y * 10) + 2, '--garden-shirt': variant === 'clay' ? '#b4755e' : variant === 'ochre' ? '#bd9b57' : '#537c6c' } as CSSProperties;
  return <div className={`garden-visitor garden-gesture-${pose}${seatedWave ? ' garden-gesture-sit' : ''}${own ? ' garden-own' : ''}${moving ? ' garden-moving' : ''}`} style={style} aria-hidden="true" data-motion={motionEnabled ? 'on' : 'off'} data-seat={seat.id} data-variant={variant}>
    {own && <span className="garden-you-label">{language === 'zh' ? '你' : 'You'}</span>}
    <svg viewBox="0 0 64 96" focusable="false" key={pose === 'wave' ? `wave-${waveKey}` : 'rest'}>
      <ellipse cx="32" cy="87" rx="22" ry="7" fill="#2e493c" opacity=".19"/>
      <g className="garden-character-body">
        <path className="garden-left-leg" d="M24 65v19" stroke="#4d5147" strokeWidth="9" strokeLinecap="round"/><path className="garden-right-leg" d="M40 65v19" stroke="#4d5147" strokeWidth="9" strokeLinecap="round"/>
        <path d="M18 48Q32 40 46 48l3 23H15Z" fill="var(--garden-shirt)"/><path d="M20 50 13 65" stroke="#d8b995" strokeWidth="8" strokeLinecap="round"/>
        <g className="garden-visitor-arm"><path d="m44 51 9 13" stroke="#d8b995" strokeWidth="8" strokeLinecap="round"/><circle cx="54" cy="65" r="4" fill="#e1c2a1"/></g>
        <ellipse cx="32" cy="31" rx="17" ry="18" fill="#e1c2a1"/><path d="M15 30q-5-23 16-23 23-1 19 24-8-1-11-13-11 8-24 5Z" fill="#565044"/>
        <path d="M24 33h1m14 0h1" stroke="#5b5144" strokeWidth="3" strokeLinecap="round"/><path d="M29 40q4 3 8-1" stroke="#9b765f" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M23 50q9 5 18 0" stroke="#e1d9bb" strokeWidth="2" fill="none"/>
      </g>
    </svg>
    {pose === 'wave' && <span className="garden-wave-mark">✦</span>}
  </div>;
}
