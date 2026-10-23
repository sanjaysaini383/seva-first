import { Star, Trophy } from 'lucide-react';
import type { Hero } from '../lib/api';
import { t } from '../lib/i18n';
import { Avatar } from './Avatar';

export function Heroes({ heroes, meId }: { heroes: Hero[]; meId?: string }) {
  if (!heroes.length) {
    return (
      <div className="empty">
        <div className="empty__icon">
          <Trophy size={22} />
        </div>
        <p>{t('heroes.empty')}</p>
      </div>
    );
  }
  const top = heroes[0]!.points;
  return (
    <ol className="heroes">
      {heroes.map((h, i) => (
        <li key={h.toId} className={`hero ${h.toId === meId ? 'hero--me' : ''}`}>
          <span className={`hero__rank hero__rank--${i + 1}`}>{i + 1}</span>
          <Avatar id={h.toId} name={h.toName} size={32} />
          <div className="hero__main">
            <div className="hero__name">
              {h.toName}
              {h.toId === meId && <span className="badge">{t('heroes.you')}</span>}
            </div>
            <div className="hero__bar">
              <span style={{ width: `${(h.points / top) * 100}%` }} />
            </div>
          </div>
          <div className="hero__score">
            <strong>
              <Star size={13} fill="currentColor" /> {h.points}
            </strong>
            <span>
              {h.helps === 1 ? t('heroes.help') : t('heroes.helps', { n: h.helps })}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
