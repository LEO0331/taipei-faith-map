import { useId } from 'react';
import type { Language } from '../../types';
import type { VisitorAction, VisitorMotionController } from './useVisitorMotion';
import './faith-moments.css';

const labels = {
  zh: { title: '信仰片刻', walk: '走一走', sit: '坐一會', wave: '揮揮手', observe: '看看四周', idle: '自在停留', on: '開啟動畫', off: '關閉動畫', motion: '動畫偏好', skip: '略過動作', reduced: '依裝置偏好減少動態效果。', preference: '僅在此裝置記住動畫偏好。' },
  en: { title: 'Faith Moments', walk: 'Walk', sit: 'Sit', wave: 'Wave', observe: 'Observe', idle: 'Rest', on: 'Animation On', off: 'Animation Off', motion: 'Animation preference', skip: 'Skip movement', reduced: 'Reduced motion follows your device preference.', preference: 'Only the motion preference is remembered on this device.' },
};

export function AvatarActions({ language, controller, showMotionPreference = true }: { language: Language; controller: VisitorMotionController; showMotionPreference?: boolean }) {
  const t = labels[language];
  const heading = useId();
  return <section className="visitor-actions" aria-labelledby={heading}>
    <h3 id={heading}>{t.title}</h3>
    <div className="visitor-action-buttons" role="group" aria-label={t.title}>
      {(['walk', 'sit', 'wave', 'observe', 'idle'] as VisitorAction[]).map(action => <button type="button" className="faith-button" key={action} aria-pressed={controller.action === action} onClick={() => controller.perform(action)}>{t[action]}</button>)}
      {controller.motionEnabled && controller.action !== 'idle' && <button type="button" className="faith-button" onClick={controller.skip}>{t.skip}</button>}
    </div>
    {showMotionPreference && <div className="visitor-motion-buttons" role="group" aria-label={t.motion}>
      <button type="button" className="faith-button" aria-pressed={controller.motionEnabled} onClick={() => controller.setMotionEnabled(true)}>{t.on}</button>
      <button type="button" className="faith-button" aria-pressed={!controller.motionEnabled} onClick={() => controller.setMotionEnabled(false)}>{t.off}</button>
    </div>}
    <p>{controller.reducedMotion ? t.reduced : t.preference}</p>
  </section>;
}
