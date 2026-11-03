import { Component, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../../types';

type Props = { language: Language; onClose: () => void };

export class FaithSpaceBoundary extends Component<Props & { children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    return this.state.failed ? <FaithSpaceStatus {...this.props} failed /> : this.props.children;
  }
}

/** A cancellable, keyboard-accessible shell while the optional scene chunk loads. */
export function FaithSpaceStatus({ language, onClose, failed = false }: Props & { failed?: boolean }) {
  const button = useRef<HTMLButtonElement>(null);
  const message = failed
    ? language === 'zh' ? '信仰空間載入失敗，請返回地圖後重新整理再試。' : 'Faith Space could not load. Return to the map and refresh to try again.'
    : language === 'zh' ? '載入信仰空間…' : 'Loading Faith Space…';

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    button.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);

  return <div className="faith-loading" role="dialog" aria-modal="true" aria-label={message}
    onKeyDown={event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') { event.preventDefault(); button.current?.focus(); }
    }}>
    <div><p role={failed ? 'alert' : 'status'}>{message}</p>
      <button className="text-button" ref={button} onClick={onClose}>{language === 'zh' ? '返回地圖' : 'Return to map'}</button>
    </div>
  </div>;
}
