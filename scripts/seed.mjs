// Seeds a believable neighbourhood around VITE_DEFAULT_LAT/LNG.
//
//   npm run seed              # ~45 posts with threads, claims and kudos
//   npm run seed -- --live    # then keep adding activity every few seconds
//                             # (great for demoing Realtime in a second tab)
//   npm run seed -- --reset   # wipe the three tables first

import { Client, TablesDB, ID, Permission, Role, Query } from 'node-appwrite';

const endpoint = process.env.VITE_APPWRITE_ENDPOINT;
const projectId = process.env.VITE_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || 'seva';
const lat0 = Number(process.env.VITE_DEFAULT_LAT ?? 22.5726);
const lng0 = Number(process.env.VITE_DEFAULT_LNG ?? 88.3639);

if (!endpoint || !projectId || !apiKey) {
  console.error('Missing VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID or APPWRITE_API_KEY in .env');
  process.exit(1);
}

const db = new TablesDB(new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey));
const args = new Set(process.argv.slice(2));

const PEOPLE = [
  'Asha', 'Rohan', 'Meera', 'Kabir', 'Priya', 'Arjun', 'Zoya', 'Dev', 'Nisha', 'Vikram',
  'Ananya', 'Farhan', 'Lakshmi', 'Ishaan', 'Tara', 'Sameer', 'Aditi', 'Neil',
].map((name) => ({ id: `seed-${name.toLowerCase()}`, name }));

const IDEAS = [
  ['request', 'tools', 'Need a power drill for 20 minutes', 'Putting up curtain rods. Will return it right away, promise!', 'normal'],
  ['request', 'tools', 'Anyone have a ladder I can borrow this evening?', 'Changing a ceiling bulb, 8ft should do.', 'normal'],
  ['offer', 'tools', 'Lending my pressure washer this weekend', 'Free to borrow, just bring it back clean-ish.', 'low'],
  ['request', 'groceries', 'Could someone pick up milk and bread?', 'Down with a fever, happy to pay via UPI.', 'high'],
  ['offer', 'groceries', 'Going to the market at 6, can pick up for 2 people', 'Short lists please', 'normal'],
  ['request', 'rides', 'Ride to the station tomorrow 7am', 'Have one suitcase. Will split fuel.', 'normal'],
  ['offer', 'rides', 'Driving to the airport Sunday morning, 2 seats free', 'Leaving around 5:30am.', 'low'],
  ['request', 'rides', 'Need a lift to the hospital for a check-up', 'Appointment at 11, my car is in the shop.', 'high'],
  ['request', 'tech', 'Help setting up WhatsApp video on my mother’s phone', 'She wants to call her grandkids. 15 mins max.', 'normal'],
  ['offer', 'tech', 'Free laptop clean-up and virus check', 'I’m a sysadmin, happy to help seniors especially.', 'low'],
  ['request', 'tech', 'Wi-Fi router keeps dropping — anyone techy?', 'Tried restarting a dozen times.', 'normal'],
  ['request', 'care', 'Someone to sit with my dad for an hour', 'He’s 82 and loves cricket talk. Thursday afternoon.', 'normal'],
  ['offer', 'care', 'Can walk with elderly neighbours in the evening', 'Park loop, 6–7pm, any day.', 'low'],
  ['request', 'care', 'Need help carrying groceries up 4 floors', 'Lift is broken again', 'high'],
  ['offer', 'food', 'Made too much biryani — 3 portions free', 'Veg. Pick up before 9pm.', 'normal'],
  ['offer', 'food', 'Fresh mangoes from our tree, take a bag', 'Leaving them by the gate.', 'low'],
  ['request', 'food', 'Looking for a home-cooked tiffin this week', 'Recovering from surgery, will pay.', 'normal'],
  ['offer', 'food', 'Extra sourdough loaf, baked this morning', '', 'low'],
  ['request', 'pets', 'Can someone feed my cat Sat–Sun?', 'Very friendly, just needs food + water.', 'normal'],
  ['offer', 'pets', 'Dog walking — I walk mine at 7am anyway', 'Happy to take one more.', 'low'],
  ['request', 'pets', 'Found a lost beagle near the temple', 'Brown collar, no tag. Is he yours?', 'high'],
  ['request', 'other', 'Need 4 folding chairs for a small puja', 'Saturday only.', 'normal'],
  ['offer', 'other', 'Giving away kids’ books (age 5–8)', 'Two boxes, all in good shape.', 'low'],
  ['request', 'other', 'Help moving a sofa to the next building', 'Need two strong hands for 15 mins.', 'normal'],
  ['offer', 'tech', 'Can teach basic Excel on weekends', 'Free for students.', 'low'],
  ['request', 'groceries', 'Need baby formula urgently, store is closed', 'Brand flexible. Will pay double!', 'high'],
  ['offer', 'care', 'Can help fill government forms online', 'Pension, Aadhaar updates etc.', 'low'],
  ['request', 'tools', 'Borrowing a sewing machine for a day', 'Hemming school uniforms.', 'low'],
];

