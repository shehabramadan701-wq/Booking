// بيانات تجريبية (Dummy) — تُستبدل لاحقاً ببيانات المورّد (TBO) عبر الـ Backend.
// الملف ESM خالص بدون أي اعتماد على المتصفح حتى يستخدمه الخادم أيضاً.

// في نسخة المعاينة (Artifact) تُحمَّل الصور من ملفات محلية لأن الروابط الخارجية محجوبة هناك
export const img = (id, w = 800) =>
  globalThis.__NZ_ARTIFACT
    ? `img/${id}.jpg`
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const EXTERIORS = [
  '1566073771259-6a8506099945', '1542314831-068cd1dbfeeb', '1551882547-ff40c63fe5fa',
  '1520250497591-112f2f40a3f4', '1571896349842-33c89424de2d', '1564501049412-61c2a3083791',
  '1455587734955-081b22074882', '1535827841776-24afc1e255ac', '1549294413-26f195200c16',
  '1561501900-3701fa6a0864', '1568084680786-a84f91d1153c', '1584132967334-10e028bd69f7',
  '1540541338287-41700207dee6', '1586611292717-f828b167408c', '1562790351-d273a961e0e9',
  '1580418827493-f2b22c0a76cb',
];
const ROOMS = [
  '1582719478250-c89cae4dc85b', '1445019980597-93fa8acb246c', '1578683010236-d716f9a3f461',
  '1611892440504-42a792e24d32', '1590490360182-c33d57733427', '1631049307264-da0ec9d70304',
  '1496417263034-38ec4f0b665a', '1596394516093-501ba68a0ba6', '1618773928121-c32242e63f39',
  '1505693416388-ac5ce068fe85', '1595576508898-0ad5c879a061', '1584132915807-fd1f5fbc078f',
];
const LOUNGES = [
  '1522708323590-d24dbb6b0267', '1502672260266-1c1ef2d93688',
  '1560448204-e02f11c3d0e2', '1560185007-cde436f6a4d0',
];

export const AMENITIES = [
  { id: 'wifi', ar: 'واي فاي مجاني', en: 'Free Wi‑Fi' },
  { id: 'pool', ar: 'مسبح', en: 'Swimming pool' },
  { id: 'parking', ar: 'موقف سيارات', en: 'Parking' },
  { id: 'spa', ar: 'سبا ومركز عافية', en: 'Spa & wellness' },
  { id: 'gym', ar: 'صالة رياضية', en: 'Fitness centre' },
  { id: 'restaurant', ar: 'مطعم', en: 'Restaurant' },
  { id: 'shuttle', ar: 'توصيل من وإلى المطار', en: 'Airport shuttle' },
  { id: 'family', ar: 'غرف عائلية', en: 'Family rooms' },
  { id: 'beach', ar: 'على الشاطئ', en: 'Beachfront' },
  { id: 'halal', ar: 'طعام حلال', en: 'Halal food' },
  { id: 'prayer', ar: 'مصلى', en: 'Prayer room' },
  { id: 'ac', ar: 'تكييف', en: 'Air conditioning' },
];

export const PROPERTY_TYPES = [
  { id: 'hotel', ar: 'فندق', en: 'Hotel', arPl: 'فنادق', enPl: 'Hotels' },
  { id: 'resort', ar: 'منتجع', en: 'Resort', arPl: 'منتجعات', enPl: 'Resorts' },
  { id: 'apartment', ar: 'شقق فندقية', en: 'Aparthotel', arPl: 'شقق فندقية', enPl: 'Apartments' },
  { id: 'villa', ar: 'فلل', en: 'Villas', arPl: 'فلل', enPl: 'Villas' },
  { id: 'hostel', ar: 'نُزل اقتصادي', en: 'Hostel', arPl: 'نُزل اقتصادية', enPl: 'Hostels' },
];

export const MEALS = {
  ro: { ar: 'بدون وجبات', en: 'Room only' },
  bb: { ar: 'شامل الإفطار', en: 'Breakfast included' },
  hb: { ar: 'إفطار وعشاء', en: 'Half board' },
};

