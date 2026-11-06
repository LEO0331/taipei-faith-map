import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../../types';
import { getFeatureFlags } from '../../utils/featureFlags';
import { MAX_NOTE_BYTES, MAX_NOTE_GRAPHEMES, isValidNoteText, noteTextMetrics } from './noteLimits';
import { readApprovedNotes, reportQuietNote, submitQuietNote } from './quietCornerClient';
import { QuietCornerError } from './quietCornerTypes';
import type { QuietCornerFailure, QuietNote, QuietReportReason } from './quietCornerTypes';
import './quiet-corner.css';

type Props = {
  language: Language;
  onClose: () => void;
  challenge?: ReactNode | ((action: 'quiet-note' | 'quiet-report') => ReactNode);
  captchaToken?: string;
  onResetCaptcha?: () => void;
};

const labels = {
  zh: {
    title: '留言角落', introduction: '留下一句祝福或心情，也可以只是看看其他人的話。',
    close: '關閉留言角落', loading: '讀取已審核留言…', empty: '目前沒有可閱讀的已審核留言。',
    disabled: '留言角落目前未開放，仍可自由探索。', unavailable: '留言角落目前無法使用，仍可自由探索。',
    refresh: '重新讀取', write: '寫下一句話', cancel: '取消', composer: '簡短的祝福或心情',
    limit: '最多80個文字單位；請勿填寫姓名、聯絡資料或其他個人資訊。', remaining: '個文字單位', tooLarge: '內容過大，請刪減文字。', stopWaiting: '停止等候',
    send: '送出待審核留言', sending: '送出中…', received: '已收到你的留言，審核後才會公開。',
    invalid: '請輸入不超過80個文字單位的簡短內容。', 'verification-required': '請先完成驗證。',
    'fresh-verification': '請完成新的驗證後送出。', 'posting-disabled': '目前暫停收件，仍可閱讀已審核留言。',
    'rate-limited': '請稍候再試。', duplicate: '相同內容已送出，請勿重複提交。',
    report: '回報這則留言', reportTitle: '回報留言', reason: '回報原因', unsafe: '不適當內容',
    'personal-data': '含個人資訊', spam: '垃圾內容', other: '其他', reportSend: '送出回報', reported: '已收到回報，將由管理者檢視。',
    moderation: '公開留言均經管理者審核；新留言不會立即出現在此處。', approved: '已審核留言', expires: '保留至',
  },
  en: {
    title: 'Quiet Corner', introduction: 'Leave a short thought or good wish—or simply read.',
    close: 'Close Quiet Corner', loading: 'Reading approved notes…', empty: 'There are no approved notes to read right now.',
    disabled: 'Quiet Corner is currently disabled. Solo exploration remains available.', unavailable: 'Quiet Corner is temporarily unavailable. Solo exploration remains available.',
    refresh: 'Read again', write: 'Write a short note', cancel: 'Cancel', composer: 'A short thought or good wish',
    limit: 'Up to 80 grapheme clusters. Do not include names, contact details or other personal information.', remaining: 'grapheme clusters', tooLarge: 'This note is too large. Please shorten it.', stopWaiting: 'Stop waiting',
    send: 'Submit for review', sending: 'Submitting…', received: 'Your note was received and will appear only after review.',
    invalid: 'Please enter a short note of no more than 80 grapheme clusters.', 'verification-required': 'Please complete verification first.',
    'fresh-verification': 'Please complete fresh verification before sending.', 'posting-disabled': 'Posting is paused. Approved notes remain available to read.',
    'rate-limited': 'Please wait before trying again.', duplicate: 'The same note has already been submitted. Please do not send it again.',
    report: 'Report this note', reportTitle: 'Report a note', reason: 'Reason', unsafe: 'Inappropriate content',
    'personal-data': 'Personal information', spam: 'Spam', other: 'Other', reportSend: 'Send report', reported: 'Your report was received for operator review.',
    moderation: 'Published notes are approved by an operator. New submissions do not appear immediately.', approved: 'Approved notes', expires: 'Available until',
  },
};

const reportReasons: QuietReportReason[] = ['unsafe', 'personal-data', 'spam', 'other'];

