import type { Dispatch, SetStateAction } from 'react';
import type { Filters, Language } from '../types';
import { RELIGION_TYPES } from '../utils/data';
import { religionLabels, translations } from '../utils/i18n';

type Props = {
  districts: string[];
  filters: Filters;
  language: Language;
  resultCount: number;
  setFilters: Dispatch<SetStateAction<Filters>>;
  villages: string[];
};

export function FilterPanel({ districts, filters, language, resultCount, setFilters, villages }: Props) {
  const t = translations[language];

  return (
    <aside className="filter-panel">
      <div className="filter-title-row">
        <div>
          <h2>{t.registeredCount}</h2>
          <p>
            {resultCount.toLocaleString()} {t.results}
          </p>
        </div>
        <button className="text-button" type="button" onClick={() => setFilters(defaultFilters(language))}>
          {t.clearFilters}
        </button>
      </div>

      <label>
        <span>{t.searchPlaceholder}</span>
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder={t.searchPlaceholder}
          type="search"
        />
      </label>

      <label>
        <span>{t.religion}</span>
        <select
          value={filters.religion}
          onChange={(event) =>
            setFilters((current) => ({ ...current, religion: event.target.value as Filters['religion'] }))
          }
        >
          <option value={language === 'zh' ? '全部' : 'All'}>{t.all}</option>
          {RELIGION_TYPES.map((religion) => (
            <option key={religion} value={religion}>
              {religionLabels[language][religion]}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{t.district}</span>
        <select
          value={filters.district}
          onChange={(event) =>
            setFilters((current) => ({ ...current, district: event.target.value, village: '' }))
          }
        >
          <option value="">{t.allDistricts}</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>{t.village}</span>
        <select
          value={filters.village}
          onChange={(event) => setFilters((current) => ({ ...current, village: event.target.value }))}
        >
          <option value="">{t.allVillages}</option>
          {villages.map((village) => (
            <option key={village} value={village}>
              {village}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox-row">
        <input
          checked={filters.hasFestivalDate}
          onChange={(event) =>
            setFilters((current) => ({ ...current, hasFestivalDate: event.target.checked }))
          }
          type="checkbox"
        />
        <span>{t.hasFestivalDate}</span>
      </label>
    </aside>
  );
}

function defaultFilters(language: Language): Filters {
  return {
    religion: language === 'zh' ? '全部' : 'All',
    district: '',
    village: '',
    hasFestivalDate: false,
    search: '',
  };
}
