import type { Language, NearbyResult } from '../types';
import { formatDistance } from '../utils/geo';
import { translations } from '../utils/i18n';

type Props = {
  error?: string;
  language: Language;
  onNearby: () => void;
  onRadiusChange: (radius: number) => void;
  radiusMeters: number;
  radiusOptions: number[];
  results: NearbyResult[];
};

export function NearbyPanel({
  error,
  language,
  onNearby,
  onRadiusChange,
  radiusMeters,
  radiusOptions,
  results,
}: Props) {
  const t = translations[language];

  return (
    <section className="nearby-panel">
      <div className="nearby-actions">
        <button className="primary-button" type="button" onClick={onNearby}>
          {t.showNearby}
        </button>
        <label>
          <span>{t.nearbyRadius}</span>
          <select value={radiusMeters} onChange={(event) => onRadiusChange(Number(event.target.value))}>
            {radiusOptions.map((radius) => (
              <option key={radius} value={radius}>
                {formatDistance(radius, language)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? <p className="status-text">{error}</p> : null}
      {results.length > 0 ? (
        <div>
          <h2>{t.nearbyOrganizations}</h2>
          <ol className="nearby-list">
            {results.slice(0, 8).map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <strong>{formatDistance(item.distanceMeters, language)}</strong>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
