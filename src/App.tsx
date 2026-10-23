import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Inbox, Languages, LocateFixed, Plus, Search, Sprout, Star, TriangleAlert } from 'lucide-react';
import { ComposeSheet } from './components/ComposeSheet';
import { Heroes } from './components/Heroes';
import { Inspector } from './components/Inspector';
import { JoinDialog } from './components/JoinDialog';
import { MapView } from './components/MapView';
import { PostCard } from './components/PostCard';
import { PostDrawer } from './components/PostDrawer';
import { PulseBar } from './components/PulseBar';
import { SetupScreen } from './components/SetupScreen';
import { Avatar } from './components/Avatar';
import { useRealtime, type RowEvent } from './hooks/useRealtime';
import { useSession } from './hooks/useSession';
import {
  createPost,
  doneThisWeek,
  heroes as loadHeroes,
  listMine,
  listNearby,
  myKarma,
  pulse as loadPulse,
  type Filters,
  type Hero,
  type NewPost,
  type PulseRow,
} from './lib/api';
import { config, isConfigured } from './lib/appwrite';
import { distanceKm } from './lib/format';
import { LANGS, useLang, type Lang } from './lib/i18n';
import { isEmergency, type Category, type Kind, type LngLat, type Message, type Post } from './lib/types';

type Tab = 'nearby' | 'mine' | 'heroes';
type Toast = { id: number; msg: string; tone: 'ok' | 'warn' | 'err' };

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function usePrefersDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

function matches(p: Post, f: Filters) {
  if (distanceKm(f.center, p.location) > f.radiusKm) return false;
  if (!f.showDone && p.status === 'done') return false;
  if (f.kind !== 'all' && p.kind !== f.kind) return false;
  if (f.category !== 'all' && p.category !== f.category) return false;
  if (f.emergency && !isEmergency(p.category)) return false;
  if (f.search.trim().length >= 3 && !p.title.toLowerCase().includes(f.search.trim().toLowerCase())) return false;
  return true;
}

