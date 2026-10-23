import { AppwriteException, ID, Operator, Permission, Query, Role } from 'appwrite';
import { config, tablesDB, TABLES } from './appwrite';
import { logEvent, prettyQuery, track } from './inspector';
import { t } from './i18n';
import { EMERGENCY_CATEGORIES, type Category, type Kind, type Kudos, type LngLat, type Message, type Post, type Urgency } from './types';

const databaseId = config.databaseId;
const show = (queries: string[]) => queries.map(prettyQuery);

export type Me = { id: string; name: string };

// ---------------------------------------------------------------------------
// Reading the map
// ---------------------------------------------------------------------------

export type Filters = {
  center: LngLat;
  radiusKm: number;
  kind: Kind | 'all';
  category: Category | 'all';
  search: string;
  showDone: boolean;
  emergency: boolean;
};

export function nearbyQueries(f: Filters): string[] {
  const queries = [
    // Spatial index on `location` → radius search done by the database, not the browser.
    Query.distanceLessThan('location', f.center, f.radiusKm * 1000, true),
    Query.equal('status', f.showDone ? ['open', 'claimed', 'done'] : ['open', 'claimed']),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ];
  if (f.kind !== 'all') queries.push(Query.equal('kind', f.kind));
  if (f.category !== 'all') queries.push(Query.equal('category', f.category));
  else if (f.emergency) queries.push(Query.equal('category', EMERGENCY_CATEGORIES));
  // Full-text index on `title`; Appwrite requires at least 3 characters.
  if (f.search.trim().length >= 3) queries.push(Query.search('title', f.search.trim()));
  return queries;
}

export async function listNearby(f: Filters): Promise<Post[]> {
  const queries = nearbyQueries(f);
  const res = await track('listRows', TABLES.posts, show(queries), () =>
    tablesDB.listRows<Post>({ databaseId, tableId: TABLES.posts, queries }),
  );
  return res.rows;
}

/** Everything I posted or am helping with: two indexed columns OR-ed together. */
export async function listMine(userId: string): Promise<Post[]> {
  const queries = [
    Query.or([Query.equal('authorId', userId), Query.equal('helperId', userId)]),
    Query.orderDesc('$updatedAt'),
    Query.limit(50),
  ];
  const res = await track('listRows', TABLES.posts, show(queries), () =>
    tablesDB.listRows<Post>({ databaseId, tableId: TABLES.posts, queries }),
  );
  return res.rows;
}

