// End-to-end check of every TablesDB feature Hearth relies on.
//   npm run smoke

import { Client, TablesDB, Query, ID, Operator } from 'node-appwrite';

const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'seva';
const center = [Number(process.env.VITE_DEFAULT_LNG ?? 88.3639), Number(process.env.VITE_DEFAULT_LAT ?? 22.5726)];
const db = new TablesDB(
  new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY),
);

let failed = 0;
async function check(name, fn) {
  try {
    const info = await fn();
    console.log(`  ✓ ${name}${info !== undefined ? `  → ${info}` : ''}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}  → ${err?.code ?? ''} ${err?.message ?? err}`);
  }
}

const list = (tableId, queries, extra = {}) => db.listRows({ databaseId, tableId, queries, ...extra });

let post;
await check('spatial radius search (distanceLessThan, meters)', async () => {
  const near = await list('posts', [Query.distanceLessThan('location', center, 3000, true), Query.limit(100)]);
  const wide = await list('posts', [Query.distanceLessThan('location', center, 20000, true), Query.limit(100)]);
  if (!(wide.total > near.total && near.total > 0)) throw new Error(`3km=${near.total} 20km=${wide.total}`);
  return `3 km: ${near.total}, 20 km: ${wide.total}`;
});

await check('feed query (status in + order + compound index)', async () => {
  const r = await list('posts', [
    Query.distanceLessThan('location', center, 5000, true),
    Query.equal('status', ['open', 'claimed']),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ]);
  post = r.rows.find((p) => p.status === 'open');
  return `${r.total} rows`;
});

await check('full-text search', async () => {
  const r = await list('posts', [Query.search('title', 'ladder')]);
  return `${r.total} match "ladder"`;
});

await check('relationship load (select messages.*)', async () => {
  const withThread = (await list('posts', [Query.greaterThan('replies', 1), Query.limit(1)])).rows[0];
  const r = await db.getRow({ databaseId, tableId: 'posts', rowId: withThread.$id, queries: [Query.select(['*', 'messages.*'])] });
  if (!Array.isArray(r.messages) || !r.messages.length) throw new Error('no messages loaded');
  return `${r.messages.length} messages`;
});

await check('aggregation: groupBy category + count', async () => {
  const r = await list('posts', [Query.equal('status', 'open'), Query.groupBy(['category']), Query.count('$id', 'n')], { total: false });
  return JSON.stringify(r.rows.slice(0, 3));
});

await check('aggregation: groupBy helper + sum + count', async () => {
  const r = await list('kudos', [Query.groupBy(['toId', 'toName']), Query.sum('points', 'points'), Query.count('$id', 'helps')], { total: false });
  return JSON.stringify(r.rows.slice(0, 2));
});

await check('Query.or on two indexed columns', async () => {
  const r = await list('posts', [Query.or([Query.equal('authorId', 'seed-arijit'), Query.equal('helperId', 'seed-arijit')])]);
  return `${r.total} rows`;
});

await check('count via updatedAfter + limit(1)', async () => {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const r = await list('posts', [Query.equal('status', 'done'), Query.updatedAfter(since), Query.limit(1), Query.select(['$id'])]);
  return `total ${r.total}`;
});

await check('atomic incrementRowColumn + Operator.increment', async () => {
  const a = await db.incrementRowColumn({ databaseId, tableId: 'posts', rowId: post.$id, column: 'hearts', value: 1 });
  const b = await db.updateRow({ databaseId, tableId: 'posts', rowId: post.$id, data: { hearts: Operator.decrement(1) } });
  return `hearts ${a.hearts} → ${b.hearts}`;
});

// A disposable post for the transaction tests.
const temp = await db.createRow({
  databaseId,
  tableId: 'posts',
  rowId: ID.unique(),
  data: { kind: 'request', category: 'other', title: 'smoke test', location: center, authorId: 'smoke-a', authorName: 'Smoke' },
});

