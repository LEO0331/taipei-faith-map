import { Component, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../../types';
type Props = { language: Language; onClose: () => void };

export class QuietGardenBoundary extends Component<Props & { children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <QuietGardenStatus {...this.props} failed /> : this.props.children; }
}

export function QuietGardenStatus({ language, onClose, failed = false }: Props & { failed?: boolean }) {
  const control = useRef<HTMLButtonElement>(null);
  const [timedOut, setTimedOut] = useState(false);
  const zh = language === 'zh';
  useEffect(() => {
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; control.current?.focus();
    const contain = (event: FocusEvent) => { if (event.target !== control.current) control.current?.focus(); };
    document.addEventListener('focusin', contain);
    return () => { document.body.style.overflow = previous; document.removeEventListener('focusin', contain); };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 10_000);
    return () => clearTimeout(timer);
  }, []);
  return <div className="garden-loading" role="dialog" aria-modal="true" aria-label={zh ? '靜心庭院' : 'Quiet Garden'} onKeyDown={event => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') { event.preventDefault(); control.current?.focus(); }
  }}><div><p role="status">{failed || timedOut ? zh ? '共享空間目前無法使用，仍可自由探索。' : 'Shared presence is temporarily unavailable. Solo exploration remains available.' : zh ? '正在開啟靜心庭院…' : 'Opening Quiet Garden…'}</p>
    <button ref={control} className="text-button" onClick={onClose}>{zh ? '返回原本的探索' : 'Return to exploration'}</button>
  </div></div>;
}
