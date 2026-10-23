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
  'Arijit', 'Moumita', 'Sourav', 'Riya', 'Debashis', 'Tanushree', 'Abhishek', 'Payel', 'Subhajit',
  'Rakesh', 'Nandini', 'Imran', 'Shabnam', 'Pritam', 'Anjali', 'Rahul', 'Sunita', 'Biplab',
].map((name) => ({ id: `seed-${name.toLowerCase()}`, name }));

// [kind, category, title, body, urgency]. A mix of flood relief and everyday
// help, with some posts written in Bengali and Hindi as neighbours would.
const IDEAS = [
  ['request', 'rescue', 'Need a boat: water is waist-deep in our lane', 'Elderly mother on the ground floor needs to reach the relief camp.', 'high'],
  ['offer', 'rescue', 'Have a small boat, can ferry 4 people at a time', 'Near the primary school, available until evening.', 'normal'],
  ['request', 'medicine', 'Insulin needed urgently, pharmacy shut due to flooding', 'For my father, 70. Will pay.', 'high'],
  ['offer', 'medicine', 'Have ORS packets and a first-aid kit to share', 'Ask at the house with the blue gate.', 'normal'],
  ['request', 'medicine', 'জরুরি: বাবার জন্য প্রেসারের ওষুধ দরকার', 'দোকান বন্ধ, কেউ কি একটু এনে দিতে পারবেন?', 'high'],
  ['request', 'water', 'Drinking water needed for 6 people', 'Our tube well is under water.', 'high'],
  ['offer', 'water', '20-litre water jars available, can deliver nearby', '', 'normal'],
  ['offer', 'shelter', 'Our first floor is dry, can host a family for two nights', 'Please bring bedding if you can.', 'normal'],
  ['request', 'shelter', 'Need a dry place for my goats and hens', 'Just until the water goes down.', 'normal'],
  ['offer', 'food', 'খিচুড়ি রান্না করেছি, ২০ জনের মতো খাবার আছে', 'রাত ৯টা পর্যন্ত পাড়ার ক্লাবে নিয়ে যান।', 'normal'],
  ['offer', 'food', 'Extra home-cooked meals for 3 people', 'Veg. Pick up before 9pm.', 'normal'],
  ['request', 'rides', 'अस्पताल जाने के लिए सवारी चाहिए', 'कल सुबह 9 बजे की अपॉइंटमेंट है।', 'normal'],
  ['request', 'rides', 'Need a lift to Howrah station tomorrow 7am', 'One suitcase, will share fuel.', 'normal'],
  ['offer', 'rides', 'Driving to the airport on Sunday, 2 seats free', 'Leaving around 5:30am.', 'low'],
  ['offer', 'groceries', 'बाज़ार जा रहा हूँ, 2 लोगों का सामान ला सकता हूँ', 'छोटी लिस्ट भेजें।', 'low'],
  ['request', 'groceries', 'Could someone pick up milk and bread?', 'Down with fever, happy to pay via UPI.', 'high'],
  ['request', 'tech', 'Help setting up a video call on my mother’s phone', 'She wants to call her grandchildren. 15 minutes at most.', 'normal'],
  ['offer', 'tech', 'Can help fill government forms online', 'Pension, Aadhaar updates, Swasthya Sathi enrolment.', 'low'],
  ['request', 'care', 'Someone to sit with my grandfather for an hour', 'He loves talking about football. Thursday afternoon.', 'normal'],
  ['offer', 'care', 'Can walk with elderly neighbours in the evening', 'Park loop, 6 to 7pm, any day.', 'low'],
  ['request', 'tools', 'Need a ladder for 10 minutes', 'Changing a ceiling bulb.', 'normal'],
  ['offer', 'tools', 'Lending a pump to clear water from ground floors', 'Diesel pump, bring your own pipe.', 'normal'],
  ['request', 'pets', 'Found a lost dog near the bus stand', 'Brown, friendly, red collar. Is he yours?', 'high'],
  ['request', 'other', 'Need 4 folding chairs for a small puja', 'Saturday only.', 'normal'],
  ['offer', 'other', 'Giving away school books (Class 5 to 8)', 'Two boxes, all in good condition.', 'low'],
];

const CHAT = [
  'I live two lanes away, can come by.',
  'আমি পাশের গলিতে থাকি, আসছি।',
  'मैं 10 मिनट में पहुँच रहा हूँ।',
  'Is this still needed?',
  'Thank you so much.',
  'অনেক ধন্যবাদ!',
  'Be there in 10 minutes.',
];

const THANKS = ['Lifesaver!', 'অনেক ধন্যবাদ', 'बहुत-बहुत धन्यवाद', 'Super quick, thanks!', ''];

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