// level = مستوى الأسعار النسبي للوجهة
export const DESTINATIONS = [
  { id: 'dubai', ar: 'دبي', en: 'Dubai', cAr: 'الإمارات', cEn: 'UAE', image: '1512453979798-5ea266f8880c', level: 1.35, beach: true,
    districts: [['وسط المدينة', 'Downtown'], ['مرسى دبي', 'Dubai Marina'], ['نخلة جميرا', 'Palm Jumeirah'], ['ديرة', 'Deira']] },
  { id: 'madinah', ar: 'المدينة المنورة', en: 'Madinah', cAr: 'السعودية', cEn: 'Saudi Arabia', image: '1591604129939-f1efa4d9f7fa', level: 1.1,
    districts: [['المنطقة المركزية', 'Central Area'], ['قباء', 'Quba'], ['العزيزية', 'Al Aziziyah'], ['سلطانة', 'Sultanah']] },
  { id: 'cairo', ar: 'القاهرة', en: 'Cairo', cAr: 'مصر', cEn: 'Egypt', image: '1572252009286-268acec5ca0a', level: 0.7,
    districts: [['الزمالك', 'Zamalek'], ['وسط البلد', 'Downtown'], ['الأهرامات', 'Giza Pyramids'], ['مصر الجديدة', 'Heliopolis']] },
  { id: 'istanbul', ar: 'إسطنبول', en: 'Istanbul', cAr: 'تركيا', cEn: 'Türkiye', image: '1524231757912-21f4fe3a7200', level: 0.8,
    districts: [['السلطان أحمد', 'Sultanahmet'], ['تقسيم', 'Taksim'], ['بشكتاش', 'Beşiktaş'], ['شيشلي', 'Şişli']] },
  { id: 'paris', ar: 'باريس', en: 'Paris', cAr: 'فرنسا', cEn: 'France', image: '1502602898657-3e91760cbb34', level: 1.5,
    districts: [['الشانزليزيه', 'Champs‑Élysées'], ['الحي اللاتيني', 'Latin Quarter'], ['مونمارتر', 'Montmartre'], ['لا ديفانس', 'La Défense']] },
  { id: 'london', ar: 'لندن', en: 'London', cAr: 'المملكة المتحدة', cEn: 'United Kingdom', image: '1513635269975-59663e0ac1ad', level: 1.55,
    districts: [['وستمنستر', 'Westminster'], ['كنسينغتون', 'Kensington'], ['بادينغتون', 'Paddington'], ['كناري وارف', 'Canary Wharf']] },
  { id: 'maldives', ar: 'المالديف', en: 'Maldives', cAr: 'المالديف', cEn: 'Maldives', image: '1514282401047-d79a71a590e8', level: 2.3, beach: true, resort: true,
    districts: [['جزيرة ماليه الشمالية', 'North Malé Atoll'], ['جزيرة آري', 'Ari Atoll'], ['جزيرة با', 'Baa Atoll'], ['مافوشي', 'Maafushi']] },
  { id: 'bali', ar: 'بالي', en: 'Bali', cAr: 'إندونيسيا', cEn: 'Indonesia', image: '1537996194471-e657df975ab4', level: 0.75, beach: true, resort: true,
    districts: [['أوبود', 'Ubud'], ['سيمينياك', 'Seminyak'], ['نوسا دوا', 'Nusa Dua'], ['كوتا', 'Kuta']] },
  { id: 'kuala-lumpur', ar: 'كوالالمبور', en: 'Kuala Lumpur', cAr: 'ماليزيا', cEn: 'Malaysia', image: '1596422846543-75c6fc197f07', level: 0.65,
    districts: [['بوكيت بينتانج', 'Bukit Bintang'], ['وسط المدينة KLCC', 'KLCC'], ['شاو كيت', 'Chow Kit'], ['بانجسار', 'Bangsar']] },
  { id: 'rome', ar: 'روما', en: 'Rome', cAr: 'إيطاليا', cEn: 'Italy', image: '1552832230-c0197dd311b5', level: 1.2,
    districts: [['المركز التاريخي', 'Historic Centre'], ['تراستيفيري', 'Trastevere'], ['الفاتيكان', 'Vatican'], ['تيرميني', 'Termini']] },
  { id: 'madrid', ar: 'مدريد', en: 'Madrid', cAr: 'إسبانيا', cEn: 'Spain', image: '1539037116277-4db20889f2d4', level: 1.05,
    districts: [['غران فيا', 'Gran Vía'], ['سالامانكا', 'Salamanca'], ['لا لاتينا', 'La Latina'], ['تشامارتين', 'Chamartín']] },
  { id: 'bangkok', ar: 'بانكوك', en: 'Bangkok', cAr: 'تايلاند', cEn: 'Thailand', image: '1508009603885-50cf7c579365', level: 0.6,
    districts: [['سوخومفيت', 'Sukhumvit'], ['سيلوم', 'Silom'], ['النهر', 'Riverside'], ['سيام', 'Siam']] },
  { id: 'singapore', ar: 'سنغافورة', en: 'Singapore', cAr: 'سنغافورة', cEn: 'Singapore', image: '1565967511849-76a60a516170', level: 1.4,
    districts: [['مارينا باي', 'Marina Bay'], ['أورتشارد', 'Orchard'], ['سنتوسا', 'Sentosa'], ['الحي العربي', 'Kampong Glam']] },
  { id: 'amsterdam', ar: 'أمستردام', en: 'Amsterdam', cAr: 'هولندا', cEn: 'Netherlands', image: '1534351590666-13e3e96b5017', level: 1.3,
    districts: [['حزام القنوات', 'Canal Belt'], ['يوردان', 'Jordaan'], ['حي المتاحف', 'Museum Quarter'], ['دي بايب', 'De Pijp']] },
  { id: 'abu-dhabi', ar: 'أبوظبي', en: 'Abu Dhabi', cAr: 'الإمارات', cEn: 'UAE', image: '1578895101408-1a36b834405b', level: 1.15, beach: true,
    districts: [['الكورنيش', 'Corniche'], ['جزيرة ياس', 'Yas Island'], ['جزيرة السعديات', 'Saadiyat Island'], ['الخالدية', 'Al Khalidiyah']] },
];

