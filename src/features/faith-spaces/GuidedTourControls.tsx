import type { Language } from '../../types';
import type { RefObject } from 'react';

type Props = {
  language: Language;
  index: number;
  total: number;
  completed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onRestart: () => void;
  nextButtonRef: RefObject<HTMLButtonElement | null>;
};

export const tourLabels = {
  zh: { title: '文化導覽', free: '自由探索', previous: '上一個', next: '下一個', finish: '完成導覽', exit: '退出導覽', restart: '重新導覽', complete: '你已探索這個空間。', progress: (step: number, total: number) => `第 ${step}／${total} 個文化細節` },
  en: { title: 'Guided Tour', free: 'Free Exploration', previous: 'Previous', next: 'Next', finish: 'Finish tour', exit: 'Exit tour', restart: 'Restart tour', complete: "You've explored this space.", progress: (step: number, total: number) => `${step} of ${total} cultural details` },
};

export function GuidedTourControls({ language, index, total, completed, onPrevious, onNext, onExit, onRestart, nextButtonRef }: Props) {
  const t = tourLabels[language];
  return <nav className="faith-tour-controls" aria-label={t.title}>
    <div className="faith-tour-progress" aria-hidden="true"><span>{t.progress(index + 1, total)}</span><span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
    <div className="faith-tour-track" aria-hidden="true"><span style={{ width: `${(index + 1) / total * 100}%` }} /></div>
    <div className="faith-tour-actions">
      <button className="faith-button" disabled={index === 0 && !completed} onClick={() => {
        onPrevious();
        if (index === 1 && !completed) nextButtonRef.current?.focus();
      }}>{t.previous}</button>
      {completed
        ? <button ref={nextButtonRef} className="faith-button faith-button-primary" onClick={onRestart}>{t.restart}</button>
        : <button ref={nextButtonRef} className="faith-button faith-button-primary" onClick={onNext}>{index === total - 1 ? t.finish : t.next}</button>}
      <button className="faith-button faith-tour-exit" onClick={onExit}>{t.exit}</button>
    </div>
  </nav>;
}
