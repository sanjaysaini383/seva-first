import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'bn' | 'hi';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'bn', label: 'বাংলা' },
  { id: 'hi', label: 'हिन्दी' },
];

const en = {
  'app.live': 'Live',
  'app.offline': 'Offline',
  'app.signOut': 'Sign out {name}?',
  'app.join': 'Join',
  'app.kudosReceived': 'Kudos received',
  'app.language': 'Language',

  'tabs.nearby': 'Nearby',
  'tabs.mine': 'My activity',
  'tabs.heroes': 'Heroes',

  'heroes.title': 'Neighbourhood heroes',
  'heroes.note': 'Ranked by kudos received from neighbours.',
  'heroes.empty': 'No kudos yet. Help a neighbour, and when they mark it done you’ll appear here.',
  'heroes.you': 'You',
  'heroes.helps': '{n} helps',
  'heroes.help': '1 help',

  'filters.search': 'Search posts',
  'filters.all': 'All',
  'filters.requests': 'Requests',
  'filters.offers': 'Offers',
  'filters.showDone': 'Show completed',
  'filters.emergency': 'Emergency only',

  'feed.loadError': 'Couldn’t load posts: {error}',
  'empty.mine': 'No activity yet. Publish a post or offer to help a neighbour.',
  'empty.nearby': 'No posts in this area. Widen the radius or publish the first one.',
  'empty.emergency': 'No open emergency posts nearby right now.',

  'action.newPost': 'New post',
  'action.myLocation': 'Back to my location',

  'toast.published': 'Published. Neighbours nearby can see it now.',
  'toast.postFailed': 'Could not post',
  'toast.welcome': 'Welcome, {name}.',

  'pulse.open': 'Open nearby',
  'pulse.emergency': 'Emergency',
  'pulse.helped': 'Helped this week',
  'pulse.filterLabel': 'Filter by category',
  'pulse.catTitle': '{label}: {n} open',

  'kind.request': 'Request',
  'kind.offer': 'Offer',
  'status.open': 'Open',
  'status.claimed': 'In progress',
  'status.done': 'Completed',
  'badge.urgent': 'Urgent',

  'cat.rescue': 'Rescue / boat',
  'cat.medicine': 'Medicine',
  'cat.water': 'Drinking water',
  'cat.shelter': 'Shelter',
  'cat.food': 'Food',
  'cat.groceries': 'Groceries',
  'cat.rides': 'Rides',
  'cat.care': 'Care',
  'cat.tools': 'Tools',
  'cat.tech': 'Tech help',
  'cat.pets': 'Pets',
  'cat.other': 'Other',

  'drawer.back': 'Back',
  'drawer.showOnMap': 'Show on map',
  'drawer.away': '{d} away',
  'drawer.claim': 'I can help',
  'drawer.request': 'Request this',
  'drawer.claiming': 'Claiming…',
  'drawer.claimed': 'You’re helping with this. They’ve been notified.',
  'drawer.stepBack': 'Step back',
  'drawer.markDone': 'Mark as done',
  'drawer.appreciate': 'Appreciate',
  'drawer.appreciated': 'You appreciated this',
  'drawer.delete': 'Delete post',
  'drawer.deleteConfirm': 'Delete this post?',
  'drawer.deleted': 'Post deleted.',
  'drawer.youHelping': 'You’re helping',
  'drawer.otherHelping': '{name} is helping',
  'drawer.authorHint': 'Mark it as done once you’re sorted.',
  'drawer.helperHint': 'Coordinate the details in the conversation below.',
  'drawer.rate': 'Rate {name}’s help',
  'drawer.note': 'Add a thank-you note (optional)',
  'drawer.saveHint': 'The post, kudos and message are saved together.',
  'drawer.cancel': 'Cancel',
  'drawer.saving': 'Saving…',
  'drawer.complete': 'Complete',
  'drawer.kudosSent': 'Kudos sent to {name}.',
  'drawer.conversation': 'Conversation',
  'drawer.loadingThread': 'Loading conversation…',
  'drawer.noMessages': 'No messages yet. Start the conversation.',
  'drawer.write': 'Write a message…',
  'drawer.joinToReply': 'Join to reply',
  'drawer.send': 'Send',
  'drawer.loading': 'Loading post…',
  'drawer.loadFailed': 'Could not load this post.',
  'drawer.error': 'Something went wrong',
  'drawer.of5': '{n} of 5',

  'sys.offered': '{name} offered to help',
  'sys.stepBack': '{name} stepped back. This is open again.',
  'sys.done': '{name} marked this done and thanked {helper} ({points}/5)',

  'conflict.taken': '{name} is already on it.',
  'conflict.someone': 'Someone',
  'conflict.own': 'That’s your own post.',
  'conflict.race': 'Someone claimed this a moment before you did.',

  'compose.title': 'New post',
  'compose.sub': 'Visible to neighbours within their search radius.',
  'compose.cancel': 'Cancel',
  'compose.need': 'I need help',
  'compose.offer': 'I can offer',
  'compose.category': 'Category',
  'compose.titleLabel': 'Title',
  'compose.titleReq': 'e.g. Need a boat to reach the main road',
  'compose.titleOffer': 'e.g. Hot meals for 10 people tonight',
  'compose.details': 'Details',
  'compose.optional': 'Optional',
  'compose.detailsPh': 'Anything that helps a neighbour say yes',
  'compose.urgency': 'Urgency',
  'urgency.low': 'Low',
  'urgency.normal': 'Normal',
  'urgency.high': 'High',
  'compose.expires': 'Expires in',
  'exp.3': '3 hours',
  'exp.24': '24 hours',
  'exp.72': '3 days',
  'exp.168': 'A week',
  'compose.pinHint': 'Move the map to adjust the location',
  'compose.publishing': 'Publishing…',
  'compose.publish': 'Publish post',

  'map.crosshair': 'Drag the map to place your pin',

  'join.headline': 'Help is closer than you think.',
  'join.tag': 'Ask your neighbours for a hand, or lend one: a boat in a flood, medicine, a meal, a ride or simply company.',
  'join.s1t': 'Post a request or offer',
  'join.s1x': 'Pin it to your street, visible to neighbours nearby.',
  'join.s2t': 'A neighbour steps in',
  'join.s2x': 'They claim it and you coordinate in a private thread.',
  'join.s3t': 'Close the loop',
  'join.s3x': 'Mark it done and send kudos to the person who helped.',
  'join.label': 'Your first name',
  'join.ph': 'e.g. Priya',
  'join.joining': 'Joining…',
  'join.continue': 'Continue',
  'join.browse': 'Browse without joining',
  'join.fine': 'No email or password. Only your first name is shown to neighbours.',
  'join.failed': 'Could not join',

  'time.justNow': 'just now',
  'time.m': '{n}m ago',
  'time.h': '{n}h ago',
  'time.d': '{n}d ago',
  'left.expired': 'expired',
  'left.m': '{n}m left',
  'left.h': '{n}h left',
  'left.d': '{n}d left',
  'dist.m': '{n} m',
  'dist.km': '{n} km',
};

