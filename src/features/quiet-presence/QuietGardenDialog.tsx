import { useEffect, useId, useRef, useState } from 'react';
import type { Language } from '../../types';
import { LanguageToggle } from '../../components/LanguageToggle';
import { GuestChallenge } from '../../components/GuestChallenge';
import { getFeatureFlags } from '../../utils/featureFlags';
import QuietGarden from './QuietGarden';
import QuietCorner from '../quiet-corner/QuietCorner';
import './quiet-presence.css';

function dialogControls(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, summary, iframe, [tabindex]')].filter(control => {
    if (control.tabIndex < 0 || control.matches(':disabled') || control.closest('[hidden], [inert]')) return false;
    for (let ancestor: HTMLElement | null = control; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false;
      if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
        const summary = [...ancestor.children].find(child => child.tagName === 'SUMMARY');
        if (!summary?.contains(control)) return false;
      }
      if (ancestor === root) break;
    }
    return true;
  });
}

export default function QuietGardenDialog({ language, onLanguageChange, onClose }: { language: Language; onLanguageChange: (language: Language) => void; onClose: () => void }) {
  const flags = getFeatureFlags();
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [challengeReset, setChallengeReset] = useState(0);
  const [cornerOpen, setCornerOpen] = useState(false);
  const [noteToken, setNoteToken] = useState<string>();
  const [noteReset, setNoteReset] = useState(0);
  const cornerInvoker = useRef<HTMLButtonElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dialog = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const zh = language === 'zh';
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus();
    const contain = (event: FocusEvent) => { if (event.target instanceof Node && !dialog.current?.contains(event.target)) close.current?.focus(); };
    document.addEventListener('focusin', contain);
    return () => { document.body.style.overflow = previous; document.removeEventListener('focusin', contain); };
  }, []);
  return <div className="garden-overlay"><div className="garden-dialog" role="dialog" aria-modal="true" aria-labelledby={heading} ref={dialog} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = dialog.current ? dialogControls(dialog.current) : [];
    if (event.shiftKey && (document.activeElement === controls[0] || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
  }}>
    <header className="garden-dialog-header"><button className="text-button" ref={close} onClick={onClose}>{zh ? '返回原本的探索' : 'Return to exploration'}</button><h1 id={heading}>{zh ? '靜心庭院' : 'Quiet Garden'}</h1><LanguageToggle language={language} onChange={onLanguageChange} /></header>
    <p className="garden-service-notice">{zh ? '這是一處中性的共享庭院，可能遇見其他訪客。不必交談，隨時可以離開。你正在探索的教別與場所不會分享；只有進入陪伴或送出留言時才需要匿名訪客驗證。' : 'A neutral shared garden where other visitors may be present. No conversation is needed, and you can leave anytime. Your religion and place selections stay private. Guest verification is only needed to join, submit a note or report one.'}</p>
    {reducedMotion && <p className="garden-system-motion-note">{zh ? '依裝置偏好減少動態效果，所有動作仍可使用。' : 'Motion follows your device’s reduced-motion preference. All actions remain available.'}</p>}
    <QuietGarden language={language} onClose={onClose} enabled={flags.quietPresence} motionEnabled={!reducedMotion} captchaToken={captchaToken}
      notesSlot={flags.quietCorner && (cornerOpen ? <QuietCorner language={language} onClose={() => { setCornerOpen(false); setNoteToken(undefined); requestAnimationFrame(() => cornerInvoker.current?.focus()); }} captchaToken={noteToken}
        onResetCaptcha={() => { setNoteToken(undefined); setNoteReset(value => value + 1); }}
        challenge={action => <GuestChallenge key={action} language={language} action={action} onToken={setNoteToken} resetKey={noteReset} autoStart />} />
        : <button className="text-button" ref={cornerInvoker} onClick={() => setCornerOpen(true)}>{zh ? '開啟留言角落' : 'Open Quiet Corner'}</button>)}
      onCaptchaConsumed={() => { setCaptchaToken(undefined); setChallengeReset(value => value + 1); }}
      challenge={<GuestChallenge language={language} action="quiet-garden" onToken={setCaptchaToken} resetKey={challengeReset} autoStart />} />
  </div></div>;
}