await check('transaction: read + staged writes + commit', async () => {
  const tx = await db.createTransaction({ ttl: 60 });
  const fresh = await db.getRow({ databaseId, tableId: 'posts', rowId: temp.$id, transactionId: tx.$id });
  if (fresh.status !== 'open') throw new Error('expected open');
  await db.updateRow({ databaseId, tableId: 'posts', rowId: temp.$id, data: { status: 'claimed', helperId: 'smoke-b', helperName: 'B', replies: Operator.increment(1) }, transactionId: tx.$id });
  await db.createRow({ databaseId, tableId: 'messages', rowId: ID.unique(), data: { post: temp.$id, authorId: 'smoke-b', authorName: 'B', body: 'on it', system: true }, transactionId: tx.$id });
  await db.updateTransaction({ transactionId: tx.$id, commit: true });
  const after = await db.getRow({ databaseId, tableId: 'posts', rowId: temp.$id });
  return `status ${after.status}, replies ${after.replies}`;
});

await check('transaction conflict is rejected (double claim)', async () => {
  await db.updateRow({ databaseId, tableId: 'posts', rowId: temp.$id, data: { status: 'open', helperId: null, helperName: null } });
  const tx = await db.createTransaction({ ttl: 60 });
  await db.getRow({ databaseId, tableId: 'posts', rowId: temp.$id, transactionId: tx.$id });
  await db.updateRow({ databaseId, tableId: 'posts', rowId: temp.$id, data: { status: 'claimed', helperId: 'smoke-c', helperName: 'C' }, transactionId: tx.$id });
  // Someone else claims it outside the transaction before we commit.
  await db.updateRow({ databaseId, tableId: 'posts', rowId: temp.$id, data: { status: 'claimed', helperId: 'smoke-d', helperName: 'D' } });
  try {
    await db.updateTransaction({ transactionId: tx.$id, commit: true });
  } catch (err) {
    await db.updateTransaction({ transactionId: tx.$id, rollback: true }).catch(() => undefined);
    const after = await db.getRow({ databaseId, tableId: 'posts', rowId: temp.$id });
    if (after.helperId !== 'smoke-d') throw new Error('loser overwrote winner');
    return `rejected with ${err.code} (${err.type}); winner kept`;
  }
  throw new Error('commit succeeded — no conflict detection');
});

await check('createOperations batch across 3 tables + commit', async () => {
  const tx = await db.createTransaction({ ttl: 60 });
  await db.createOperations({
    transactionId: tx.$id,
    operations: [
      { action: 'update', databaseId, tableId: 'posts', rowId: temp.$id, data: { status: 'done' } },
      { action: 'create', databaseId, tableId: 'kudos', rowId: ID.unique(), data: { post: temp.$id, fromId: 'smoke-a', fromName: 'Smoke', toId: 'smoke-d', toName: 'D', points: 5 } },
      { action: 'create', databaseId, tableId: 'messages', rowId: ID.unique(), data: { post: temp.$id, authorId: 'smoke-a', authorName: 'Smoke', body: 'thanks', system: true } },
      { action: 'increment', databaseId, tableId: 'posts', rowId: temp.$id, data: { column: 'replies', value: 1 } },
    ],
  });
  await db.updateTransaction({ transactionId: tx.$id, commit: true });
  const after = await db.getRow({ databaseId, tableId: 'posts', rowId: temp.$id, queries: [Query.select(['*', 'kudos.*'])] });
  return `status ${after.status}, replies ${after.replies}, kudos ${after.kudos?.length}`;
});

await check('cascade delete removes the thread', async () => {
  await db.deleteRow({ databaseId, tableId: 'posts', rowId: temp.$id });
  const orphans = await list('messages', [Query.equal('authorId', 'smoke-b')]);
  const kudos = await list('kudos', [Query.equal('fromId', 'smoke-a')]);
  for (const k of kudos.rows) await db.deleteRow({ databaseId, tableId: 'kudos', rowId: k.$id });
  return `orphan messages: ${orphans.total}`;
});

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
