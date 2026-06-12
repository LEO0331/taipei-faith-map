import type { Language } from '../types';

type Props = {
  language: Language;
  onChange: (language: Language) => void;
};

export function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="language-toggle" aria-label="Language">
      <button className={language === 'zh' ? 'active' : ''} onClick={() => onChange('zh')} type="button">
        中文
      </button>
      <button className={language === 'en' ? 'active' : ''} onClick={() => onChange('en')} type="button">
        English
      </button>
    </div>
  );
}
