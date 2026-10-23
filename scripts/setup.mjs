// Provisions the Hearth schema on Appwrite TablesDB.
// Idempotent: re-running skips anything that already exists.
//
//   cp .env.example .env   # fill in project id + a server API key
//   npm run setup

import {
  Client,
  TablesDB,
  Permission,
  Role,
  RelationshipType,
  RelationMutate,
  TablesDBIndexType,
  OrderBy,
} from 'node-appwrite';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'seva';

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env');
  process.exit(1);
}

const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
const db = new TablesDB(client);

// Keep in sync with CATEGORIES in src/lib/types.ts; emergency categories come first.
const CATEGORIES = ['rescue', 'medicine', 'water', 'shelter', 'food', 'groceries', 'rides', 'care', 'tools', 'tech', 'pets', 'other'];

/** Run a create call, treating "already exists" (409) as success. */
async function ensure(label, fn) {
  try {
    await fn();
    console.log(`  + ${label}`);
  } catch (err) {
    if (err?.code === 409) {
      console.log(`  = ${label} (exists)`);
      return;
    }
    console.error(`  ! ${label}: ${err?.message ?? err}`);
    throw err;
  }
}

/** Columns are created asynchronously; indexes need them to be `available` first. */
async function waitForColumns(tableId) {
  for (let i = 0; i < 60; i++) {
    const { columns } = await db.listColumns({ databaseId, tableId });
    const pending = columns.filter((c) => c.status !== 'available');
    const failed = columns.filter((c) => c.status === 'failed');
    if (failed.length) throw new Error(`Columns failed on ${tableId}: ${failed.map((c) => c.key).join(', ')}`);
    if (!pending.length) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for columns on ${tableId}`);
}

const base = (tableId) => ({ databaseId, tableId });

async function main() {
  console.log(`Provisioning database "${databaseId}" on ${endpoint}`);

  await ensure(`database ${databaseId}`, () => db.create({ databaseId, name: 'Hearth' }));

  // ---------- posts: a request for help or an offer of help, pinned to a point ----------
  await ensure('table posts', () =>
    db.createTable({
      ...base('posts'),
      name: 'Posts',
      // Anyone can browse the map; signed-in neighbours can post and claim.
      // Row security lets each author additionally own delete on their own post.
      permissions: [Permission.read(Role.any()), Permission.create(Role.users()), Permission.update(Role.users())],
      rowSecurity: true,
    }),
  );
  const p = base('posts');
  await ensure('posts.kind', () => db.createEnumColumn({ ...p, key: 'kind', elements: ['request', 'offer'], required: true }));
  await ensure('posts.category', () => db.createEnumColumn({ ...p, key: 'category', elements: CATEGORIES, required: true }));
  await ensure('posts.title', () => db.createVarcharColumn({ ...p, key: 'title', size: 120, required: true }));
  await ensure('posts.body', () => db.createTextColumn({ ...p, key: 'body', required: false }));
  await ensure('posts.location', () => db.createPointColumn({ ...p, key: 'location', required: true }));
  await ensure('posts.status', () =>
    db.createEnumColumn({ ...p, key: 'status', elements: ['open', 'claimed', 'done'], required: false, xdefault: 'open' }),
  );
  await ensure('posts.urgency', () =>
    db.createEnumColumn({ ...p, key: 'urgency', elements: ['low', 'normal', 'high'], required: false, xdefault: 'normal' }),
  );
  await ensure('posts.authorId', () => db.createVarcharColumn({ ...p, key: 'authorId', size: 36, required: true }));
  await ensure('posts.authorName', () => db.createVarcharColumn({ ...p, key: 'authorName', size: 64, required: true }));
  await ensure('posts.helperId', () => db.createVarcharColumn({ ...p, key: 'helperId', size: 36, required: false }));
  await ensure('posts.helperName', () => db.createVarcharColumn({ ...p, key: 'helperName', size: 64, required: false }));
  await ensure('posts.hearts', () => db.createIntegerColumn({ ...p, key: 'hearts', required: false, min: 0, xdefault: 0 }));
  await ensure('posts.replies', () => db.createIntegerColumn({ ...p, key: 'replies', required: false, min: 0, xdefault: 0 }));
  await ensure('posts.expiresAt', () => db.createDatetimeColumn({ ...p, key: 'expiresAt', required: false }));

  // ---------- messages: the conversation thread under each post ----------
  await ensure('table messages', () =>
    db.createTable({
      ...base('messages'),
      name: 'Messages',
      permissions: [Permission.read(Role.any()), Permission.create(Role.users())],
      rowSecurity: false,
    }),
  );
  const m = base('messages');
  await ensure('messages.authorId', () => db.createVarcharColumn({ ...m, key: 'authorId', size: 36, required: true }));
  await ensure('messages.authorName', () => db.createVarcharColumn({ ...m, key: 'authorName', size: 64, required: true }));
  await ensure('messages.body', () => db.createVarcharColumn({ ...m, key: 'body', size: 1000, required: true }));
  await ensure('messages.system', () => db.createBooleanColumn({ ...m, key: 'system', required: false, xdefault: false }));

  // ---------- kudos: thanks + points given when a post is completed ----------
  await ensure('table kudos', () =>
    db.createTable({
      ...base('kudos'),
      name: 'Kudos',
      permissions: [Permission.read(Role.any()), Permission.create(Role.users())],
      rowSecurity: false,
    }),
  );
  const k = base('kudos');
  await ensure('kudos.fromId', () => db.createVarcharColumn({ ...k, key: 'fromId', size: 36, required: true }));
  await ensure('kudos.fromName', () => db.createVarcharColumn({ ...k, key: 'fromName', size: 64, required: true }));
  await ensure('kudos.toId', () => db.createVarcharColumn({ ...k, key: 'toId', size: 36, required: true }));
  await ensure('kudos.toName', () => db.createVarcharColumn({ ...k, key: 'toName', size: 64, required: true }));
  await ensure('kudos.points', () => db.createIntegerColumn({ ...k, key: 'points', required: true, min: 1, max: 5 }));
  await ensure('kudos.note', () => db.createVarcharColumn({ ...k, key: 'note', size: 280, required: false }));

  // ---------- relationships ----------
  // posts 1 ── * messages  (deleting a post cascades its thread)
  await ensure('posts.messages <-> messages.post', () =>
    db.createRelationshipColumn({
      ...p,
      relatedTableId: 'messages',
      type: RelationshipType.OneToMany,
      twoWay: true,
      key: 'messages',
      twoWayKey: 'post',
      onDelete: RelationMutate.Cascade,
    }),
  );
  // posts 1 ── * kudos  (kudos outlive a deleted post, so we only null the link)
  await ensure('posts.kudos <-> kudos.post', () =>
    db.createRelationshipColumn({
      ...p,
      relatedTableId: 'kudos',
      type: RelationshipType.OneToMany,
      twoWay: true,
      key: 'kudos',
      twoWayKey: 'post',
      onDelete: RelationMutate.SetNull,
    }),
  );

  console.log('Waiting for columns to become available…');
  await Promise.all(['posts', 'messages', 'kudos'].map(waitForColumns));

  // ---------- indexes ----------
  await ensure('idx posts.location (spatial)', () =>
    db.createIndex({ ...p, key: 'idx_location', type: TablesDBIndexType.Spatial, columns: ['location'] }),
  );
  await ensure('idx posts.title (fulltext)', () =>
    db.createIndex({ ...p, key: 'idx_title_search', type: TablesDBIndexType.Fulltext, columns: ['title'] }),
  );
  await ensure('idx posts.status+createdAt', () =>
    db.createIndex({
      ...p,
      key: 'idx_status_created',
      type: TablesDBIndexType.Key,
      columns: ['status', '$createdAt'],
      orders: [OrderBy.Asc, OrderBy.Desc],
    }),
  );
  await ensure('idx posts.category', () =>
    db.createIndex({ ...p, key: 'idx_category', type: TablesDBIndexType.Key, columns: ['category'] }),
  );
  await ensure('idx posts.authorId', () =>
    db.createIndex({ ...p, key: 'idx_author', type: TablesDBIndexType.Key, columns: ['authorId'] }),
  );
  await ensure('idx posts.helperId', () =>
    db.createIndex({ ...p, key: 'idx_helper', type: TablesDBIndexType.Key, columns: ['helperId'] }),
  );
  await ensure('idx messages.createdAt', () =>
    db.createIndex({ ...m, key: 'idx_created', type: TablesDBIndexType.Key, columns: ['$createdAt'] }),
  );
  await ensure('idx kudos.toId', () =>
    db.createIndex({ ...k, key: 'idx_to', type: TablesDBIndexType.Key, columns: ['toId'] }),
  );

  console.log('\nDone. Next: `npm run seed` for demo data, then `npm run dev`.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
