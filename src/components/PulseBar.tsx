import type { PulseRow } from '../lib/api';
import { Siren } from 'lucide-react';
import { t } from '../lib/i18n';
import { CATEGORIES, catLabel, isEmergency, type Category } from '../lib/types';

type Props = {
  rows: PulseRow[];
  doneThisWeek: number | null;
  active: Category | 'all';
  onPick: (c: Category | 'all') => void;
  emergency: boolean;
  onEmergency: (on: boolean) => void;
};

export function PulseBar({ rows, doneThisWeek, active, onPick, emergency, onEmergency }: Props) {
  const total = rows.reduce((s, r) => s + r.n, 0);
  const urgent = rows.filter((r) => isEmergency(r.category)).reduce((s, r) => s + r.n, 0);
  const max = Math.max(1, ...rows.map((r) => r.n));
  const byCat = new Map(rows.map((r) => [r.category, r.n]));

  return (
    <section className="pulse">
      <div className="kpis">
        <div className="kpi">
          <div className="kpi__label">{t('pulse.open')}</div>
          <div className="kpi__value">{total}</div>
        </div>
        <button
          className={`kpi kpi--emergency ${emergency ? 'kpi--on' : ''}`}
          onClick={() => onEmergency(!emergency)}
          aria-pressed={emergency}
          title={t('filters.emergency')}
        >
          <div className="kpi__label">
            <Siren size={13} /> {t('pulse.emergency')}
          </div>
          <div className="kpi__value">{urgent}</div>
        </button>
        <div className="kpi">
          <div className="kpi__label">{t('pulse.helped')}</div>
          <div className="kpi__value kpi__value--accent">{doneThisWeek ?? '–'}</div>
        </div>
      </div>
      <div className="cats" role="list" aria-label={t('pulse.filterLabel')}>
        <button className={`cat ${active === 'all' ? 'cat--on' : ''}`} onClick={() => onPick('all')}>
          {t('filters.all')}
        </button>
        {CATEGORIES.filter((c) => !emergency || c.emergency).map((c) => {
          const n = byCat.get(c.id) ?? 0;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              role="listitem"
              className={`cat ${active === c.id ? 'cat--on' : ''}`}
              style={{ ['--accent-cat' as string]: c.color, ['--fill' as string]: `${(n / max) * 100}%` }}
              onClick={() => onPick(active === c.id ? 'all' : c.id)}
              title={t('pulse.catTitle', { label: catLabel(c.id), n })}
            >
              <Icon size={14} strokeWidth={2} />
              <span className="cat__n">{n}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
