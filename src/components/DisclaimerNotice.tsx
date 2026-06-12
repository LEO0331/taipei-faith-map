import type { Language } from '../types';
import { translations } from '../utils/i18n';

export function DisclaimerNotice({ language }: { language: Language }) {
  return <p className="disclaimer">{translations[language].dataDisclaimer}</p>;
}
