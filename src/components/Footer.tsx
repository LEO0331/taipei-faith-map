import type { Language } from '../types';
import { translations } from '../utils/i18n';

export function Footer({ language }: { language: Language }) {
  return <footer>{translations[language].footer}</footer>;
}
