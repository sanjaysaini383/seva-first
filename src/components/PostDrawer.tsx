import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleCheck, Clock, HandHelping, Heart, LocateFixed, MapPin, Send, Star, Trash2, Undo2 } from 'lucide-react';
import {
  ClaimConflict,
  claimPost,
  completePost,
  deletePost,
  getPostWithThread,
  heartPost,
  releasePost,
  sendMessage,
  type Me,
} from '../lib/api';
import { distanceKm, formatDistance, timeAgo, timeLeft } from '../lib/format';
import { t } from '../lib/i18n';
import { catLabel, categoryMeta, type LngLat, type Message, type Post } from '../lib/types';
import { Avatar } from './Avatar';

type Props = {
  postId: string;
  livePost: Post | undefined;
  me: Me | null;
  origin: LngLat;
  bus: EventTarget;
  onClose: () => void;
  onRequireJoin: () => void;
  onFocus: (at: LngLat) => void;
  toast: (msg: string, tone?: 'ok' | 'warn' | 'err') => void;
};

const hearted = (id: string) => {
  try {
    return localStorage.getItem(`hearth:heart:${id}`) === '1';
  } catch {
    return false;
  }
};

export function PostDrawer({ postId, livePost, me, origin, bus, onClose, onRequireJoin, onFocus, toast }: Props) {
  const [fetched, setFetched] = useState<Post | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [thanking, setThanking] = useState(false);
  const [stars, setStars] = useState(5);
  const [note, setNote] = useState('');
  const [liked, setLiked] = useState(() => hearted(postId));
  const threadRef = useRef<HTMLDivElement>(null);

  const post = livePost ?? fetched;

  const [reload, setReload] = useState(0);

  useEffect(() => {
    setMessages(null);
    setThanking(false);
    setLiked(hearted(postId));
  }, [postId]);

  useEffect(() => {
    let alive = true;
    getPostWithThread(postId)
      .then(({ post, messages }) => {
        if (!alive) return;
        setFetched(post);
        setMessages(messages);
      })
      .catch(() => alive && toast(t('drawer.loadFailed'), 'err'));
    return () => {
      alive = false;
    };
  }, [postId, reload, toast]);

  // New messages for this post arrive over Realtime via the app-wide bus. If an
  // event can't be attributed to a post, re-read the thread through the relationship.
  useEffect(() => {
    const onMsg = (e: Event) => {
      const { postId: pid, message } = (e as CustomEvent<{ postId: string | null; message: Message }>).detail;
      if (pid === null) return setReload((n) => n + 1);
      if (pid !== postId) return;
      setMessages((prev) => (prev && !prev.some((m) => m.$id === message.$id) ? [...prev, message] : prev));
    };
    bus.addEventListener('message', onMsg);
    return () => bus.removeEventListener('message', onMsg);
  }, [bus, postId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages?.length]);

  if (!post) {
    return (
      <aside className="drawer">
        <div className="drawer__loading">{t('drawer.loading')}</div>
      </aside>
    );
  }

  const meta = categoryMeta(post.category);
  const isAuthor = me?.id === post.authorId;
  const isHelper = me?.id === post.helperId;
  const left = timeLeft(post.expiresAt);
  const Icon = meta.icon;

  const run = async (label: string, fn: () => Promise<unknown>, ok?: string) => {
    if (!me) return onRequireJoin();
    setBusy(label);
    try {
      await fn();
      if (ok) toast(ok, 'ok');
    } catch (err) {
      if (err instanceof ClaimConflict) toast(err.message, 'warn');
      else toast(err instanceof Error ? err.message : t('drawer.error'), 'err');
    } finally {
      setBusy(null);
    }
  };

  const onHeart = () => {
    if (liked) return;
    setLiked(true);
    try {
      localStorage.setItem(`hearth:heart:${post.$id}`, '1');
    } catch {
      /* per-browser nicety only */
    }
    heartPost(post.$id).catch(() => setLiked(false));
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (!me) return onRequireJoin();
    setDraft('');
    await run('send', () => sendMessage(post.$id, body, me));
  };

  return (
    <aside className="drawer" style={{ ['--accent-cat' as string]: meta.color }}>
      <header className="drawer__head">
        <button className="icon-btn" onClick={onClose} aria-label={t('drawer.back')} title={t('drawer.back')}>
          <ArrowLeft size={17} />
        </button>
        <div className="drawer__crumbs">
          <span className={`kind kind--${post.kind}`}>{t(`kind.${post.kind}` as const)}</span>
          <span className={`badge badge--${post.status}`}>{t(`status.${post.status}` as const)}</span>
          {post.urgency === 'high' && post.status === 'open' && <span className="badge badge--urgent">{t('badge.urgent')}</span>}
          {left && (
            <span className="drawer__left">
              <Clock size={12} /> {left}
            </span>
          )}
        </div>
        <button className="icon-btn" onClick={() => onFocus(post.location)} aria-label={t('drawer.showOnMap')} title={t('drawer.showOnMap')}>
          <LocateFixed size={16} />
        </button>
      </header>

      <div className="drawer__body">
        <div className="drawer__hero">
          <div className="drawer__icon">
            <Icon size={22} strokeWidth={2} />
          </div>
          <div className="drawer__heading">
            <div className="drawer__cat">{catLabel(post.category)}</div>
            <h2 className="drawer__title">{post.title}</h2>
          </div>
        </div>

        <div className="drawer__by">
          <Avatar id={post.authorId} name={post.authorName} size={22} />
          <span className="drawer__byname">{post.authorName}</span>
          <span className="dot">·</span>
          <span>{timeAgo(post.$createdAt)}</span>
          <span className="dot">·</span>
          <span>
            <MapPin size={12} /> {t('drawer.away', { d: formatDistance(distanceKm(origin, post.location)) })}
          </span>
        </div>

        {post.body && <p className="drawer__text">{post.body}</p>}

        <div className="drawer__actions">
          {post.status === 'open' && !isAuthor && (
            <button className="btn btn--primary" disabled={!!busy} onClick={() => run('claim', () => claimPost(post.$id, me!), t('drawer.claimed'))}>
              <HandHelping size={16} />
              {busy === 'claim' ? t('drawer.claiming') : post.kind === 'request' ? t('drawer.claim') : t('drawer.request')}
            </button>
          )}
          {post.status === 'claimed' && isHelper && (
            <button className="btn" disabled={!!busy} onClick={() => run('release', () => releasePost(post.$id, me!))}>
              <Undo2 size={15} /> {t('drawer.stepBack')}
            </button>
          )}
          {post.status === 'claimed' && isAuthor && !thanking && (
            <button className="btn btn--primary" onClick={() => setThanking(true)}>
              <CircleCheck size={16} /> {t('drawer.markDone')}
            </button>
          )}
          <button className={`btn ${liked ? 'btn--liked' : ''}`} onClick={onHeart} title={liked ? t('drawer.appreciated') : t('drawer.appreciate')} aria-pressed={liked}>
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} /> {post.hearts}
          </button>
          {/* Deletion is allowed until a neighbour engages; after that the thread
              holds other people's rows, which the author has no rights over. */}
          {isAuthor && post.status === 'open' && post.replies === 0 && (
            <button
              className="icon-btn icon-btn--danger"
              disabled={!!busy}
              title={t('drawer.delete')}
              aria-label={t('drawer.delete')}
              onClick={() => {
                if (confirm(t('drawer.deleteConfirm'))) run('delete', () => deletePost(post.$id), t('drawer.deleted')).then(onClose);
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {post.status === 'claimed' && post.helperName && !thanking && (
          <div className="helper-banner">
            <Avatar id={post.helperId!} name={post.helperName} size={28} />
            <div>
              <strong>{isHelper ? t('drawer.youHelping') : t('drawer.otherHelping', { name: post.helperName })}</strong>
              <span>{isAuthor ? t('drawer.authorHint') : t('drawer.helperHint')}</span>
            </div>
          </div>
        )}

        {thanking && (
          <form
            className="thank"
            onSubmit={(e) => {
              e.preventDefault();
              run('complete', () => completePost(post, me!, stars, note.trim()), t('drawer.kudosSent', { name: post.helperName ?? '' })).then(() =>
                setThanking(false),
              );
            }}
          >
            <div className="thank__title">{t('drawer.rate', { name: post.helperName ?? '' })}</div>
            <div className="stars" role="radiogroup" aria-label="Kudos">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)} aria-label={t('drawer.of5', { n })}>
                  <Star size={24} fill="currentColor" strokeWidth={1.5} />
                </button>
              ))}
            </div>
            <input className="input" placeholder={t('drawer.note')} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="thank__row">
              <span className="thank__hint">{t('drawer.saveHint')}</span>
              <button type="button" className="btn btn--ghost" onClick={() => setThanking(false)}>
                {t('drawer.cancel')}
              </button>
              <button className="btn btn--primary" disabled={busy === 'complete'}>
                {busy === 'complete' ? t('drawer.saving') : t('drawer.complete')}
              </button>
            </div>
          </form>
        )}

        <div className="thread" ref={threadRef}>
          <div className="section-label">{t('drawer.conversation')}</div>
          {messages === null && <div className="thread__empty">{t('drawer.loadingThread')}</div>}
          {messages?.length === 0 && <div className="thread__empty">{t('drawer.noMessages')}</div>}
          {messages?.map((m) =>
            m.system ? (
              <div key={m.$id} className="msg msg--system">
                <span>{m.body}</span>
              </div>
            ) : (
              <div key={m.$id} className={`msg ${m.authorId === me?.id ? 'msg--mine' : ''}`}>
                <Avatar id={m.authorId} name={m.authorName} size={24} />
                <div className="msg__bubble">
                  <div className="msg__who">
                    {m.authorName} <span>{timeAgo(m.$createdAt)}</span>
                  </div>
                  {m.body}
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <form className="composer" onSubmit={onSend}>
        <input
          className="input"
          placeholder={me ? t('drawer.write') : t('drawer.joinToReply')}
          value={draft}
          maxLength={1000}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => !me && onRequireJoin()}
        />
        <button className="btn btn--primary btn--icon" disabled={!draft.trim() || busy === 'send'} aria-label={t('drawer.send')}>
          <Send size={16} />
        </button>
      </form>
    </aside>
  );
}
