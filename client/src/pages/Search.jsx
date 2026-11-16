import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import { AMENITIES, PROPERTY_TYPES } from '../data/catalog.js';
import { safeDates } from '../lib/search.js';
import SearchBox from '../components/SearchBox.jsx';
import { HotelRow } from '../components/HotelCard.jsx';
import { Empty, Stars } from '../components/ui.jsx';

const FILTER_KEYS = ['pmin', 'pmax', 'stars', 'rating', 'types', 'am', 'meal', 'fc', 'dist'];

function Group({ title, children }) {
  return <fieldset className="f-group"><legend>{title}</legend>{children}</fieldset>;
}
function Check({ checked, onChange, children, count }) {
  return (
    <label className={`f-check ${count === 0 && !checked ? 'dim' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
      {count != null && <i>{count}</i>}
    </label>
  );
}

function PriceRange({ bounds, value, onCommit, money }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value[0], value[1]]); // eslint-disable-line
  const span = Math.max(1, bounds.max - bounds.min);
  const pct = (x) => ((x - bounds.min) / span) * 100;
  const commit = () => onCommit(v);
  return (
    <div className="range">
      <div className="range-vals" dir="ltr"><span>{money(v[0])}</span><span>{money(v[1])}</span></div>
      <div className="range-track" dir="ltr">
        <div className="range-fill" style={{ left: `${pct(v[0])}%`, right: `${100 - pct(v[1])}%` }} />
        <input type="range" min={bounds.min} max={bounds.max} value={v[0]} aria-label="min"
          onChange={(e) => setV([Math.min(+e.target.value, v[1] - 1), v[1]])} onMouseUp={commit} onTouchEnd={commit} onKeyUp={commit} />
        <input type="range" min={bounds.min} max={bounds.max} value={v[1]} aria-label="max"
          onChange={(e) => setV([v[0], Math.max(+e.target.value, v[0] + 1)])} onMouseUp={commit} onTouchEnd={commit} onKeyUp={commit} />
      </div>
    </div>
  );
}

export default function Search() {
  const { tx, L, lang, money, factor, admin } = useApp();
  const [sp, setSp] = useSearchParams();
  const params = useMemo(() => Object.fromEntries(sp), [sp]);
  const { checkIn, checkOut, nights } = safeDates(params.in, params.out);
  const rooms = Math.max(1, +params.rm || 1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const key = sp.toString();
  useEffect(() => {
    let live = true;
    setLoading(true);
    api.search(params, { factor, overrides: admin.hotel }).then((r) => { if (live) { setData(r); setLoading(false); } });
    return () => { live = false; };
  }, [key, factor, admin.hotel]); // eslint-disable-line

  const set = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null || v === false ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setSp(next, { replace: true });
  };
  const arr = (k) => (params[k] ? params[k].split(',') : []);
  const toggle = (k, id, on) => set({ [k]: (on ? [...arr(k), id] : arr(k).filter((x) => x !== String(id))).join(',') });
  const activeCount = FILTER_KEYS.filter((k) => params[k]).length;
  const clear = () => set(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
  const goPage = (n) => { set({ page: n }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const cardQs = new URLSearchParams({ in: checkIn, out: checkOut, ad: params.ad || 2, ch: params.ch || 0, rm: rooms }).toString();
  const f = data?.facets;
  const b = data?.bounds || { min: 0, max: 0 };
  const where = data?.dest ? data.dest[lang] : params.q || tx('كل الوجهات', 'All destinations');

  const filters = f && (
    <>
      <div className="f-head">
        <b>{tx('تصفية النتائج', 'Filter results')}</b>
        {activeCount > 0 && <button className="link-btn" onClick={clear}>{tx('مسح الكل', 'Clear all')} ({activeCount})</button>}
      </div>
      {b.max > b.min && (
        <Group title={tx('السعر لليلة', 'Price per night')}>
          <PriceRange bounds={b} money={money} value={[+params.pmin || b.min, Math.min(+params.pmax || b.max, b.max)]}
            onCommit={([lo, hi]) => set({ pmin: lo > b.min ? lo : '', pmax: hi < b.max ? hi : '' })} />
        </Group>
      )}
      <Group title={tx('خيارات شائعة', 'Popular filters')}>
        <Check checked={!!params.fc} onChange={(on) => set({ fc: on ? 1 : '' })} count={f.freeCancel}>{tx('إلغاء مجاني', 'Free cancellation')}</Check>
        <Check checked={params.meal === 'bb'} onChange={(on) => set({ meal: on ? 'bb' : '' })} count={f.breakfast}>{tx('شامل الإفطار', 'Breakfast included')}</Check>
      </Group>
      <Group title={tx('تصنيف النجوم', 'Star rating')}>
        {[5, 4, 3, 2].map((s) => (
          <Check key={s} checked={arr('stars').includes(String(s))} onChange={(on) => toggle('stars', s, on)} count={f.stars[s]}><Stars n={s} /></Check>
        ))}
      </Group>
      <Group title={tx('تقييم الضيوف', 'Guest rating')}>
        <div className="seg">
          {[['', tx('الكل', 'Any')], ['7', '7+'], ['8', '8+'], ['9', '9+']].map(([v, label]) => (
            <button key={v} type="button" className={(params.rating || '') === v ? 'on' : ''} onClick={() => set({ rating: v })}>{label}</button>
          ))}
        </div>
      </Group>
      <Group title={tx('نوع الإقامة', 'Property type')}>
        {PROPERTY_TYPES.map((t) => (
          <Check key={t.id} checked={arr('types').includes(t.id)} onChange={(on) => toggle('types', t.id, on)} count={f.types[t.id] || 0}>{L(t)}</Check>
        ))}
      </Group>
      <Group title={tx('المسافة من المركز', 'Distance from centre')}>
        <div className="seg">
          {[['', tx('الكل', 'Any')], ['1', '1'], ['3', '3'], ['5', '5']].map(([v, label]) => (
            <button key={v} type="button" className={(params.dist || '') === v ? 'on' : ''} onClick={() => set({ dist: v })}>
              {v ? tx(`${label} كم`, `${label} km`) : label}
            </button>
          ))}
        </div>
      </Group>
      <Group title={tx('المرافق', 'Facilities')}>
        {AMENITIES.filter((a) => a.id !== 'ac').map((a) => (
          <Check key={a.id} checked={arr('am').includes(a.id)} onChange={(on) => toggle('am', a.id, on)} count={f.amenities[a.id] || 0}>{L(a)}</Check>
        ))}
      </Group>
    </>
  );

  return (
    <>
      <div className="search-bar"><div className="container"><SearchBox key={`${params.dest}|${params.q}|${lang}`} initial={params} compact /></div></div>
      <div className="container results">
        <aside className={`filters ${drawer ? 'open' : ''}`} aria-label={tx('الفلاتر', 'Filters')}>
          <button className="drawer-close" onClick={() => setDrawer(false)} aria-label={tx('إغلاق', 'Close')}><X /></button>
          {filters || <div className="skel" style={{ height: 480 }} />}
          <button className="btn btn-brand block drawer-apply" onClick={() => setDrawer(false)}>
            {tx(`عرض ${data?.total ?? 0} نتيجة`, `Show ${data?.total ?? 0} results`)}
          </button>
        </aside>
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

        <section className="results-main" aria-busy={loading}>
          <div className="results-head">
            <div>
              <h1>{where}</h1>
              <p className="muted" aria-live="polite">
                {data ? tx(`${data.total} مكان إقامة متاح`, `${data.total} stays available`) : tx('جارٍ البحث…', 'Searching…')}
              </p>
            </div>
            <div className="results-tools">
              <button className="pill light filter-btn" onClick={() => setDrawer(true)}>
                <SlidersHorizontal size={16} />{tx('الفلاتر', 'Filters')}{activeCount > 0 && <i className="dot">{activeCount}</i>}
              </button>
              <label className="sort">
                <span>{tx('ترتيب:', 'Sort:')}</span>
                <select value={params.sort || 'recommended'} onChange={(e) => set({ sort: e.target.value === 'recommended' ? '' : e.target.value })}>
                  <option value="recommended">{tx('الأنسب لك', 'Recommended')}</option>
                  <option value="price_asc">{tx('السعر: من الأقل', 'Price: low to high')}</option>
                  <option value="price_desc">{tx('السعر: من الأعلى', 'Price: high to low')}</option>
                  <option value="rating">{tx('تقييم الضيوف', 'Guest rating')}</option>
                  <option value="stars">{tx('عدد النجوم', 'Star rating')}</option>
                  <option value="distance">{tx('الأقرب للمركز', 'Distance from centre')}</option>
                </select>
              </label>
            </div>
          </div>

          <div className={`list ${loading && data ? 'stale' : ''}`}>
            {!data && Array.from({ length: 4 }, (_, i) => <div key={i} className="skel row-skel" />)}
            {data?.items.map((h) => <HotelRow key={h.id} h={h} qs={cardQs} nights={nights} rooms={rooms} />)}
            {data && data.total === 0 && (
              <Empty icon={SearchX} title={tx('لا توجد نتائج مطابقة', 'No matching stays')}>
                <p>{data.baseTotal > 0 ? tx('جرّب تخفيف الفلاتر لعرض خيارات أكثر.', 'Try relaxing your filters to see more options.') : tx('جرّب وجهة أخرى أو عدد ضيوف أقل لكل غرفة.', 'Try another destination or fewer guests per room.')}</p>
                {activeCount > 0 && <button className="btn btn-brand" onClick={clear}>{tx('مسح الفلاتر', 'Clear filters')}</button>}
              </Empty>
            )}
          </div>

          {data && data.pages > 1 && (
            <nav className="pager" aria-label={tx('الصفحات', 'Pagination')}>
              <button disabled={data.page <= 1} onClick={() => goPage(data.page - 1)} aria-label={tx('السابق', 'Previous')}><ChevronRight size={18} className="flip" /></button>
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={n === data.page ? 'on' : ''} aria-current={n === data.page ? 'page' : undefined} onClick={() => goPage(n)}>{n}</button>
              ))}
              <button disabled={data.page >= data.pages} onClick={() => goPage(data.page + 1)} aria-label={tx('التالي', 'Next')}><ChevronLeft size={18} className="flip" /></button>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