export type Key = keyof typeof en;

const bn: Record<Key, string> = {
  'app.live': 'লাইভ',
  'app.offline': 'অফলাইন',
  'app.signOut': '{name}, সাইন আউট করবেন?',
  'app.join': 'যোগ দিন',
  'app.kudosReceived': 'প্রাপ্ত কৃতজ্ঞতা',
  'app.language': 'ভাষা',

  'tabs.nearby': 'কাছাকাছি',
  'tabs.mine': 'আমার কার্যকলাপ',
  'tabs.heroes': 'হিরো',

  'heroes.title': 'পাড়ার হিরো',
  'heroes.note': 'প্রতিবেশীদের কাছ থেকে পাওয়া কৃতজ্ঞতা অনুযায়ী ক্রম।',
  'heroes.empty': 'এখনও কোনো কৃতজ্ঞতা নেই। প্রতিবেশীকে সাহায্য করুন, কাজ সম্পন্ন হলে আপনার নাম এখানে দেখা যাবে।',
  'heroes.you': 'আপনি',
  'heroes.helps': '{n}টি সাহায্য',
  'heroes.help': '১টি সাহায্য',

  'filters.search': 'পোস্ট খুঁজুন',
  'filters.all': 'সব',
  'filters.requests': 'অনুরোধ',
  'filters.offers': 'প্রস্তাব',
  'filters.showDone': 'সম্পন্নগুলোও দেখান',
  'filters.emergency': 'শুধু জরুরি',

  'feed.loadError': 'পোস্ট লোড করা যায়নি: {error}',
  'empty.mine': 'এখনও কোনো কার্যকলাপ নেই। একটি পোস্ট করুন বা কোনো প্রতিবেশীকে সাহায্য করুন।',
  'empty.nearby': 'এই এলাকায় কোনো পোস্ট নেই। ব্যাসার্ধ বাড়ান বা প্রথম পোস্টটি করুন।',
  'empty.emergency': 'এই মুহূর্তে কাছাকাছি কোনো খোলা জরুরি পোস্ট নেই।',

  'action.newPost': 'নতুন পোস্ট',
  'action.myLocation': 'আমার অবস্থানে ফিরুন',

  'toast.published': 'পোস্ট হয়েছে। কাছাকাছি প্রতিবেশীরা এখন দেখতে পাচ্ছেন।',
  'toast.postFailed': 'পোস্ট করা যায়নি',
  'toast.welcome': 'স্বাগতম, {name}।',

  'pulse.open': 'কাছাকাছি খোলা',
  'pulse.emergency': 'জরুরি',
  'pulse.helped': 'এই সপ্তাহে সাহায্য',
  'pulse.filterLabel': 'বিভাগ অনুযায়ী বাছুন',
  'pulse.catTitle': '{label}: {n}টি খোলা',

  'kind.request': 'অনুরোধ',
  'kind.offer': 'প্রস্তাব',
  'status.open': 'খোলা',
  'status.claimed': 'চলছে',
  'status.done': 'সম্পন্ন',
  'badge.urgent': 'জরুরি',

  'cat.rescue': 'উদ্ধার / নৌকা',
  'cat.medicine': 'ওষুধ',
  'cat.water': 'পানীয় জল',
  'cat.shelter': 'আশ্রয়',
  'cat.food': 'খাবার',
  'cat.groceries': 'মুদিখানা',
  'cat.rides': 'যাতায়াত',
  'cat.care': 'যত্ন',
  'cat.tools': 'যন্ত্রপাতি',
  'cat.tech': 'প্রযুক্তি সহায়তা',
  'cat.pets': 'পোষ্য',
  'cat.other': 'অন্যান্য',

  'drawer.back': 'ফিরে যান',
  'drawer.showOnMap': 'মানচিত্রে দেখুন',
  'drawer.away': '{d} দূরে',
  'drawer.claim': 'আমি সাহায্য করব',
  'drawer.request': 'এটা চাই',
  'drawer.claiming': 'নেওয়া হচ্ছে…',
  'drawer.claimed': 'আপনি সাহায্য করছেন। ওঁকে জানানো হয়েছে।',
  'drawer.stepBack': 'সরে দাঁড়ান',
  'drawer.markDone': 'সম্পন্ন হিসেবে চিহ্নিত করুন',
  'drawer.appreciate': 'প্রশংসা করুন',
  'drawer.appreciated': 'আপনি প্রশংসা করেছেন',
  'drawer.delete': 'পোস্ট মুছুন',
  'drawer.deleteConfirm': 'এই পোস্টটি মুছবেন?',
  'drawer.deleted': 'পোস্ট মুছে ফেলা হয়েছে।',
  'drawer.youHelping': 'আপনি সাহায্য করছেন',
  'drawer.otherHelping': '{name} সাহায্য করছেন',
  'drawer.authorHint': 'কাজ হয়ে গেলে সম্পন্ন হিসেবে চিহ্নিত করুন।',
  'drawer.helperHint': 'নিচের কথোপকথনে বিস্তারিত ঠিক করে নিন।',
  'drawer.rate': '{name}-এর সাহায্যকে রেটিং দিন',
  'drawer.note': 'ধন্যবাদ বার্তা লিখুন (ঐচ্ছিক)',
  'drawer.saveHint': 'পোস্ট, কৃতজ্ঞতা ও বার্তা একসঙ্গে সংরক্ষিত হয়।',
  'drawer.cancel': 'বাতিল',
  'drawer.saving': 'সংরক্ষণ হচ্ছে…',
  'drawer.complete': 'সম্পন্ন করুন',
  'drawer.kudosSent': '{name}-কে কৃতজ্ঞতা পাঠানো হয়েছে।',
  'drawer.conversation': 'কথোপকথন',
  'drawer.loadingThread': 'কথোপকথন লোড হচ্ছে…',
  'drawer.noMessages': 'এখনও কোনো বার্তা নেই। কথা শুরু করুন।',
  'drawer.write': 'বার্তা লিখুন…',
  'drawer.joinToReply': 'উত্তর দিতে যোগ দিন',
  'drawer.send': 'পাঠান',
  'drawer.loading': 'পোস্ট লোড হচ্ছে…',
  'drawer.loadFailed': 'এই পোস্টটি লোড করা যায়নি।',
  'drawer.error': 'কিছু একটা ভুল হয়েছে',
  'drawer.of5': '৫-এর মধ্যে {n}',

  'sys.offered': '{name} সাহায্য করতে এগিয়ে এসেছেন',
  'sys.stepBack': '{name} সরে দাঁড়িয়েছেন। এটি আবার খোলা।',
  'sys.done': '{name} কাজটি সম্পন্ন করেছেন এবং {helper}-কে ধন্যবাদ জানিয়েছেন ({points}/5)',

  'conflict.taken': '{name} ইতিমধ্যে সাহায্য করছেন।',
  'conflict.someone': 'কেউ',
  'conflict.own': 'এটি আপনার নিজের পোস্ট।',
  'conflict.race': 'আপনার ঠিক আগেই কেউ এটি নিয়ে নিয়েছেন।',

  'compose.title': 'নতুন পোস্ট',
  'compose.sub': 'আশেপাশের প্রতিবেশীরা দেখতে পাবেন।',
  'compose.cancel': 'বাতিল',
  'compose.need': 'আমার সাহায্য দরকার',
  'compose.offer': 'আমি দিতে পারি',
  'compose.category': 'বিভাগ',
  'compose.titleLabel': 'শিরোনাম',
  'compose.titleReq': 'যেমন: বড় রাস্তায় যেতে একটা নৌকা দরকার',
  'compose.titleOffer': 'যেমন: আজ রাতে ১০ জনের জন্য গরম খাবার আছে',
  'compose.details': 'বিস্তারিত',
  'compose.optional': 'ঐচ্ছিক',
  'compose.detailsPh': 'যা জানলে প্রতিবেশীর সাহায্য করতে সুবিধা হবে',
  'compose.urgency': 'জরুরিতা',
  'urgency.low': 'কম',
  'urgency.normal': 'সাধারণ',
  'urgency.high': 'বেশি',
  'compose.expires': 'মেয়াদ',
  'exp.3': '৩ ঘণ্টা',
  'exp.24': '২৪ ঘণ্টা',
  'exp.72': '৩ দিন',
  'exp.168': 'এক সপ্তাহ',
  'compose.pinHint': 'অবস্থান ঠিক করতে মানচিত্র সরান',
  'compose.publishing': 'পোস্ট হচ্ছে…',
  'compose.publish': 'পোস্ট করুন',

  'map.crosshair': 'পিন বসাতে মানচিত্র সরান',

  'join.headline': 'সাহায্য আপনার ভাবনার চেয়েও কাছে।',
  'join.tag': 'প্রতিবেশীদের কাছে সাহায্য চান বা সাহায্য করুন: বন্যায় নৌকা, ওষুধ, খাবার, যাতায়াত বা একটু সঙ্গ।',
  'join.s1t': 'অনুরোধ বা প্রস্তাব পোস্ট করুন',
  'join.s1x': 'আপনার এলাকায় পিন করুন, কাছাকাছি প্রতিবেশীরা দেখতে পাবেন।',
  'join.s2t': 'প্রতিবেশী এগিয়ে আসেন',
  'join.s2x': 'তিনি দায়িত্ব নেন, আর আপনারা কথোপকথনে সব ঠিক করে নেন।',
  'join.s3t': 'কাজ শেষ করুন',
  'join.s3x': 'সম্পন্ন হিসেবে চিহ্নিত করুন এবং সাহায্যকারীকে কৃতজ্ঞতা জানান।',
  'join.label': 'আপনার নাম',
  'join.ph': 'যেমন: প্রিয়া',
  'join.joining': 'যোগ দেওয়া হচ্ছে…',
  'join.continue': 'এগিয়ে যান',
  'join.browse': 'যোগ না দিয়ে দেখুন',
  'join.fine': 'ইমেল বা পাসওয়ার্ড লাগবে না। প্রতিবেশীরা শুধু আপনার নাম দেখতে পাবেন।',
  'join.failed': 'যোগ দেওয়া যায়নি',

  'time.justNow': 'এইমাত্র',
  'time.m': '{n} মিনিট আগে',
  'time.h': '{n} ঘণ্টা আগে',
  'time.d': '{n} দিন আগে',
  'left.expired': 'মেয়াদ শেষ',
  'left.m': '{n} মিনিট বাকি',
  'left.h': '{n} ঘণ্টা বাকি',
  'left.d': '{n} দিন বাকি',
  'dist.m': '{n} মি',
  'dist.km': '{n} কিমি',
};