const NAMES = [
  ['اللؤلؤة', 'Pearl'], ['الياسمين', 'Jasmine'], ['النخيل', 'Palm'], ['الواحة', 'Oasis'], ['القصر', 'Palace'],
  ['الريان', 'Rayan'], ['السلطان', 'Sultan'], ['الفيروز', 'Turquoise'], ['المرجان', 'Coral'], ['الندى', 'Nada'],
  ['البستان', 'Bustan'], ['الأندلس', 'Andalus'], ['النجمة', 'Star'], ['الشاطئ', 'Shore'], ['الأفق', 'Horizon'],
  ['القمر', 'Moon'], ['الزمرد', 'Emerald'], ['الياقوت', 'Ruby'], ['السفير', 'Ambassador'], ['الفردوس', 'Paradise'],
  ['الربيع', 'Spring'], ['الماسة', 'Diamond'], ['العنبر', 'Amber'], ['الصفوة', 'Safwa'], ['الكوثر', 'Kawthar'],
  ['دار السلام', 'Dar Al Salam'], ['التاج', 'Crown'], ['النسيم', 'Breeze'], ['الروضة', 'Rawda'], ['المنارة', 'Manara'],
];
const TYPE_PREFIX = {
  hotel: ['فندق', 'Hotel'], resort: ['منتجع', 'Resort'], apartment: ['شقق', 'Suites'],
  villa: ['فلل', 'Villas'], hostel: ['نُزل', 'Hostel'],
};
const SUFFIX = [['', ''], ['الملكي', 'Royal'], ['جراند', 'Grand'], ['بلازا', 'Plaza'], ['ريزيدنس', 'Residence'], ['', '']];

const ROOM_TYPES = [
  { k: 'std', ar: 'غرفة قياسية', en: 'Standard Room', bedAr: 'سرير مزدوج', bedEn: '1 double bed', size: 24, max: 2, f: 1 },
  { k: 'dlx', ar: 'غرفة ديلوكس', en: 'Deluxe Room', bedAr: 'سرير كينغ', bedEn: '1 king bed', size: 32, max: 3, f: 1.28 },
  { k: 'fam', ar: 'غرفة عائلية', en: 'Family Room', bedAr: 'سرير كينغ + سريران فرديان', bedEn: '1 king + 2 single beds', size: 44, max: 5, f: 1.65 },
  { k: 'ste', ar: 'جناح تنفيذي', en: 'Executive Suite', bedAr: 'سرير كينغ وصالة جلوس', bedEn: '1 king bed & lounge', size: 58, max: 4, f: 2.2 },
];

