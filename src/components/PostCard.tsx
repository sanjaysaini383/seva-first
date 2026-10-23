import { Heart, MessageCircle } from 'lucide-react';
import { distanceKm, formatDistance, timeAgo } from '../lib/format';
import { t } from '../lib/i18n';
import { catLabel, categoryMeta, type LngLat, type Post } from '../lib/types';
import { Avatar } from './Avatar';

type Props = { post: Post; origin: LngLat; selected: boolean; fresh: boolean; onSelect: () => void };

export function PostCard({ post, origin, selected, fresh, onSelect }: Props) {
  const meta = categoryMeta(post.category);
  const Icon = meta.icon;
  return (
    <button
      className={`card ${selected ? 'card--selected' : ''} ${fresh ? 'card--fresh' : ''} card--${post.status}`}
      style={{ ['--accent-cat' as string]: meta.color }}
      onClick={onSelect}
    >
      <div className="card__icon">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="card__main">
        <div className="card__meta">
          <span className={`kind kind--${post.kind}`}>{t(`kind.${post.kind}` as const)}</span>
          <span className="card__cat">{catLabel(post.category)}</span>
          {post.urgency === 'high' && post.status === 'open' && <span className="badge badge--urgent">{t('badge.urgent')}</span>}
          {post.status !== 'open' && <span className={`badge badge--${post.status}`}>{t(`status.${post.status}` as const)}</span>}
          <span className="card__dist">{formatDistance(distanceKm(origin, post.location))}</span>
        </div>
        <div className="card__title">{post.title}</div>
        <div className="card__foot">
          <Avatar id={post.authorId} name={post.authorName} size={18} />
          <span className="card__author">{post.authorName}</span>
          <span className="dot">·</span>
          <span>{timeAgo(post.$createdAt)}</span>
          <span className="card__stats">
            {post.replies > 0 && (
              <span>
                <MessageCircle size={13} /> {post.replies}
              </span>
            )}
            {post.hearts > 0 && (
              <span>
                <Heart size={13} /> {post.hearts}
              </span>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
