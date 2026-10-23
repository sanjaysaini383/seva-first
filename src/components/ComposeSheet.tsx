import { useState } from 'react';
import { Gift, HandHelping, MapPin, X } from 'lucide-react';
import type { NewPost } from '../lib/api';
import { t, type Key } from '../lib/i18n';
import { CATEGORIES, catLabel, type Category, type Kind, type LngLat, type Urgency } from '../lib/types';

type Props = {
  pin: LngLat;
  onCancel: () => void;
  onSubmit: (p: NewPost) => Promise<void>;
};

const EXPIRY = [3, 24, 72, 168] as const;

const PROMPTS: Record<Kind, Key> = { request: 'compose.titleReq', offer: 'compose.titleOffer' };

export function ComposeSheet({ pin, onCancel, onSubmit }: Props) {
  const [kind, setKind] = useState<Kind>('request');
  const [category, setCategory] = useState<Category>('tools');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [expiresInHours, setExpires] = useState(24);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) return;
    setBusy(true);
    try {
      await onSubmit({ kind, category, title: title.trim(), body: body.trim(), urgency, location: pin, expiresInHours });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="sheet" onSubmit={submit}>
      <div className="sheet__head">
        <div>
          <h2>{t('compose.title')}</h2>
          <p>{t('compose.sub')}</p>
        </div>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label={t('compose.cancel')}>
          <X size={17} />
        </button>
      </div>

      <div className="seg">
        <button type="button" className={kind === 'request' ? 'on' : ''} onClick={() => setKind('request')}>
          <HandHelping size={16} /> {t('compose.need')}
        </button>
        <button type="button" className={kind === 'offer' ? 'on' : ''} onClick={() => setKind('offer')}>
          <Gift size={16} /> {t('compose.offer')}
        </button>
      </div>

      <div className="field">
        <label>{t('compose.category')}</label>
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`chip ${category === c.id ? 'chip--on' : ''}`}
              style={{ ['--accent-cat' as string]: c.color }}
              onClick={() => setCategory(c.id)}
            >
              <c.icon size={14} /> {catLabel(c.id)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="title">{t('compose.titleLabel')}</label>
        <input
          id="title"
          className="input"
          autoFocus
          maxLength={120}
          placeholder={t(PROMPTS[kind])}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="body">
          {t('compose.details')} <span className="optional">{t('compose.optional')}</span>
        </label>
        <textarea
          id="body"
          className="input"
          rows={3}
          maxLength={2000}
          placeholder={t('compose.detailsPh')}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>{t('compose.urgency')}</label>
          <div className="seg seg--sm">
            {(['low', 'normal', 'high'] as Urgency[]).map((u) => (
              <button type="button" key={u} className={urgency === u ? 'on' : ''} onClick={() => setUrgency(u)}>
                {t(`urgency.${u}` as const)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="expiry">{t('compose.expires')}</label>
          <select id="expiry" className="input" value={expiresInHours} onChange={(e) => setExpires(Number(e.target.value))}>
            {EXPIRY.map((h) => (
              <option key={h} value={h}>
                {t(`exp.${h}` as const)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sheet__pin">
        <MapPin size={15} />
        <div>
          <strong>
            {pin[1].toFixed(4)}, {pin[0].toFixed(4)}
          </strong>
          <span>{t('compose.pinHint')}</span>
        </div>
      </div>

      <button className="btn btn--primary btn--block" disabled={busy || title.trim().length < 3}>
        {busy ? t('compose.publishing') : t('compose.publish')}
      </button>
    </form>
  );
}