export default function App() {
  const { lang, setLang, t } = useLang();
  const { state, join, leave } = useSession();
  const me = state.status === 'ready' ? state.me : null;
  const dark = usePrefersDark();

  const [center, setCenter] = useState<LngLat>(config.defaultCenter);
  const [myLocation, setMyLocation] = useState<LngLat | null>(null);
  const [flyTo, setFlyTo] = useState<{ at: LngLat; seq: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(3);
  const [kind, setKind] = useState<Kind | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [tab, setTab] = useState<Tab>('nearby');

  const [posts, setPosts] = useState<Post[]>([]);
  const [mine, setMine] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinDismissed, setJoinDismissed] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const [pulseRows, setPulseRows] = useState<PulseRow[]>([]);
  const [doneWeek, setDoneWeek] = useState<number | null>(null);
  const [heroList, setHeroList] = useState<Hero[]>([]);
  const [karma, setKarma] = useState<{ points: number; helps: number } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const bus = useMemo(() => new EventTarget(), []);
  const panelRef = useRef<HTMLElement>(null);

  // On phones the panel scrolls as a whole; start each view at the top.
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [selectedId, composing, tab]);

  const queryCenter = useDebounced(center, 350);
  const querySearch = useDebounced(search, 300);
  const filters: Filters = useMemo(
    () => ({ center: queryCenter, radiusKm, kind, category, search: querySearch, showDone, emergency }),
    [queryCenter, radiusKm, kind, category, querySearch, showDone, emergency],
  );
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const toast = useCallback((msg: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  // Open the join dialog once for first-time visitors.
  useEffect(() => {
    if (state.status === 'guest' && !joinDismissed) setJoinOpen(true);
    if (state.status === 'ready') setJoinOpen(false);
  }, [state.status, joinDismissed]);

  // Centre on the neighbour's real location when the browser allows it.
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const here: LngLat = [pos.coords.longitude, pos.coords.latitude];
        setMyLocation(here);
        setFlyTo({ at: here, seq: Date.now() });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 6000 },
    );
  }, []);

  // ---- the main radius query ----
  useEffect(() => {
    if (!isConfigured) return;
    let alive = true;
    setLoading(true);
    listNearby(filters)
      .then((rows) => {
        if (!alive) return;
        setPosts(rows);
        setLoadError(null);
      })
      .catch((err) => alive && setLoadError(err instanceof Error ? err.message : String(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [filters]);

  // ---- aggregates ----
  const statsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const refreshStats = useCallback(
    (delay = 0) => {
      clearTimeout(statsTimer.current);
      statsTimer.current = setTimeout(() => {
        const f = filtersRef.current;
        loadPulse(f.center, f.radiusKm).then(setPulseRows).catch(() => undefined);
        doneThisWeek().then(setDoneWeek).catch(() => undefined);
        loadHeroes().then(setHeroList).catch(() => undefined);
        if (me) myKarma(me.id).then(setKarma).catch(() => undefined);
      }, delay);
    },
    [me],
  );
  useEffect(() => {
    if (isConfigured) refreshStats();
  }, [filters.center, filters.radiusKm, refreshStats]);

  const refreshMine = useCallback(() => {
    if (me) listMine(me.id).then(setMine).catch(() => undefined);
  }, [me]);
  useEffect(() => {
    if (tab === 'mine') refreshMine();
  }, [tab, refreshMine]);

  // ---- realtime ----
  const markFresh = (id: string) => {
    setFreshIds((s) => new Set(s).add(id));
    setTimeout(
      () =>
        setFreshIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        }),
      6000,
    );
  };

  const onRealtime = useCallback(
    (e: RowEvent) => {
      if (e.table === 'posts') {
        const p = e.payload as unknown as Post;
        if (e.action === 'delete') {
          setPosts((list) => list.filter((x) => x.$id !== p.$id));
          setSelectedId((id) => (id === p.$id ? null : id));
        } else {
          setPosts((list) => {
            const exists = list.some((x) => x.$id === p.$id);
            const fits = matches(p, filtersRef.current);
            if (exists) return fits ? list.map((x) => (x.$id === p.$id ? { ...x, ...p } : x)) : list.filter((x) => x.$id !== p.$id);
            return fits ? [p, ...list] : list;
          });
          if (e.action === 'create' && matches(p, filtersRef.current)) markFresh(p.$id);
          if (me && (p.authorId === me.id || p.helperId === me.id)) refreshMine();
        }
        refreshStats(800);
      } else if (e.table === 'messages') {
        const m = e.payload as unknown as Message & { post?: string | { $id: string } | null };
        const postId = typeof m.post === 'string' ? m.post : (m.post?.$id ?? null);
        bus.dispatchEvent(new CustomEvent('message', { detail: { postId, message: m } }));
      } else if (e.table === 'kudos') {
        refreshStats(300);
      }
    },
    [bus, me, refreshMine, refreshStats],
  );
  const live = useRealtime(onRealtime, isConfigured);

  // ---- actions ----
  const requireJoin = () => setJoinOpen(true);

  const startCompose = () => {
    if (!me) return requireJoin();
    setSelectedId(null);
    setComposing(true);
  };

  const submitPost = async (input: NewPost) => {
    if (!me) return requireJoin();
    try {
      const post = await createPost(input, me);
      setComposing(false);
      setPosts((list) => (list.some((x) => x.$id === post.$id) ? list : [post, ...list]));
      markFresh(post.$id);
      setSelectedId(post.$id);
      toast(t('toast.published'));
    } catch (err) {
      toast(err instanceof Error ? err.message : t('toast.postFailed'), 'err');
    }
  };

  const select = (id: string) => {
    setComposing(false);
    setSelectedId(id);
  };

  if (!isConfigured) return <SetupScreen />;

  // In emergency mode, urgent posts rise to the top; otherwise newest first (as queried).
  const URGENCY_RANK = { high: 0, normal: 1, low: 2 } as const;
  const visible =
    tab === 'mine'
      ? mine
      : emergency
        ? [...posts].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency])
        : posts;
  const selectedPost = posts.find((p) => p.$id === selectedId) ?? mine.find((p) => p.$id === selectedId);
  const origin = myLocation ?? center;

  return (
    <div className={`app ${dark ? 'app--dark' : ''}`}>
      <section className="panel" ref={panelRef}>
        <header className="topbar">
          <div className="brand">
            <img src="/hearth.svg" alt="" />
            <span className="brand__name">Hearth</span>
            <span className={`live ${live ? 'live--on' : ''}`} title={live ? t('app.live') : t('app.offline')}>
              <i /> {live ? t('app.live') : t('app.offline')}
            </span>
          </div>
          <div className="topbar__right">
          <label className="lang" title={t('app.language')}>
            <Languages size={15} />
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} aria-label={t('app.language')}>
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          {me ? (
            <button className="me" onClick={() => confirm(t('app.signOut', { name: me.name })) && leave()} title={me.name}>
              {karma && karma.points > 0 && <span className="me__karma" title={t('app.kudosReceived')}>
                  <Star size={12} fill="currentColor" /> {karma.points}
                </span>}
              <Avatar id={me.id} name={me.name} size={30} />
            </button>
          ) : (
            <button className="btn btn--sm" onClick={requireJoin}>
              {t('app.join')}
            </button>
          )}
          </div>
        </header>

        {selectedId ? (
          <PostDrawer
            key={selectedId}
            postId={selectedId}
            livePost={selectedPost}
            me={me}
            origin={origin}
            bus={bus}
            onClose={() => setSelectedId(null)}
            onRequireJoin={requireJoin}
            onFocus={(at) => setFlyTo({ at, seq: Date.now() })}
            toast={toast}
          />
        ) : composing ? (
          <ComposeSheet pin={center} onCancel={() => setComposing(false)} onSubmit={submitPost} />
        ) : (
          <>
            <nav className="tabs">
              {(['nearby', 'mine', 'heroes'] as Tab[]).map((tb) => (
                <button key={tb} className={tab === tb ? 'on' : ''} onClick={() => (tb === 'mine' && !me ? requireJoin() : setTab(tb))}>
                  {t(`tabs.${tb}`)}
                </button>
              ))}
            </nav>

            {tab === 'heroes' ? (
              <div className="scroll">
                <div className="section-head">
                  <div className="section-label">{t('heroes.title')}</div>
                  <p className="section-note">{t('heroes.note')}</p>
                </div>
                <Heroes heroes={heroList} meId={me?.id} />
              </div>
            ) : (
              <>
                {tab === 'nearby' && (
                  <>
                    <PulseBar
                      rows={pulseRows}
                      doneThisWeek={doneWeek}
                      active={category}
                      onPick={setCategory}
                      emergency={emergency}
                      onEmergency={(on) => {
                        setEmergency(on);
                        setCategory('all');
                      }}
                    />
                    <div className="filters">
                      <div className="search">
                        <Search size={15} />
                        <input className="input" placeholder={t('filters.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
                      </div>
                      <div className="filters__row">
                        <div className="seg seg--sm">
                          {(['all', 'request', 'offer'] as const).map((k) => (
                            <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                              {k === 'all' ? t('filters.all') : k === 'request' ? t('filters.requests') : t('filters.offers')}
                            </button>
                          ))}
                        </div>
                        <label className="radius">
                          <input type="range" min={0.5} max={20} step={0.5} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
                          <span>{radiusKm} km</span>
                        </label>
                      </div>
                      <label className="toggle">
                        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> {t('filters.showDone')}
                      </label>
                    </div>
                  </>
                )}
                <div className="scroll feed">
                  {loadError && <div className="notice notice--err">{t('feed.loadError', { error: loadError })}</div>}
                  {loading && !visible.length && !loadError && [0, 1, 2].map((i) => <div key={i} className="card card--skeleton" />)}
                  {!loading && !visible.length && !loadError && (
                    <div className="empty">
                      <div className="empty__icon">{tab === 'mine' ? <Sprout size={22} /> : <Inbox size={22} />}</div>
                      <p>
                        {tab === 'mine' ? t('empty.mine') : emergency ? t('empty.emergency') : t('empty.nearby')}
                      </p>
                      <button className="btn btn--primary" onClick={startCompose}>
                        <Plus size={16} /> {t('action.newPost')}
                      </button>
                    </div>
                  )}
                  {visible.map((p) => (
                    <PostCard key={p.$id} post={p} origin={origin} selected={p.$id === selectedId} fresh={freshIds.has(p.$id)} onSelect={() => select(p.$id)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <MapView
        center={center}
        radiusKm={radiusKm}
        posts={tab === 'mine' ? mine : posts}
        selectedId={selectedId}
        freshIds={freshIds}
        composing={composing}
        dark={dark}
        me={myLocation}
        onMove={setCenter}
        onSelect={select}
        flyTo={flyTo}
      />

      <div className="map-actions">
        {myLocation && (
          <button className="fab fab--sm" onClick={() => setFlyTo({ at: myLocation, seq: Date.now() })} title={t('action.myLocation')} aria-label={t('action.myLocation')}>
            <LocateFixed size={18} />
          </button>
        )}
        {!composing && (
          <button className="fab" onClick={startCompose}>
            <Plus size={18} strokeWidth={2.5} /> {t('action.newPost')}
          </button>
        )}
      </div>

      <Inspector open={inspectorOpen} onToggle={() => setInspectorOpen((o) => !o)} />

      <div className="toasts" aria-live="polite">
        {toasts.map((ts) => (
          <div key={ts.id} className={`toast toast--${ts.tone}`}>
            {ts.tone === 'ok' ? <CircleCheck size={16} /> : ts.tone === 'warn' ? <TriangleAlert size={16} /> : <CircleAlert size={16} />}
            {ts.msg}
          </div>
        ))}
      </div>

      {joinOpen && state.status === 'guest' && (
        <JoinDialog
          onJoin={async (name) => {
            await join(name);
            toast(t('toast.welcome', { name }));
          }}
          onBrowse={() => {
            setJoinOpen(false);
            setJoinDismissed(true);
          }}
        />
      )}
    </div>
  );
}