/** One post plus its whole thread, loaded through the posts → messages relationship. */
export async function getPostWithThread(postId: string): Promise<{ post: Post; messages: Message[] }> {
  const queries = [Query.select(['*', 'messages.*'])];
  const row = await track('getRow', TABLES.posts, [`rowId: ${postId}`, ...show(queries)], () =>
    tablesDB.getRow<Post & { messages?: Message[] }>({ databaseId, tableId: TABLES.posts, rowId: postId, queries }),
  );
  const messages = [...(row.messages ?? [])].sort((a, b) => a.$createdAt.localeCompare(b.$createdAt));
  const { messages: _omit, ...post } = row;
  void _omit;
  return { post: post as Post, messages };
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

export type NewPost = {
  kind: Kind;
  category: Category;
  title: string;
  body: string;
  urgency: Urgency;
  location: LngLat;
  expiresInHours: number;
};

export async function createPost(input: NewPost, me: Me): Promise<Post> {
  const expiresAt = new Date(Date.now() + input.expiresInHours * 3600_000).toISOString();
  const row = await track('createRow', TABLES.posts, [`kind: ${input.kind}`, `location: [${input.location.map((n) => n.toFixed(4))}]`], () =>
    tablesDB.createRow({
      databaseId,
      tableId: TABLES.posts,
      rowId: ID.unique(),
      data: {
        kind: input.kind,
        category: input.category,
        title: input.title,
        body: input.body || null,
        urgency: input.urgency,
        location: input.location,
        expiresAt,
        authorId: me.id,
        authorName: me.name,
      },
      // Row security: only the author may delete their post.
      permissions: [Permission.read(Role.any()), Permission.update(Role.users()), Permission.delete(Role.user(me.id))],
    }),
  );
  return row as unknown as Post;
}

export async function deletePost(postId: string) {
  await track(
    'deleteRow',
    TABLES.posts,
    [`rowId: ${postId}`],
    () => tablesDB.deleteRow({ databaseId, tableId: TABLES.posts, rowId: postId }),
    'cascade-deletes the thread via relationship',
  );
}

/** Atomic counter: no read-modify-write race when many neighbours tap the heart at once. */
export async function heartPost(postId: string): Promise<Post> {
  return track('incrementRowColumn', TABLES.posts, [`rowId: ${postId}`, 'column: hearts', 'value: 1'], () =>
    tablesDB.incrementRowColumn<Post>({ databaseId, tableId: TABLES.posts, rowId: postId, column: 'hearts', value: 1 }),
  );
}

export async function sendMessage(postId: string, body: string, me: Me) {
  const msg = await track('createRow', TABLES.messages, [`post → ${postId}`], () =>
    tablesDB.createRow({
      databaseId,
      tableId: TABLES.messages,
      rowId: ID.unique(),
      data: { post: postId, authorId: me.id, authorName: me.name, body },
    }),
  );
  // Server-side operator: the increment happens inside the database.
  await track('updateRow', TABLES.posts, [`rowId: ${postId}`, 'replies: Operator.increment(1)'], () =>
    tablesDB.updateRow({ databaseId, tableId: TABLES.posts, rowId: postId, data: { replies: Operator.increment(1) } }),
  );
  return msg;
}

export class ClaimConflict extends Error {}

/**
 * Claiming is the one place two neighbours can collide: both tap "I can help"
 * on the same request at the same moment. We read the row inside a TablesDB
 * transaction and stage the claim + a system message + reply counter; if
 * anyone else touched the row before commit, Appwrite rejects the commit and
 * nothing is applied.
 */
export async function claimPost(postId: string, me: Me): Promise<void> {
  const tx = await track('createTransaction', '—', ['ttl: 60'], () => tablesDB.createTransaction({ ttl: 60 }));
  const transactionId = tx.$id;
  try {
    const fresh = await track('getRow', TABLES.posts, [`rowId: ${postId}`, `transactionId: ${transactionId}`], () =>
      tablesDB.getRow<Post>({ databaseId, tableId: TABLES.posts, rowId: postId, transactionId }),
    );
    if (fresh.status !== 'open') throw new ClaimConflict(t('conflict.taken', { name: fresh.helperName ?? t('conflict.someone') }));
    if (fresh.authorId === me.id) throw new ClaimConflict(t('conflict.own'));

    await track('updateRow', TABLES.posts, ['status: claimed', `helper: ${me.name}`, '(staged)'], () =>
      tablesDB.updateRow({
        databaseId,
        tableId: TABLES.posts,
        rowId: postId,
        data: { status: 'claimed', helperId: me.id, helperName: me.name, replies: Operator.increment(1) },
        transactionId,
      }),
    );
    await track('createRow', TABLES.messages, ['system message', '(staged)'], () =>
      tablesDB.createRow({
        databaseId,
        tableId: TABLES.messages,
        rowId: ID.unique(),
        data: { post: postId, authorId: me.id, authorName: me.name, body: t('sys.offered', { name: me.name }), system: true },
        transactionId,
      }),
    );
    await track('updateTransaction', '—', ['commit: true'], () => tablesDB.updateTransaction({ transactionId, commit: true }));
  } catch (err) {
    await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => undefined);
    logEvent('updateTransaction', '—', ['rollback: true'], 'claim rolled back');
    if (err instanceof AppwriteException && err.code === 409) {
      throw new ClaimConflict(t('conflict.race'));
    }
    throw err;
  }
}

export async function releasePost(postId: string, me: Me) {
  await track('updateRow', TABLES.posts, [`rowId: ${postId}`, 'status: open'], () =>
    tablesDB.updateRow({
      databaseId,
      tableId: TABLES.posts,
      rowId: postId,
      data: { status: 'open', helperId: null, helperName: null },
    }),
  );
  await sendSystem(postId, me, t('sys.stepBack', { name: me.name }));
}

async function sendSystem(postId: string, me: Me, body: string) {
  await tablesDB.createRow({
    databaseId,
    tableId: TABLES.messages,
    rowId: ID.unique(),
    data: { post: postId, authorId: me.id, authorName: me.name, body, system: true },
  });
}

/**
 * Completing a post touches three rows in two tables. We stage all of it as a
 * single batch with `createOperations` and commit once: the post is marked
 * done, kudos are recorded against the helper, and a thank-you lands in the
 * thread — or none of it happens.
 */
