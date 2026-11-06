import { useEffect, useId, useRef, useState } from 'react';
import type { Language } from '../../types';
import { LanguageToggle } from '../../components/LanguageToggle';
import { GuestChallenge } from '../../components/GuestChallenge';
import { getFeatureFlags } from '../../utils/featureFlags';
import { useVisitorMotion } from '../faith-moments/useVisitorMotion';
import QuietGarden from './QuietGarden';
import './quiet-presence.css';

export default function QuietGardenDialog({ language, onLanguageChange, onClose }: { language: Language; onLanguageChange: (language: Language) => void; onClose: () => void }) {
  const flags = getFeatureFlags();
  const [captchaToken, setCaptchaToken] = useState<string>();
  const [challengeReset, setChallengeReset] = useState(0);
  const visitor = useVisitorMotion();
  const dialog = useRef<HTMLDivElement>(null), close = useRef<HTMLButtonElement>(null);
  const heading = useId();
  const zh = language === 'zh';
  useEffect(() => {
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus();
    const contain = (event: FocusEvent) => { if (event.target instanceof Node && !dialog.current?.contains(event.target)) close.current?.focus(); };
    document.addEventListener('focusin', contain);
    return () => { document.body.style.overflow = previous; document.removeEventListener('focusin', contain); };
  }, []);
  return <div className="garden-overlay"><div className="garden-dialog" role="dialog" aria-modal="true" aria-labelledby={heading} ref={dialog} onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button, a[href], input, textarea, select, iframe, [tabindex]') ?? [])].filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[hidden]') && getComputedStyle(element).display !== 'none');
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
  }}>
    <header className="garden-dialog-header"><button className="text-button" ref={close} onClick={onClose}>{zh ? '返回原本的探索' : 'Return to exploration'}</button><h1 id={heading}>{zh ? '靜心庭院' : 'Quiet Garden'}</h1><LanguageToggle language={language} onChange={onLanguageChange} /></header>
    <p className="garden-service-notice">{zh ? '共享功能需匿名服務工作階段，無需填寫帳號。這個中性庭院不分享你正在探索的教別或場所。' : 'Shared features use an anonymous service session without an account form. This neutral garden never shares the religion or place you are exploring.'}</p>
    <div className="garden-motion-control"><button className="text-button" aria-pressed={visitor.motionEnabled} onClick={() => visitor.setMotionEnabled(!visitor.motionEnabled)}>{zh ? visitor.motionEnabled ? '動畫：開啟' : '動畫：關閉' : visitor.motionEnabled ? 'Animation: On' : 'Animation: Off'}</button></div>
    <QuietGarden language={language} onClose={onClose} enabled={flags.quietPresence} motionEnabled={visitor.motionEnabled} captchaToken={captchaToken}
      onCaptchaConsumed={() => { setCaptchaToken(undefined); setChallengeReset(value => value + 1); }}
      challenge={<GuestChallenge language={language} action="quiet-garden" onToken={setCaptchaToken} resetKey={challengeReset} autoStart />} />
  </div></div>;
}