const hi: Record<Key, string> = {
  'app.live': 'लाइव',
  'app.offline': 'ऑफ़लाइन',
  'app.signOut': '{name}, साइन आउट करें?',
  'app.join': 'जुड़ें',
  'app.kudosReceived': 'मिला आभार',
  'app.language': 'भाषा',

  'tabs.nearby': 'आस-पास',
  'tabs.mine': 'मेरी गतिविधि',
  'tabs.heroes': 'हीरो',

  'heroes.title': 'मोहल्ले के हीरो',
  'heroes.note': 'पड़ोसियों से मिले आभार के आधार पर क्रम।',
  'heroes.empty': 'अभी कोई आभार नहीं। किसी पड़ोसी की मदद करें, काम पूरा होने पर आपका नाम यहाँ दिखेगा।',
  'heroes.you': 'आप',
  'heroes.helps': '{n} मदद',
  'heroes.help': '1 मदद',

  'filters.search': 'पोस्ट खोजें',
  'filters.all': 'सभी',
  'filters.requests': 'अनुरोध',
  'filters.offers': 'पेशकश',
  'filters.showDone': 'पूरी हुई भी दिखाएँ',
  'filters.emergency': 'केवल आपातकालीन',

  'feed.loadError': 'पोस्ट लोड नहीं हो सकीं: {error}',
  'empty.mine': 'अभी कोई गतिविधि नहीं। कोई पोस्ट करें या किसी पड़ोसी की मदद करें।',
  'empty.nearby': 'इस इलाके में कोई पोस्ट नहीं। दायरा बढ़ाएँ या पहली पोस्ट करें।',
  'empty.emergency': 'अभी आस-पास कोई खुली आपातकालीन पोस्ट नहीं है।',

  'action.newPost': 'नई पोस्ट',
  'action.myLocation': 'मेरे स्थान पर वापस जाएँ',

  'toast.published': 'पोस्ट हो गई। आस-पास के पड़ोसी अब इसे देख सकते हैं।',
  'toast.postFailed': 'पोस्ट नहीं हो सकी',
  'toast.welcome': 'स्वागत है, {name}।',

  'pulse.open': 'आस-पास खुली',
  'pulse.emergency': 'आपातकालीन',
  'pulse.helped': 'इस हफ़्ते मदद',
  'pulse.filterLabel': 'श्रेणी से छाँटें',
  'pulse.catTitle': '{label}: {n} खुली',

  'kind.request': 'अनुरोध',
  'kind.offer': 'पेशकश',
  'status.open': 'खुली',
  'status.claimed': 'जारी',
  'status.done': 'पूरी',
  'badge.urgent': 'ज़रूरी',

  'cat.rescue': 'बचाव / नाव',
  'cat.medicine': 'दवा',
  'cat.water': 'पीने का पानी',
  'cat.shelter': 'आश्रय',
  'cat.food': 'खाना',
  'cat.groceries': 'किराना',
  'cat.rides': 'सवारी',
  'cat.care': 'देखभाल',
  'cat.tools': 'औज़ार',
  'cat.tech': 'तकनीकी मदद',
  'cat.pets': 'पालतू',
  'cat.other': 'अन्य',

  'drawer.back': 'वापस',
  'drawer.showOnMap': 'नक्शे पर देखें',
  'drawer.away': '{d} दूर',
  'drawer.claim': 'मैं मदद के लिए तैयार हूँ',
  'drawer.request': 'यह चाहिए',
  'drawer.claiming': 'लिया जा रहा है…',
  'drawer.claimed': 'आप मदद कर रहे हैं। उन्हें सूचना दे दी गई है।',
  'drawer.stepBack': 'पीछे हटें',
  'drawer.markDone': 'पूरा हुआ चिह्नित करें',
  'drawer.appreciate': 'सराहें',
  'drawer.appreciated': 'आपने सराहा',
  'drawer.delete': 'पोस्ट हटाएँ',
  'drawer.deleteConfirm': 'यह पोस्ट हटाएँ?',
  'drawer.deleted': 'पोस्ट हटा दी गई।',
  'drawer.youHelping': 'आप मदद कर रहे हैं',
  'drawer.otherHelping': '{name} मदद कर रहे हैं',
  'drawer.authorHint': 'काम हो जाने पर इसे पूरा हुआ चिह्नित करें।',
  'drawer.helperHint': 'नीचे बातचीत में बाकी बातें तय करें।',
  'drawer.rate': '{name} की मदद को रेटिंग दें',
  'drawer.note': 'धन्यवाद संदेश लिखें (वैकल्पिक)',
  'drawer.saveHint': 'पोस्ट, आभार और संदेश एक साथ सहेजे जाते हैं।',
  'drawer.cancel': 'रद्द करें',
  'drawer.saving': 'सहेजा जा रहा है…',
  'drawer.complete': 'पूरा करें',
  'drawer.kudosSent': '{name} को आभार भेजा गया।',
  'drawer.conversation': 'बातचीत',
  'drawer.loadingThread': 'बातचीत लोड हो रही है…',
  'drawer.noMessages': 'अभी कोई संदेश नहीं। बातचीत शुरू करें।',
  'drawer.write': 'संदेश लिखें…',
  'drawer.joinToReply': 'जवाब देने के लिए जुड़ें',
  'drawer.send': 'भेजें',
  'drawer.loading': 'पोस्ट लोड हो रही है…',
  'drawer.loadFailed': 'यह पोस्ट लोड नहीं हो सकी।',
  'drawer.error': 'कुछ गड़बड़ हो गई',
  'drawer.of5': '5 में से {n}',

  'sys.offered': '{name} ने मदद की पेशकश की',
  'sys.stepBack': '{name} पीछे हट गए। यह फिर से खुली है।',
  'sys.done': '{name} ने इसे पूरा बताया और {helper} का धन्यवाद किया ({points}/5)',

  'conflict.taken': '{name} पहले से मदद कर रहे हैं।',
  'conflict.someone': 'कोई',
  'conflict.own': 'यह आपकी अपनी पोस्ट है।',
  'conflict.race': 'आपसे ठीक पहले किसी और ने इसे ले लिया।',

  'compose.title': 'नई पोस्ट',
  'compose.sub': 'आस-पास के पड़ोसी इसे देख सकेंगे।',
  'compose.cancel': 'रद्द करें',
  'compose.need': 'मुझे मदद चाहिए',
  'compose.offer': 'मेरे पास देने को है',
  'compose.category': 'श्रेणी',
  'compose.titleLabel': 'शीर्षक',
  'compose.titleReq': 'जैसे: मुख्य सड़क तक जाने के लिए नाव चाहिए',
  'compose.titleOffer': 'जैसे: आज रात 10 लोगों के लिए गरम खाना है',
  'compose.details': 'विवरण',
  'compose.optional': 'वैकल्पिक',
  'compose.detailsPh': 'ऐसी जानकारी जिससे पड़ोसी आसानी से मदद कर सकें',
  'compose.urgency': 'ज़रूरत',
  'urgency.low': 'कम',
  'urgency.normal': 'सामान्य',
  'urgency.high': 'ज़्यादा',
  'compose.expires': 'कब तक',
  'exp.3': '3 घंटे',
  'exp.24': '24 घंटे',
  'exp.72': '3 दिन',
  'exp.168': 'एक हफ़्ता',
  'compose.pinHint': 'स्थान ठीक करने के लिए नक्शा खिसकाएँ',
  'compose.publishing': 'पोस्ट हो रही है…',
  'compose.publish': 'पोस्ट करें',

  'map.crosshair': 'पिन लगाने के लिए नक्शा खिसकाएँ',

  'join.headline': 'मदद आपकी सोच से ज़्यादा पास है।',
  'join.tag': 'पड़ोसियों से मदद माँगें या मदद करें: बाढ़ में नाव, दवा, खाना, सवारी या थोड़ा साथ।',
  'join.s1t': 'अनुरोध या पेशकश पोस्ट करें',
  'join.s1x': 'अपनी गली पर पिन करें, आस-पास के पड़ोसी देख सकेंगे।',
  'join.s2t': 'कोई पड़ोसी आगे आता है',
  'join.s2x': 'वह ज़िम्मेदारी लेता है और आप बातचीत में सब तय करते हैं।',
  'join.s3t': 'काम पूरा करें',
  'join.s3x': 'पूरा हुआ चिह्नित करें और मदद करने वाले का आभार जताएँ।',
  'join.label': 'आपका नाम',
  'join.ph': 'जैसे: प्रिया',
  'join.joining': 'जुड़ रहे हैं…',
  'join.continue': 'आगे बढ़ें',
  'join.browse': 'बिना जुड़े देखें',
  'join.fine': 'ईमेल या पासवर्ड की ज़रूरत नहीं। पड़ोसी सिर्फ़ आपका नाम देखेंगे।',
  'join.failed': 'जुड़ नहीं सके',

  'time.justNow': 'अभी-अभी',
  'time.m': '{n} मिनट पहले',
  'time.h': '{n} घंटे पहले',
  'time.d': '{n} दिन पहले',
  'left.expired': 'समय समाप्त',
  'left.m': '{n} मिनट बाकी',
  'left.h': '{n} घंटे बाकी',
  'left.d': '{n} दिन बाकी',
  'dist.m': '{n} मी',
  'dist.km': '{n} किमी',
};

const DICTS: Record<Lang, Record<Key, string>> = { en, bn, hi };

// ---------------------------------------------------------------------------
// A tiny store so both components (via useLang) and plain modules (via t)
// read the same current language.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'hearth:lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'bn' || saved === 'hi') return saved;
  } catch {
    /* storage unavailable: fall through */
  }
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('bn')) return 'bn';
  if (nav.startsWith('hi')) return 'hi';
  return 'en';
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();
document.documentElement.lang = current;

export function setLang(lang: Lang) {
  current = lang;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* per-browser preference only */
  }
  listeners.forEach((l) => l());
}

export const getLang = () => current;

/** Translate a key in the current language, filling {placeholders}. */
export function t(key: Key, vars?: Record<string, string | number>): string {
  const template = DICTS[current][key] ?? en[key];
  return vars ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : template;
}

/** Re-renders the calling component when the language changes. */
export function useLang() {
  const lang = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
  return { lang, setLang, t };
}
