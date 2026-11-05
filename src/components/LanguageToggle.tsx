import type { Language } from '../types';

type Props = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="language-toggle" role="group" aria-label={language === 'zh' ? '語言' : 'Language'}>
      <button className={language === 'zh' ? 'active' : ''} aria-pressed={language === 'zh'} onClick={() => onChange('zh')} type="button">
        中文
      </button>
      <button className={language === 'en' ? 'active' : ''} aria-pressed={language === 'en'} onClick={() => onChange('en')} type="button">
        English
      </button>
    </div>
  );
}
