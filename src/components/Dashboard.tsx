import type { Language, ReligiousSummary } from '../types';
import { religionLabels, translations } from '../utils/i18n';

type Props = {
  language: Language;
  summary: ReligiousSummary;
};

export function Dashboard({ language, summary }: Props) {
  const t = translations[language];
  const topDistrict = summary.byDistrict[0];
  const categoryCount = summary.byReligion.length;

  return (
    <section className="dashboard">
      <div className="section-heading">
        <h2>{t.dataOverview}</h2>
        <p>{t.dataDisclaimer}</p>
      </div>

      <div className="summary-grid">
        <SummaryCard label={t.totalOrganizations} value={summary.total.toLocaleString()} />
        <SummaryCard label={t.religionCategories} value={categoryCount.toLocaleString()} />
        <SummaryCard label={t.topDistrict} value={topDistrict ? `${topDistrict.district} ${topDistrict.count}` : '-'} />
        <SummaryCard
          label={t.organizationsWithFestivalDates}
          value={summary.withFestivalDateCount.toLocaleString()}
        />
      </div>

      <div className="charts-grid">
        <BarChart
          title={t.countByReligion}
          items={summary.byReligion.map((item) => ({
            label: religionLabels[language][item.religion as keyof typeof religionLabels.zh] ?? item.religion,
            count: item.count,
          }))}
        />
        <BarChart
          title={t.countByDistrict}
          items={summary.byDistrict.map((item) => ({ label: item.district, count: item.count }))}
        />
        <BarChart
          title={t.festivalDateAvailability}
          items={[
            { label: t.festivalAvailable, count: summary.withFestivalDateCount },
            { label: t.festivalMissing, count: summary.withoutFestivalDateCount },
          ]}
        />
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BarChart({ title, items }: { title: string; items: Array<{ label: string; count: number }> }) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <article className="chart">
      <h3>{title}</h3>
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <i style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
            <strong>{item.count}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
