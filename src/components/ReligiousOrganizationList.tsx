import type { Language, ReligiousOrganization } from '../types';
import { getGoogleMapsUrl } from '../utils/geo';
import { religionLabels, translations } from '../utils/i18n';

type Props = {
  items: ReligiousOrganization[];
  language: Language;
};

export function ReligiousOrganizationList({ items, language }: Props) {
  const t = translations[language];

  return (
    <section className="records-section">
      <div className="section-heading">
        <h2>{t.registeredCount}</h2>
        <p>
          {items.length.toLocaleString()} {t.results}
        </p>
      </div>
      {items.length === 0 ? <p className="status-text">{t.noResults}</p> : null}
      <div className="record-list">
        {items.map((item) => (
          <article className="record-item" key={item.id}>
            <div>
              <h3>{item.name}</h3>
              <p>
                {religionLabels[language][item.religion]} · {item.district}
                {item.village ? ` · ${item.village}` : ''}
              </p>
              <p>{item.address}</p>
              {item.festivalDates.length > 0 ? (
                <div className="chip-row">
                  {item.festivalDates.map((date) => (
                    <span key={date}>{date}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <a href={getGoogleMapsUrl(item.latitude, item.longitude)} target="_blank" rel="noreferrer">
              {t.openGoogleMaps}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
