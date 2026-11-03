import { useEffect, useRef, useState } from 'react';
import type { Language } from '../../types';

const labels = {
  zh: { title: '靜心片刻', note: '自由停歇片刻。這不是宗教儀式；活動不會被儲存或傳送。', minute: '分鐘', start: '開始', pause: '暫停', resume: '繼續', reset: '重設', ready: '準備就緒', running: '靜心進行中', paused: '已暫停', complete: '靜心片刻已完成', countdown: '剩餘時間' },
  en: { title: 'Quiet Reflection', note: 'An optional pause, not a religious ceremony. Activity is never stored or transmitted.', minute: 'min', start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', ready: 'Ready', running: 'Reflection in progress', paused: 'Paused', complete: 'Reflection complete', countdown: 'Time remaining' },
};

export function ReflectionTimer({ language }: { language: Language }) {
  const t = labels[language];
  const [minutes, setMinutes] = useState(1);
  const [remaining, setRemaining] = useState(60_000);
  const [status, setStatus] = useState<'ready' | 'running' | 'paused' | 'complete'>('ready');
  const deadline = useRef(0);

  useEffect(() => {
    if (status !== 'running') return;
    const update = () => {
      const next = Math.max(0, deadline.current - Date.now());
      setRemaining(next);
      if (next === 0) setStatus('complete');
    };
    const interval = window.setInterval(update, 250);
    document.addEventListener('visibilitychange', update);
    update();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', update);
    };
  }, [status]);

  const reset = (nextMinutes = minutes) => {
    setMinutes(nextMinutes);
    setRemaining(nextMinutes * 60_000);
    setStatus('ready');
    deadline.current = 0;
  };

  const toggle = () => {
    if (status === 'running') {
      const next = Math.max(0, deadline.current - Date.now());
      setRemaining(next);
      setStatus(next === 0 ? 'complete' : 'paused');
    } else {
      const duration = status === 'complete' ? minutes * 60_000 : remaining;
      deadline.current = Date.now() + duration;
      setRemaining(duration);
      setStatus('running');
    }
  };

  const seconds = Math.ceil(remaining / 1000);
  return (
    <section className="reflection-timer" aria-label={t.title}>
      <h3>{t.title}</h3>
      <p>{t.note}</p>
      <div className="reflection-presets" role="group" aria-label={t.title}>
        {[1, 3, 5].map((value) => (
          <button key={value} type="button" className="faith-button" aria-pressed={minutes === value} onClick={() => reset(value)}>
            {value} {t.minute}
          </button>
        ))}
      </div>
      <output className="reflection-countdown" aria-label={t.countdown} aria-live="off">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </output>
      <p className="reflection-status" role="status">{t[status]}</p>
      <div className="reflection-actions">
        <button type="button" className="faith-button faith-button-primary" onClick={toggle}>
          {status === 'running' ? t.pause : status === 'paused' ? t.resume : t.start}
        </button>
        <button type="button" className="faith-button" onClick={() => reset()}>{t.reset}</button>
      </div>
    </section>
  );
}
