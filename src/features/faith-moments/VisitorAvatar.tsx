import type { CSSProperties } from 'react';
import type { VisitorAction, VisitorPosition } from './useVisitorMotion';
import './faith-moments.css';

/** Original vector visitor. The illustration is decorative; actions have text controls. */
export function VisitorAvatar({ action, position, motionEnabled }: { action: VisitorAction; position: VisitorPosition; motionEnabled: boolean }) {
  const style = { left: `${position.x}%`, top: `${position.y}%` } as CSSProperties;
  return <div className={`faith-visitor visitor-${action}${motionEnabled ? ' visitor-motion' : ''}`} style={style} aria-hidden="true" data-visitor-action={action}>
    <svg viewBox="0 0 76 104" focusable="false">
      <ellipse className="visitor-shadow" cx="38" cy="97" rx="24" ry="5" fill="#182c29" opacity=".24" />
      <g className="visitor-figure">
        <g className="visitor-left-leg"><path d="M29 64 27 91" stroke="#374d4a" strokeWidth="10" strokeLinecap="round" /><path d="m25 94-8 2" stroke="#263b39" strokeWidth="7" strokeLinecap="round" /></g>
        <g className="visitor-right-leg"><path d="M45 64 48 91" stroke="#374d4a" strokeWidth="10" strokeLinecap="round" /><path d="m48 94 8 2" stroke="#263b39" strokeWidth="7" strokeLinecap="round" /></g>
        <path d="M23 40q15-9 30 0l-1 28q-14 6-29 0Z" fill="#b6bb95" stroke="#667b69" strokeWidth="1.5" />
        <path d="M38 43v24" stroke="#e4dfbb" strokeWidth="2" /><circle cx="41" cy="52" r="1.4" fill="#6b7d65" />
        <path className="visitor-left-arm" d="M24 43 18 63" stroke="#a7ae86" strokeWidth="8" strokeLinecap="round" />
        <path className="visitor-right-arm" d="M52 43 58 62" stroke="#a7ae86" strokeWidth="8" strokeLinecap="round" />
        <circle cx="18" cy="66" r="4.2" fill="#d9b493" /><circle className="visitor-right-hand" cx="59" cy="65" r="4.2" fill="#d9b493" />
        <path d="M28 39q10 5 20 0" fill="none" stroke="#8d735d" strokeWidth="3" />
        <circle cx="38" cy="25" r="14" fill="#dbb896" />
        <path d="M24 26q-4-22 15-21q17 1 14 23q-4-6-7-13q-8 10-22 11Z" fill="#3f4d42" />
        <path d="M31 29h1m11 0h1" stroke="#5c5445" strokeWidth="2" strokeLinecap="round" /><path d="M35 35q3 2 6 0" fill="none" stroke="#9f7860" strokeWidth="1.5" strokeLinecap="round" />
        <path d="m49 41-19 27" stroke="#887953" strokeWidth="3" /><rect x="17" y="60" width="16" height="17" rx="5" fill="#c6a66b" stroke="#9a8052" strokeWidth="1.5" />
      </g>
    </svg>
  </div>;
}
