import { useState } from 'react';
import { HandHelping, MapPin, Star } from 'lucide-react';
import { t } from '../lib/i18n';

type Props = { onJoin: (name: string) => Promise<void>; onBrowse: () => void };

const STEPS = [
  { icon: MapPin, title: 'join.s1t', text: 'join.s1x' },
  { icon: HandHelping, title: 'join.s2t', text: 'join.s2x' },
  { icon: Star, title: 'join.s3t', text: 'join.s3x' },
] as const;

export function JoinDialog({ onJoin, onBrowse }: Props) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('join.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <form className="join" onSubmit={submit}>
        <div className="join__brand">
          <img src="/hearth.svg" alt="" className="join__logo" />
          <span>Hearth</span>
        </div>
        <h1 id="join-title">{t('join.headline')}</h1>
        <p className="join__tag">{t('join.tag')}</p>
        <ul className="join__how">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="join__step">
                <Icon size={16} />
              </span>
              <div>
                <strong>{t(title)}</strong>
                <span>{t(text)}</span>
              </div>
            </li>
          ))}
        </ul>
        <label className="join__label" htmlFor="join-name">
          {t('join.label')}
        </label>
        <input
          id="join-name"
          className="input input--lg"
          autoFocus
          placeholder={t('join.ph')}
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <div className="join__err">{error}</div>}
        <button className="btn btn--primary btn--block btn--lg" disabled={busy || !name.trim()}>
          {busy ? t('join.joining') : t('join.continue')}
        </button>
        <button type="button" className="btn btn--ghost btn--block" onClick={onBrowse}>
          {t('join.browse')}
        </button>
        <p className="join__fine">{t('join.fine')}</p>
      </form>
    </div>
  );
}