const CHAT = [
  'Hi! I live two lanes away, can come by.',
  'Is this still needed?',
  'Thank you so much',
  'Sending you my number on here.',
  'Be there in 10 mins.',
  'I can do tomorrow if today doesn’t work.',
  'Amazing, see you soon!',
];

const THANKS = ['Lifesaver!', 'So kind, thank you', 'Above and beyond', 'Super quick, thanks!', ''];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const pickOther = (exclude) => pick(PEOPLE.filter((p) => p.id !== exclude.id));

/** Random point within `km` of the centre, biased towards the middle. */
function scatter(km) {
  const r = (Math.random() ** 0.7 * km) / 111;
  const t = Math.random() * 2 * Math.PI;
  return [+(lng0 + (r * Math.cos(t)) / Math.cos((lat0 * Math.PI) / 180)).toFixed(6), +(lat0 + r * Math.sin(t)).toFixed(6)];
}

const perms = [Permission.read(Role.any()), Permission.update(Role.users())];

async function message(postId, who, body, system = false) {
  await db.createRow({
    databaseId,
    tableId: 'messages',
    rowId: ID.unique(),
    data: { post: postId, authorId: who.id, authorName: who.name, body, system },
  });
}

async function makePost(idea, { fate = 'open', km = 4 } = {}) {
  const [kind, category, title, body, urgency] = idea;
  const author = pick(PEOPLE);
  const post = await db.createRow({
    databaseId,
    tableId: 'posts',
    rowId: ID.unique(),
    data: {
      kind,
      category,
      title,
      body: body || null,
      urgency,
      location: scatter(km),
      authorId: author.id,
      authorName: author.name,
      expiresAt: new Date(Date.now() + (6 + Math.random() * 120) * 3600_000).toISOString(),
      hearts: Math.floor(Math.random() * 6),
    },
    permissions: perms,
  });

  let replies = 0;
  if (fate !== 'open' || Math.random() < 0.4) {
    const helper = pickOther(author);
    await message(post.$id, helper, pick(CHAT));
    replies++;
    if (fate !== 'open') {
      await message(post.$id, helper, `${helper.name} offered to help`, true);
      await message(post.$id, author, pick(CHAT));
      replies += 2;
      await db.updateRow({
        databaseId,
        tableId: 'posts',
        rowId: post.$id,
        data: { status: 'claimed', helperId: helper.id, helperName: helper.name },
      });
    }
    if (fate === 'done') {
      const points = 3 + Math.floor(Math.random() * 3);
      const note = pick(THANKS);
      await db.createRow({
        databaseId,
        tableId: 'kudos',
        rowId: ID.unique(),
        data: { post: post.$id, fromId: author.id, fromName: author.name, toId: helper.id, toName: helper.name, points, note: note || null },
      });
      await message(post.$id, author, `${author.name} marked this done and thanked ${helper.name} (${points}/5)${note ? `: “${note}”` : ''}`, true);
      replies++;
      await db.updateRow({ databaseId, tableId: 'posts', rowId: post.$id, data: { status: 'done' } });
    }
  }
  if (replies) await db.updateRow({ databaseId, tableId: 'posts', rowId: post.$id, data: { replies } });
  return post;
}

async function wipe(tableId) {
  for (;;) {
    const { rows } = await db.listRows({ databaseId, tableId, queries: [Query.limit(100), Query.select(['$id'])] });
    if (!rows.length) return;
    await Promise.all(rows.map((r) => db.deleteRow({ databaseId, tableId, rowId: r.$id }).catch(() => undefined)));
  }
}

async function main() {
  if (args.has('--reset')) {
    console.log('Wiping tables…');
    for (const t of ['kudos', 'messages', 'posts']) await wipe(t);
  }

  if (!args.has('--live-only')) {
    console.log(`Seeding around ${lat0}, ${lng0}…`);
    let n = 0;
    for (const idea of IDEAS) {
      const roll = Math.random();
      await makePost(idea, { fate: roll < 0.2 ? 'done' : roll < 0.35 ? 'claimed' : 'open' });
      n++;
    }
    // A second, wider ring so the radius slider has something to discover.
    for (let i = 0; i < 16; i++) {
      await makePost(pick(IDEAS), { fate: Math.random() < 0.3 ? 'done' : 'open', km: 15 });
      n++;
    }
    console.log(`Created ${n} posts.`);
  }

  if (args.has('--live') || args.has('--live-only')) {
    console.log('Live mode: a new neighbour posts every ~8s. Ctrl+C to stop.');
    for (;;) {
      await new Promise((r) => setTimeout(r, 5000 + Math.random() * 6000));
      const post = await makePost(pick(IDEAS), { km: 2.5 });
      console.log(`  + ${post.authorName}: ${post.title}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