const REVIEWERS = [
  ['أحمد', 'Ahmed', 'EG'], ['نورة', 'Noura', 'SA'], ['خالد', 'Khaled', 'KW'], ['مريم', 'Mariam', 'AE'],
  ['يوسف', 'Youssef', 'MA'], ['سارة', 'Sarah', 'GB'], ['عمر', 'Omar', 'JO'], ['ليلى', 'Layla', 'LB'],
  ['Thomas', 'Thomas', 'DE'], ['Elena', 'Elena', 'ES'], ['فهد', 'Fahad', 'SA'], ['هدى', 'Huda', 'QA'],
];
const REVIEW_TEXT = [
  ['موقع ممتاز وقريب من كل شيء، والطاقم متعاون جداً.', 'Excellent location close to everything, and very helpful staff.'],
  ['الغرفة نظيفة وواسعة والإفطار متنوع. أنصح به للعائلات.', 'Clean, spacious room and a varied breakfast. Great for families.'],
  ['تجربة رائعة وقيمة ممتازة مقابل السعر، سأعود مرة أخرى.', 'Wonderful stay and great value for money. I will be back.'],
  ['الإطلالة خلابة والمسبح جميل، لكن تسجيل الدخول أخذ بعض الوقت.', 'Stunning view and lovely pool, though check‑in took a while.'],
  ['هدوء وراحة وخدمة غرف سريعة. السرير مريح جداً.', 'Quiet and comfortable with quick room service. Very comfy bed.'],
  ['جيد بشكل عام، الواي فاي يحتاج تحسيناً في بعض الطوابق.', 'Good overall; Wi‑Fi could be better on some floors.'],
  ['استقبال دافئ وتفاصيل راقية في كل مكان. يستحق التقييم.', 'Warm welcome and refined details everywhere. Well deserved rating.'],
  ['قريب من المواصلات والمطاعم، والنظافة ممتازة.', 'Close to transport and restaurants, and spotless.'],
];