export default function QuietCorner({ language, onClose, challenge, captchaToken, onResetCaptcha }: Props) {
  const enabled = getFeatureFlags().quietCorner;
  const t = labels[language];
  const [notes, setNotes] = useState<QuietNote[]>([]);
  const [readState, setReadState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [refreshKey, setRefreshKey] = useState(0);
  const [content, setContent] = useState('');
  const [composing, setComposing] = useState(false);
  const [reporting, setReporting] = useState<QuietNote>();
  const [reason, setReason] = useState<QuietReportReason>('unsafe');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<QuietCornerFailure | 'received' | 'reported'>();
  const request = useRef<AbortController | undefined>(undefined);
  const mounted = useRef(true);
  const composer = useRef<HTMLTextAreaElement>(null);
  const reportControl = useRef<HTMLSelectElement>(null);
  const invoker = useRef<HTMLButtonElement | null>(null);
  const feedbackElement = useRef<HTMLParagraphElement>(null);
  const headingId = useId();
  const limitId = useId();
  const metrics = noteTextMetrics(content.trim());

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setReadState('loading');
    readApprovedNotes(controller.signal).then(items => {
      if (!controller.signal.aborted) { setNotes(items); setReadState('ready'); }
    }).catch(() => { if (!controller.signal.aborted) setReadState('unavailable'); });
    return () => controller.abort();
  }, [enabled, refreshKey]);

  useEffect(() => {
    if (!notes.length) return;
    const delay = Math.max(1, Math.min(2_147_483_647, Math.min(...notes.map(note => Date.parse(note.expiresAt))) - Date.now() + 1));
    const timer = window.setTimeout(() => setNotes(items => items.filter(note => Date.parse(note.expiresAt) > Date.now())), delay);
    return () => window.clearTimeout(timer);
  }, [notes]);

  useEffect(() => {
    if (composing) composer.current?.focus();
    else if (reporting) reportControl.current?.focus();
  }, [composing, reporting?.id]);

  useEffect(() => {
    if (feedback === 'received' || feedback === 'reported') feedbackElement.current?.focus();
  }, [feedback]);

  const cancel = (restoreFocus = true) => {
    request.current?.abort();
    setPending(false); setComposing(false); setReporting(undefined); setFeedback(undefined);
    onResetCaptcha?.();
    if (restoreFocus) requestAnimationFrame(() => invoker.current?.isConnected && invoker.current.focus());
  };
  const send = async () => {
    if (pending) return;
    if (!reporting && !isValidNoteText(content)) { setFeedback('invalid'); return; }
    if (challenge && !captchaToken) { setFeedback('verification-required'); return; }
    const controller = new AbortController(); request.current?.abort(); request.current = controller;
    setPending(true); setFeedback(undefined);
    try {
      if (reporting) await reportQuietNote(reporting.id, reason, captchaToken, controller.signal);
      else await submitQuietNote(content, captchaToken, controller.signal);
      if (mounted.current && !controller.signal.aborted) {
        setFeedback(reporting ? 'reported' : 'received');
        setContent(''); setComposing(false); setReporting(undefined);
      }
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setFeedback(error instanceof QuietCornerError ? error.code : 'unavailable');
    } finally {
      if (mounted.current && !controller.signal.aborted) { setPending(false); onResetCaptcha?.(); }
    }
  };

  const date = (value: string) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en-US', { timeZone: 'Asia/Taipei', month: 'short', day: 'numeric' }).format(new Date(value));
  const panel = enabled && (composing || reporting);
  return <section className="quiet-corner" aria-labelledby={headingId}>
    <header className="quiet-corner-header"><div><h3 id={headingId}>{t.title}</h3><p>{t.introduction}</p></div><button className="text-button" onClick={onClose}>{t.close}</button></header>
    {!enabled ? <p>{t.disabled}</p> : <>
      <p className="quiet-corner-notice">{t.moderation}</p>
      {readState === 'loading' && <p role="status">{t.loading}</p>}
      {readState === 'unavailable' && <p>{t.unavailable}</p>}
      {readState === 'ready' && !notes.length && <p>{t.empty}</p>}
      {readState === 'ready' && notes.length > 0 && <div className="quiet-note-board" role="list" aria-label={t.approved}>
        {notes.map(note => <article className="quiet-note" role="listitem" key={note.id}>
          <p className="quiet-note-content">{note.content}</p>
          <p className="quiet-note-expiry">{t.expires} <time dateTime={note.expiresAt}>{date(note.expiresAt)}</time></p>
          <button className="text-button" onClick={event => { invoker.current = event.currentTarget; cancel(false); setReporting(note); }}>{t.report}<span className="quiet-sr-only">: {note.content}</span></button>
        </article>)}
      </div>}
      {!panel && <div className="quiet-corner-actions"><button className="text-button" onClick={() => setRefreshKey(key => key + 1)} disabled={readState === 'loading'}>{t.refresh}</button><button className="primary-button" ref={element => { if (element && !invoker.current?.isConnected) invoker.current = element; }} onClick={event => { invoker.current = event.currentTarget; setFeedback(undefined); setComposing(true); }}>{t.write}</button></div>}
      {panel && <form className="quiet-note-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
        {reporting ? <><h4>{t.reportTitle}</h4><label>{t.reason}<select ref={reportControl} value={reason} onChange={event => setReason(event.target.value as QuietReportReason)} disabled={pending}>{reportReasons.map(value => <option value={value} key={value}>{t[value]}</option>)}</select></label></> : <>
          <label>{t.composer}<textarea ref={composer} value={content} onChange={event => setContent(event.target.value)} aria-describedby={limitId} aria-invalid={!!content && !isValidNoteText(content)} rows={3} maxLength={4096} disabled={pending} /></label>
          <p className="quiet-corner-limit" id={limitId}>{t.limit} <span>{metrics.graphemes}/{MAX_NOTE_GRAPHEMES} {t.remaining}</span>{metrics.bytes > MAX_NOTE_BYTES && <span>{t.tooLarge}</span>}</p>
        </>}
        {typeof challenge === 'function' ? challenge(reporting ? 'quiet-report' : 'quiet-note') : challenge}
        <div className="quiet-corner-actions"><button className="primary-button" type="submit" disabled={pending || (!!challenge && !captchaToken) || (!reporting && !isValidNoteText(content))}>{pending ? t.sending : reporting ? t.reportSend : t.send}</button><button className="text-button" type="button" onClick={() => cancel()}>{pending ? t.stopWaiting : t.cancel}</button></div>
      </form>}
      {feedback && <p ref={feedbackElement} tabIndex={-1} role={feedback === 'received' || feedback === 'reported' || feedback === 'fresh-verification' ? 'status' : 'alert'}>{t[feedback]}</p>}
    </>}
  </section>;
}