export async function completePost(post: Post, me: Me, points: number, note: string) {
  const tx = await track('createTransaction', '—', ['ttl: 60'], () => tablesDB.createTransaction({ ttl: 60 }));
  const transactionId = tx.$id;
  const operations = [
    {
      action: 'update',
      databaseId,
      tableId: TABLES.posts,
      rowId: post.$id,
      data: { status: 'done' },
    },
    {
      action: 'create',
      databaseId,
      tableId: TABLES.kudos,
      rowId: ID.unique(),
      data: {
        post: post.$id,
        fromId: me.id,
        fromName: me.name,
        toId: post.helperId,
        toName: post.helperName,
        points,
        note: note || null,
      },
    },
    {
      action: 'create',
      databaseId,
      tableId: TABLES.messages,
      rowId: ID.unique(),
      data: {
        post: post.$id,
        authorId: me.id,
        authorName: me.name,
        body: t('sys.done', { name: me.name, helper: post.helperName ?? '', points }) + (note ? `: “${note}”` : ''),
        system: true,
      },
    },
    {
      action: 'increment',
      databaseId,
      tableId: TABLES.posts,
      rowId: post.$id,
      data: { column: 'replies', value: 1 },
    },
  ];
  try {
    await track('createOperations', 'posts · kudos · messages', operations.map((o) => `${o.action} → ${o.tableId}`), () =>
      tablesDB.createOperations({ transactionId, operations }),
    );
    await track('updateTransaction', '—', ['commit: true'], () => tablesDB.updateTransaction({ transactionId, commit: true }));
  } catch (err) {
    await tablesDB.updateTransaction({ transactionId, rollback: true }).catch(() => undefined);
    logEvent('updateTransaction', '—', ['rollback: true'], 'completion rolled back');
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Aggregates: the neighbourhood pulse and the heroes board
// ---------------------------------------------------------------------------

export type PulseRow = { category: Category; n: number };

/**
 * Open posts per category inside the current radius, computed by the database
 * with groupBy + count. Older servers without aggregation support fall back
 * to a narrow `select` and a client-side tally.
 */
export async function pulse(center: LngLat, radiusKm: number): Promise<PulseRow[]> {
  const where = [Query.distanceLessThan('location', center, radiusKm * 1000, true), Query.equal('status', 'open')];
  const queries = [...where, Query.groupBy(['category']), Query.count('$id', 'n')];
  try {
    const res = await track('listRows', TABLES.posts, show(queries), () =>
      tablesDB.listRows({ databaseId, tableId: TABLES.posts, queries, total: false }),
    );
    return (res.rows as unknown as PulseRow[]).map((r) => ({ category: r.category, n: Number(r.n) }));
  } catch {
    const fallback = [...where, Query.select(['category']), Query.limit(500)];
    const res = await track('listRows', TABLES.posts, show(fallback), () =>
      tablesDB.listRows<Post>({ databaseId, tableId: TABLES.posts, queries: fallback, total: false }),
    'aggregation fallback');
    const tally = new Map<Category, number>();
    res.rows.forEach((r) => tally.set(r.category, (tally.get(r.category) ?? 0) + 1));
    return [...tally].map(([category, n]) => ({ category, n }));
  }
}

/** How many posts were completed in the last 7 days — a count, no rows transferred. */
export async function doneThisWeek(): Promise<number> {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const queries = [Query.equal('status', 'done'), Query.updatedAfter(since), Query.limit(1), Query.select(['$id'])];
  const res = await track('listRows', TABLES.posts, show(queries), () =>
    tablesDB.listRows({ databaseId, tableId: TABLES.posts, queries }),
  );
  return res.total;
}

export type Hero = { toId: string; toName: string; points: number; helps: number };

export async function heroes(): Promise<Hero[]> {
  const queries = [Query.groupBy(['toId', 'toName']), Query.sum('points', 'points'), Query.count('$id', 'helps')];
  let rows: Hero[];
  try {
    const res = await track('listRows', TABLES.kudos, show(queries), () =>
      tablesDB.listRows({ databaseId, tableId: TABLES.kudos, queries, total: false }),
    );
    rows = (res.rows as unknown as Hero[]).map((r) => ({ ...r, points: Number(r.points), helps: Number(r.helps) }));
  } catch {
    const fallback = [Query.select(['toId', 'toName', 'points']), Query.limit(1000)];
    const res = await track('listRows', TABLES.kudos, show(fallback), () =>
      tablesDB.listRows<Kudos>({ databaseId, tableId: TABLES.kudos, queries: fallback, total: false }),
    'aggregation fallback');
    const byId = new Map<string, Hero>();
    for (const k of res.rows) {
      const h = byId.get(k.toId) ?? { toId: k.toId, toName: k.toName, points: 0, helps: 0 };
      h.points += k.points;
      h.helps += 1;
      byId.set(k.toId, h);
    }
    rows = [...byId.values()];
  }
  return rows.sort((a, b) => b.points - a.points).slice(0, 8);
}

export async function myKarma(userId: string): Promise<{ points: number; helps: number }> {
  const queries = [Query.equal('toId', userId), Query.sum('points', 'points'), Query.count('$id', 'helps')];
  try {
    const res = await track('listRows', TABLES.kudos, show(queries), () =>
      tablesDB.listRows({ databaseId, tableId: TABLES.kudos, queries, total: false }),
    );
    const r = res.rows[0] as unknown as { points?: number; helps?: number } | undefined;
    return { points: Number(r?.points ?? 0), helps: Number(r?.helps ?? 0) };
  } catch {
    const fallback = [Query.equal('toId', userId), Query.select(['points']), Query.limit(1000)];
    const res = await tablesDB.listRows<Kudos>({ databaseId, tableId: TABLES.kudos, queries: fallback });
    return { points: res.rows.reduce((s, k) => s + k.points, 0), helps: res.total };
  }
}