// مولّد أرقام عشوائية ثابت (نفس البيانات في كل تشغيل)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function buildHotels() {
  const out = [];
  DESTINATIONS.forEach((d, di) => {
    const r = rng(1000 + di * 77);
    for (let i = 0; i < 10; i++) {
      const id = `${d.id}-${i + 1}`;
      const roll = r();
      let type = 'hotel';
      if (d.resort ? roll < 0.5 : roll < 0.12) type = 'resort';
      else if (roll > 0.92) type = 'hostel';
      else if (roll > 0.8) type = 'apartment';
      else if (roll > 0.74 && d.beach) type = 'villa';
      const stars = type === 'hostel' ? 2 : type === 'resort' || type === 'villa' ? pick(r, [4, 5, 5]) : pick(r, [3, 3, 4, 4, 4, 5, 5]);
      const nm = NAMES[(di * 7 + i * 3) % NAMES.length];
      const sf = type === 'hotel' ? SUFFIX[(di + i) % SUFFIX.length] : ['', ''];
      const tp = TYPE_PREFIX[type];
      const name = {
        ar: [tp[0], nm[0], sf[0], d.ar].filter(Boolean).join(' '),
        en: [nm[1], sf[1], tp[1], d.en].filter(Boolean).join(' '),
      };
      const dist = d.districts[Math.floor(r() * d.districts.length)];
      const rating = Math.round((6 + stars * 0.45 + r() * 1.5) * 10) / 10;
      const base = Math.round((18 + stars * stars * 5.2) * d.level * (0.85 + r() * 0.4));

      const am = new Set(['wifi', 'ac']);
      const maybe = (idm, p) => r() < p && am.add(idm);
      maybe('pool', stars >= 4 ? 0.8 : 0.2); maybe('parking', 0.6); maybe('spa', stars >= 4 ? 0.6 : 0.05);
      maybe('gym', stars >= 3 ? 0.65 : 0.1); maybe('restaurant', type === 'apartment' ? 0.3 : 0.85);
      maybe('shuttle', 0.4); maybe('family', 0.6); maybe('halal', 0.7); maybe('prayer', 0.35);
      if (d.beach && (type === 'resort' || type === 'villa' || r() < 0.3)) am.add('beach');

      const refundable = r() < 0.75;
      const hasBreakfast = type !== 'hostel' && r() < 0.75;
      const roomCount = type === 'hostel' ? 2 : stars >= 4 ? 4 : 3;
      const rooms = ROOM_TYPES.slice(0, roomCount).map((rt, ri) => {
        const p = Math.round(base * rt.f);
        const rates = [{ id: 'nr', meal: 'ro', refundable: false, price: p }];
        if (refundable) rates.push({ id: 'fr', meal: 'ro', refundable: true, price: Math.round(p * 1.1) });
        if (hasBreakfast) rates.push({ id: 'bb', meal: 'bb', refundable, price: Math.round(p * 1.2) });
        if (hasBreakfast && stars >= 4 && ri > 0) rates.push({ id: 'hb', meal: 'hb', refundable, price: Math.round(p * 1.42) });
        return {
          id: rt.k, name: { ar: rt.ar, en: rt.en }, bed: { ar: rt.bedAr, en: rt.bedEn },
          size: rt.size + (stars - 3) * 4, maxGuests: rt.max, image: ROOMS[(di * 3 + i + ri * 5) % ROOMS.length],
          left: 1 + Math.floor(r() * 6), rates,
        };
      });

      const images = [
        EXTERIORS[(di * 5 + i * 3) % EXTERIORS.length],
        ROOMS[(di * 3 + i) % ROOMS.length],
        LOUNGES[(di + i) % LOUNGES.length],
        ROOMS[(di * 3 + i + 5) % ROOMS.length],
        EXTERIORS[(di * 5 + i * 3 + 7) % EXTERIORS.length],
      ];
      const nRev = 3 + Math.floor(r() * 3);
      const reviews = Array.from({ length: nRev }, (_, k) => {
        const who = REVIEWERS[(di + i * 2 + k * 5) % REVIEWERS.length];
        const txt = REVIEW_TEXT[(di * 2 + i + k * 3) % REVIEW_TEXT.length];
        return {
          id: `${id}-r${k}`, author: { ar: who[0], en: who[1] }, country: who[2],
          score: Math.min(10, Math.max(5, Math.round((rating + (r() - 0.5) * 2) * 10) / 10)),
          text: { ar: txt[0], en: txt[1] }, daysAgo: 3 + Math.floor(r() * 200),
        };
      });

      out.push({
        id, destId: d.id, type, stars, name, rating,
        reviewsCount: 40 + Math.floor(r() * 2400),
        district: { ar: dist[0], en: dist[1] },
        distanceKm: Math.round((0.2 + r() * 9) * 10) / 10,
        amenities: [...am], images, rooms, reviews,
        minPrice: rooms[0].rates[0].price,
        maxGuests: Math.max(...rooms.map((x) => x.maxGuests)),
        freeCancel: refundable, breakfast: hasBreakfast,
        featured: rating >= 8.6 && r() < 0.6,
        deal: r() < 0.22 ? pick(r, [10, 15, 20, 25]) : 0,
        description: {
          ar: `يقع ${name.ar} في ${dist[0]} على بُعد ${Math.round(r() * 20 + 5)} دقيقة من أبرز معالم ${d.ar}. يوفّر إقامة مريحة بغرف مجهّزة بالكامل وخدمة على مدار الساعة، مع مرافق تناسب العائلات ورجال الأعمال.`,
          en: `${name.en} is located in ${dist[1]}, minutes from the main sights of ${d.en}. It offers comfortable, fully equipped rooms and 24‑hour service, with facilities suited to families and business travellers.`,
        },
        checkIn: '15:00', checkOut: '12:00',
      });
    }
  });
  return out;
}

export const HOTELS = buildHotels();
export const destById = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]));
export const hotelById = Object.fromEntries(HOTELS.map((h) => [h.id, h]));
