// هيكل ربط TBO Holidays Hotel API — يُستكمل عند استلام بيانات الدخول والتوثيق الرسمي.
// المسار المعتاد: Search → PreBook (تثبيت السعر) → Book → BookingDetail / Cancel.
// مهم: أسماء الحقول أدناه مبدئية ويجب مطابقتها مع توثيق TBO الذي يصلك مع الحساب.
import { config } from '../config.js';

async function call(path, body) {
  const { baseUrl, username, password } = config.tbo;
  if (!username || !password) throw Object.assign(new Error('TBO credentials are not configured'), { status: 503 });
  const res = await fetch(`${baseUrl}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw Object.assign(new Error(`TBO ${path} failed: ${res.status}`), { status: 502 });
  return res.json();
}

const todo = (what) => { throw Object.assign(new Error(`TBO: ${what} not mapped yet`), { status: 501 }); };

export const tboProvider = {
  name: 'tbo',
  async search(params /* , factor */) {
    // 1) حوّل الوجهة إلى أكواد فنادق TBO (تُخزَّن محلياً من TBOHotelCodeList وتُحدَّث دورياً)
    // 2) نادِ Search ثم خزّن النتيجة في Redis لدقائق (الأسعار حيّة ولا تُحفظ في قاعدة البيانات)
    // 3) حوّل الاستجابة إلى نفس شكل searchHotels() ليعمل الـ Frontend دون تعديل
    await call('Search', {
      CheckIn: params.in, CheckOut: params.out, HotelCodes: '', GuestNationality: 'SA',
      PaxRooms: [{ Adults: Number(params.ad) || 2, Children: Number(params.ch) || 0, ChildrenAges: [] }],
      ResponseTime: 20, IsDetailedResponse: false,
    });
    return todo('search response');
  },
  async hotel() { return todo('HotelDetails'); },
  async suggest() { return todo('CityList / hotel codes'); },
  async priceCheck() { return todo('PreBook'); },
};
