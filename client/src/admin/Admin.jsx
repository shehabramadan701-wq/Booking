import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { BadgePercent, BedDouble, CreditCard, Download, ExternalLink, LayoutDashboard, Plug, Search, Tag, Ticket, Trash2, Users } from 'lucide-react';
import { DEFAULT_ADMIN, useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import { DESTINATIONS, destById, hotelById, HOTELS } from '../data/catalog.js';
import { Logo } from '../components/Layout.jsx';
import { statusLabel } from '../pages/Account.jsx';
import { PAY_METHODS } from '../pages/Checkout.jsx';
import { byDay, byDestination, demoBookings, isPaid, kpis } from './data.js';
import '../styles/admin.css';

const STATUSES = ['confirmed', 'pending', 'completed', 'cancelled', 'refunded'];
const methodById = Object.fromEntries(PAY_METHODS.map((m) => [m.id, m]));

const KEY_SLOT = 'nz.adminKey';
const readKey = () => { try { return sessionStorage.getItem(KEY_SLOT) || ''; } catch { return ''; } };

// حجوزات كل الزوار من الخادم (تتطلب مفتاح الإدارة) — تُحدَّث كل 30 ثانية
function useServerBookings() {
  const [state, setState] = useState({ rows: [], error: '' });
  useEffect(() => {
    if (!api.remote) return undefined;
    let live = true;
    const load = async () => {
      const key = readKey();
      if (!key) { if (live) setState({ rows: [], error: 'no_key' }); return; }
      try { const rows = await api.adminBookings(key); if (live) setState({ rows, error: '' }); }
      catch (e) { if (live) setState({ rows: [], error: e.status === 401 ? 'bad_key' : 'offline' }); }
    };
    load();
    const t = setInterval(load, 30000);
    window.addEventListener('nz-admin-key', load);
    return () => { live = false; clearInterval(t); window.removeEventListener('nz-admin-key', load); };
  }, []);
  return state;
}

function useAllBookings() {
  const { bookings, admin } = useApp();
  const server = useServerBookings();
  return useMemo(() => {
    const norm = (b) => ({ method: 'card', ...b, destId: hotelById[b.hotelId].destId, createdAt: b.createdAt.slice(0, 10), supplier: 'TBO', live: true });
    const fromServer = server.rows.filter((b) => hotelById[b.hotelId]).map(norm);
    const seen = new Set(fromServer.map((b) => b.ref));
    const mine = bookings.filter((b) => !seen.has(b.ref)).map(norm);
    return [...fromServer, ...mine, ...demoBookings(admin.markupGlobal)].map((b) => (admin.bookingStatus[b.ref] ? { ...b, status: admin.bookingStatus[b.ref] } : b));
  }, [bookings, server.rows, admin.bookingStatus, admin.markupGlobal]);
}

function ServerKeyCard() {
  const { tx } = useApp();
  const server = useServerBookings();
  const [key, setKey] = useState(readKey);
  if (!api.remote) return null;
  const save = (e) => {
    e.preventDefault();
    try { sessionStorage.setItem(KEY_SLOT, key.trim()); } catch { /* التخزين غير متاح */ }
    window.dispatchEvent(new Event('nz-admin-key'));
  };
  const msg = { no_key: tx('أدخل مفتاح الإدارة لعرض حجوزات كل الزوار.', 'Enter the admin key to see bookings from all visitors.'), bad_key: tx('المفتاح غير صحيح. راجع قيمة ADMIN_API_KEY على الخادم.', 'Wrong key. Check ADMIN_API_KEY on the server.'), offline: tx('تعذّر الاتصال بالخادم. تأكد أنه يعمل ثم حاول مجدداً.', 'Could not reach the server. Make sure it is running, then try again.') }[server.error];
  return (
    <section className="card pad">
      <h2>{tx('الاتصال بالخادم', 'Server connection')}</h2>
      <form className="toolbar" onSubmit={save}>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={tx('مفتاح الإدارة', 'Admin key')} dir="ltr" autoComplete="off" maxLength={200} aria-label={tx('مفتاح الإدارة', 'Admin key')} />
        <button className="btn btn-brand btn-sm">{tx('اتصال', 'Connect')}</button>
        {msg ? <span className={server.error === 'no_key' ? 'muted' : 'err-text'} role="status">{msg}</span>
          : <span className="ok-text" role="status">{tx(`متصل — ${server.rows.length} حجز على الخادم`, `Connected — ${server.rows.length} bookings on the server`)}</span>}
      </form>
      <p className="muted">{tx('المفتاح يُحفظ في هذه الجلسة فقط ويُمسح عند إغلاق المتصفح.', 'The key is kept for this session only and cleared when the browser closes.')}</p>
    </section>
  );
}

function BarChart({ data, format, label }) {
  const { fmtDate } = useApp();
  const [hi, setHi] = useState(null);
  const W = 640, H = 220, P = { t: 12, r: 8, b: 26, l: 8 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = (W - P.l - P.r) / data.length;
  const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max);
  return (
    <div className="chart" dir="ltr" onMouseLeave={() => setHi(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {[0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={P.l} x2={W - P.r} y1={y(max * g)} y2={y(max * g)} className="grid" />)}
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="axis" />
        {data.map((d, i) => {
          const h = Math.max(d.value ? 2 : 0, H - P.b - y(d.value));
          return (
            <g key={d.day} onMouseEnter={() => setHi(i)}>
              <rect x={P.l + i * bw} y={P.t} width={bw} height={H - P.t - P.b} fill="transparent" />
              <path className={`bar ${hi === i ? 'hi' : ''}`} d={`M${P.l + i * bw + 3},${H - P.b} v${-Math.max(0, h - 4)} q0,-4 4,-4 h${bw - 14} q4,0 4,4 v${Math.max(0, h - 4)} z`} />
              {i % 2 === 1 && <text x={P.l + i * bw + bw / 2} y={H - 8} textAnchor="middle">{`${+d.day.slice(8)}/${+d.day.slice(5, 7)}`}</text>}
            </g>
          );
        })}
      </svg>
      {hi != null && (
        <div className="tip" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
          <b>{format(data[hi].value)}</b><span>{fmtDate(data[hi].day)} · {data[hi].count}</span>
        </div>
      )}
    </div>
  );
}

function Overview() {
  const { tx, money, lang, fmtDate } = useApp();
  const all = useAllBookings();
  const k = kpis(all);
  const days = byDay(all);
  const dests = byDestination(all).slice(0, 6);
  const top = Math.max(1, dests[0]?.value || 1);
  const tiles = [
    [tx('إجمالي المبيعات', 'Gross sales'), money(k.revenue), tx(`${k.paid} حجز مدفوع`, `${k.paid} paid bookings`)],
    [tx('صافي الربح (الهامش)', 'Net margin'), money(k.profit), tx('بعد تكلفة المورّد والضرائب', 'After supplier cost & taxes')],
    [tx('متوسط قيمة الحجز', 'Avg. booking value'), money(k.avg), tx('للحجوزات المدفوعة', 'Paid bookings')],
    [tx('نسبة الإلغاء', 'Cancellation rate'), `${k.cancelRate.toFixed(1)}%`, tx(`من ${k.count} حجز`, `of ${k.count} bookings`)],
  ];
  return (
    <>
      <h1>{tx('نظرة عامة', 'Overview')}</h1>
      <div className="kpis">{tiles.map(([label, value, sub]) => <div key={label} className="card kpi"><span>{label}</span><b>{value}</b><small>{sub}</small></div>)}</div>
      <div className="adm-cols">
        <section className="card pad">
          <h2>{tx('المبيعات اليومية — آخر 14 يوماً', 'Daily sales — last 14 days')}</h2>
          <BarChart data={days} format={money} label={tx('المبيعات اليومية', 'Daily sales')} />
        </section>
        <section className="card pad">
          <h2>{tx('أعلى الوجهات مبيعاً', 'Top destinations by sales')}</h2>
          <ul className="hbars">
            {dests.map((d) => (
              <li key={d.id} title={`${d.count}`}>
                <span>{d[lang]}</span>
                <div><i style={{ width: `${(d.value / top) * 100}%` }} /></div>
                <b>{money(d.value)}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="card pad">
        <div className="section-head"><h2>{tx('أحدث الحجوزات', 'Latest bookings')}</h2><Link to="/admin/bookings">{tx('عرض الكل', 'View all')}</Link></div>
        <BookingTable rows={all.slice(0, 6)} fmtDate={fmtDate} />
      </section>
    </>
  );
}

function BookingTable({ rows, editable }) {
  const { tx, L, money, fmtDate, admin, setAdmin } = useApp();
  const setStatus = (ref, status) => setAdmin({ ...admin, bookingStatus: { ...admin.bookingStatus, [ref]: status } });
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>{tx('المرجع', 'Ref')}</th><th>{tx('العميل', 'Guest')}</th><th>{tx('الفندق', 'Hotel')}</th><th>{tx('الوصول', 'Check‑in')}</th><th>{tx('الليالي', 'Nights')}</th><th>{tx('الدفع', 'Method')}</th><th className="num">{tx('الإجمالي', 'Total')}</th><th>{tx('الحالة', 'Status')}</th></tr></thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.ref}>
              <td dir="ltr"><code>{b.ref}</code>{b.live && <span className="chip tiny">{tx('جديد', 'new')}</span>}</td>
              <td>{b.guest.name}<small>{b.guest.country}</small></td>
              <td>{L(hotelById[b.hotelId].name)}</td>
              <td>{fmtDate(b.checkIn)}</td>
              <td>{b.nights}</td>
              <td>{L(methodById[b.method]).split(' (')[0]}</td>
              <td className="num">{money(b.totalUsd)}</td>
              <td>
                {editable ? (
                  <select className={`status ${b.status}`} value={b.status} onChange={(e) => setStatus(b.ref, e.target.value)} aria-label={tx('الحالة', 'Status')}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, tx)}</option>)}
                  </select>
                ) : <span className={`status ${b.status}`}>{statusLabel(b.status, tx)}</span>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={8} className="none">{tx('لا توجد نتائج مطابقة', 'No matching rows')}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Toolbar({ q, setQ, placeholder, children }) {
  return (
    <div className="toolbar">
      <label className="adm-search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} maxLength={60} /></label>
      {children}
    </div>
  );
}

function usePaged(rows, size = 12) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(page, pages);
  const { tx } = useApp();
  const pager = pages > 1 && (
    <div className="adm-pager">
      <button className="btn btn-ghost btn-sm" disabled={p <= 1} onClick={() => setPage(p - 1)}>{tx('السابق', 'Prev')}</button>
      <span>{p} / {pages}</span>
      <button className="btn btn-ghost btn-sm" disabled={p >= pages} onClick={() => setPage(p + 1)}>{tx('التالي', 'Next')}</button>
    </div>
  );
  return [rows.slice((p - 1) * size, p * size), pager, () => setPage(1)];
}

function BookingsAdmin() {
  const { tx, L } = useApp();
  const all = useAllBookings();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const n = q.trim().toLowerCase();
  const rows = all.filter((b) => (!st || b.status === st) && (!n || [b.ref, b.guest.name, L(hotelById[b.hotelId].name)].some((x) => x.toLowerCase().includes(n))));
  const [view, pager] = usePaged(rows);
  const exportCsv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`; // منع حقن الصيغ في Excel
    const csv = [['ref', 'created', 'guest', 'hotel', 'check_in', 'nights', 'status', 'net_usd', 'total_usd'],
      ...rows.map((b) => [b.ref, b.createdAt, b.guest.name, hotelById[b.hotelId].name.en, b.checkIn, b.nights, b.status, b.netUsd, b.totalUsd])]
      .map((r) => r.map(esc).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = 'bookings.csv'; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <h1>{tx('الحجوزات', 'Bookings')} <small>({rows.length})</small></h1>
      <Toolbar q={q} setQ={setQ} placeholder={tx('ابحث بالمرجع، العميل أو الفندق', 'Search ref, guest or hotel')}>
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label={tx('الحالة', 'Status')}>
          <option value="">{tx('كل الحالات', 'All statuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s, tx)}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><Download size={16} />{tx('تصدير CSV', 'Export CSV')}</button>
      </Toolbar>
      <div className="card"><BookingTable rows={view} editable /></div>
      {pager}
    </>
  );
}

function HotelsAdmin() {
  const { tx, L, lang, money, factor, admin, setAdmin } = useApp();
  const [q, setQ] = useState('');
  const [dest, setDest] = useState('');
  const n = q.trim().toLowerCase();
  const rows = HOTELS.filter((h) => (!dest || h.destId === dest) && (!n || h.name.ar.includes(n) || h.name.en.toLowerCase().includes(n)));
  const [view, pager] = usePaged(rows);
  const patch = (id, p) => setAdmin({ ...admin, hotel: { ...admin.hotel, [id]: { ...admin.hotel[id], ...p } } });
  return (
    <>
      <h1>{tx('الفنادق', 'Hotels')} <small>({rows.length})</small></h1>
      <Toolbar q={q} setQ={setQ} placeholder={tx('ابحث باسم الفندق', 'Search hotel name')}>
        <select value={dest} onChange={(e) => setDest(e.target.value)} aria-label={tx('الوجهة', 'Destination')}>
          <option value="">{tx('كل الوجهات', 'All destinations')}</option>
          {DESTINATIONS.map((d) => <option key={d.id} value={d.id}>{d[lang]}</option>)}
        </select>
      </Toolbar>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{tx('الفندق', 'Hotel')}</th><th>{tx('الوجهة', 'Destination')}</th><th>{tx('النجوم', 'Stars')}</th><th>{tx('التقييم', 'Rating')}</th><th className="num">{tx('سعر المورّد', 'Net rate')}</th><th className="num">{tx('سعر البيع', 'Sell rate')}</th><th>{tx('مميّز', 'Featured')}</th><th>{tx('ظاهر بالموقع', 'Visible')}</th><th /></tr></thead>
          <tbody>
            {view.map((h) => {
              const o = admin.hotel[h.id] || {};
              return (
                <tr key={h.id} className={o.active === false ? 'off' : ''}>
                  <td>{L(h.name)}<small>{h.id}</small></td>
                  <td>{destById[h.destId][lang]}</td><td>{h.stars}★</td><td>{h.rating.toFixed(1)}</td>
                  <td className="num">{money(h.minPrice)}</td><td className="num">{money(Math.round(h.minPrice * factor(h)))}</td>
                  <td><input type="checkbox" className="switch" checked={o.featured ?? h.featured} onChange={(e) => patch(h.id, { featured: e.target.checked })} aria-label={tx('مميّز', 'Featured')} /></td>
                  <td><input type="checkbox" className="switch" checked={o.active !== false} onChange={(e) => patch(h.id, { active: e.target.checked })} aria-label={tx('ظاهر', 'Visible')} /></td>
                  <td><Link to={`/hotel/${h.id}`} target="_blank" aria-label={tx('فتح صفحة الفندق', 'Open hotel page')}><ExternalLink size={16} /></Link></td>
                </tr>
              );
            })}
            {view.length === 0 && <tr><td colSpan={9} className="none">{tx('لا توجد نتائج مطابقة', 'No matching rows')}</td></tr>}
          </tbody>
        </table>
      </div>
      {pager}
    </>
  );
}

function CustomersAdmin() {
  const { tx, money } = useApp();
  const all = useAllBookings();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const m = new Map();
    all.forEach((b) => {
      const c = m.get(b.guest.name) || { name: b.guest.name, country: b.guest.country, email: b.guest.email, count: 0, spent: 0, last: '' };
      c.count += 1; if (isPaid(b)) c.spent += b.totalUsd; if (b.createdAt > c.last) c.last = b.createdAt;
      m.set(b.guest.name, c);
    });
    return [...m.values()].sort((a, b) => b.spent - a.spent);
  }, [all]).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <h1>{tx('العملاء', 'Customers')} <small>({rows.length})</small></h1>
      <Toolbar q={q} setQ={setQ} placeholder={tx('ابحث باسم العميل', 'Search customer')} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{tx('العميل', 'Customer')}</th><th>{tx('الدولة', 'Country')}</th><th>{tx('عدد الحجوزات', 'Bookings')}</th><th className="num">{tx('إجمالي الإنفاق', 'Total spent')}</th><th>{tx('آخر حجز', 'Last booking')}</th></tr></thead>
          <tbody>
            {rows.map((c) => <tr key={c.name}><td>{c.name}<small dir="ltr">{c.email}</small></td><td>{c.country}</td><td>{c.count}</td><td className="num">{money(c.spent)}</td><td dir="ltr">{c.last}</td></tr>)}
            {rows.length === 0 && <tr><td colSpan={5} className="none">{tx('لا توجد نتائج مطابقة', 'No matching rows')}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PricingAdmin() {
  const { tx, lang, money, admin, setAdmin } = useApp();
  const sample = 100;
  const setDest = (id, v) => {
    const next = { ...admin.markupByDest };
    if (v === '') delete next[id]; else next[id] = Math.min(60, Math.max(0, +v || 0));
    setAdmin({ ...admin, markupByDest: next });
  };
  return (
    <>
      <h1>{tx('التسعير وهامش الربح', 'Pricing & markup')}</h1>
      <section className="card pad">
        <h2>{tx('الهامش العام فوق سعر المورّد', 'Global markup over supplier rate')}</h2>
        <div className="markup">
          <input type="range" min={0} max={40} value={admin.markupGlobal} onChange={(e) => setAdmin({ ...admin, markupGlobal: +e.target.value })} aria-label={tx('الهامش العام', 'Global markup')} />
          <output>{admin.markupGlobal}%</output>
        </div>
        <p className="muted">{tx(`مثال: سعر المورّد ${money(sample)} ← يُعرض للعميل ${money(sample * (1 + admin.markupGlobal / 100))}. التغيير ينعكس فوراً على كل صفحات الموقع.`, `Example: supplier rate ${money(sample)} → shown to customers as ${money(sample * (1 + admin.markupGlobal / 100))}. Changes apply to the whole site instantly.`)}</p>
      </section>
      <section className="card pad">
        <h2>{tx('هامش خاص لكل وجهة', 'Per‑destination override')}</h2>
        <p className="muted">{tx('اتركه فارغاً لاستخدام الهامش العام.', 'Leave empty to use the global markup.')}</p>
        <div className="dest-markup">
          {DESTINATIONS.map((d) => (
            <label key={d.id}><span>{d[lang]}</span>
              <input type="number" min={0} max={60} placeholder={`${admin.markupGlobal}`} value={admin.markupByDest[d.id] ?? ''} onChange={(e) => setDest(d.id, e.target.value)} /><i>%</i>
            </label>
          ))}
        </div>
      </section>
    </>
  );
}

function PromosAdmin() {
  const { tx, admin, setAdmin } = useApp();
  const [code, setCode] = useState('');
  const [pct, setPct] = useState(10);
  const [err, setErr] = useState('');
  const save = (promos) => setAdmin({ ...admin, promos });
  const add = (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(c)) return setErr(tx('الكود: 4–16 حرفاً إنجليزياً أو رقماً', 'Code: 4–16 letters or digits'));
    if (admin.promos.some((p) => p.code === c)) return setErr(tx('هذا الكود موجود بالفعل', 'This code already exists'));
    save([{ code: c, pct: Math.min(50, Math.max(1, +pct || 1)), active: true, uses: 0 }, ...admin.promos]);
    setCode(''); setErr('');
  };
  return (
    <>
      <h1>{tx('أكواد الخصم', 'Promo codes')}</h1>
      <form className="card pad toolbar" onSubmit={add}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={tx('الكود مثل EID20', 'Code e.g. EID20')} dir="ltr" maxLength={16} aria-label={tx('الكود', 'Code')} />
        <label className="inline"><span>{tx('نسبة الخصم %', 'Discount %')}</span><input type="number" min={1} max={50} value={pct} onChange={(e) => setPct(e.target.value)} /></label>
        <button className="btn btn-brand btn-sm">{tx('إضافة كود', 'Add code')}</button>
        {err && <span className="err-text" role="alert">{err}</span>}
      </form>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{tx('الكود', 'Code')}</th><th>{tx('الخصم', 'Discount')}</th><th>{tx('مرات الاستخدام', 'Uses')}</th><th>{tx('مفعّل', 'Active')}</th><th /></tr></thead>
          <tbody>
            {admin.promos.map((p) => (
              <tr key={p.code} className={p.active ? '' : 'off'}>
                <td dir="ltr"><code>{p.code}</code></td><td>{p.pct}%</td><td>{p.uses}</td>
                <td><input type="checkbox" className="switch" checked={p.active} onChange={(e) => save(admin.promos.map((x) => (x.code === p.code ? { ...x, active: e.target.checked } : x)))} aria-label={tx('مفعّل', 'Active')} /></td>
                <td><button className="icon-btn" onClick={() => save(admin.promos.filter((x) => x.code !== p.code))} aria-label={tx(`حذف ${p.code}`, `Delete ${p.code}`)}><Trash2 size={16} /></button></td>
              </tr>
            ))}
            {admin.promos.length === 0 && <tr><td colSpan={5} className="none">{tx('لا توجد أكواد بعد', 'No codes yet')}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PaymentsAdmin() {
  const { tx, L, money } = useApp();
  const all = useAllBookings().filter((b) => b.status !== 'pending');
  const fee = (b) => b.totalUsd * 0.025;
  const paid = all.filter(isPaid);
  const [view, pager] = usePaged(all);
  return (
    <>
      <h1>{tx('المدفوعات', 'Payments')}</h1>
      <div className="kpis">
        <div className="card kpi"><span>{tx('المحصّل', 'Collected')}</span><b>{money(paid.reduce((s, b) => s + b.totalUsd, 0))}</b><small>{paid.length} {tx('عملية', 'transactions')}</small></div>
        <div className="card kpi"><span>{tx('رسوم البوابة (تقديري 2.5%)', 'Gateway fees (est. 2.5%)')}</span><b>{money(paid.reduce((s, b) => s + fee(b), 0))}</b><small>MyFatoorah</small></div>
        <div className="card kpi"><span>{tx('المبالغ المستردة', 'Refunded')}</span><b>{money(all.filter((b) => b.status === 'refunded').reduce((s, b) => s + b.totalUsd, 0))}</b><small>{all.filter((b) => b.status === 'refunded').length} {tx('عملية', 'transactions')}</small></div>
      </div>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{tx('التاريخ', 'Date')}</th><th>{tx('مرجع الحجز', 'Booking ref')}</th><th>{tx('الطريقة', 'Method')}</th><th className="num">{tx('المبلغ', 'Amount')}</th><th className="num">{tx('الرسوم', 'Fee')}</th><th>{tx('النتيجة', 'Result')}</th></tr></thead>
          <tbody>
            {view.map((b) => (
              <tr key={b.ref}><td dir="ltr">{b.createdAt}</td><td dir="ltr"><code>{b.ref}</code></td><td>{L(methodById[b.method]).split(' (')[0]}</td>
                <td className="num">{money(b.totalUsd)}</td><td className="num">{money(fee(b))}</td>
                <td><span className={`status ${isPaid(b) ? 'confirmed' : b.status}`}>{isPaid(b) ? tx('مدفوع', 'Paid') : statusLabel(b.status, tx)}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {pager}
    </>
  );
}

function SettingsAdmin() {
  const { tx, admin, setAdmin } = useApp();
  const [asked, setAsked] = useState(false);
  const rows = [
    ['TBO Holidays', tx('مورّد الفنادق الرئيسي (أسعار الجملة)', 'Primary hotel supplier (wholesale rates)'), tx('وضع تجريبي — بانتظار مفاتيح الـ API', 'Sandbox — awaiting API keys'), 'suppliers', 'tbo'],
    [tx('عقود مباشرة', 'Direct contracts'), tx('فنادق تتعاقد معها مباشرة', 'Hotels you contract directly'), tx('غير مفعّل', 'Not enabled'), 'suppliers', 'direct'],
    ['MyFatoorah', tx('بوابة الدفع: مدى، فيزا، كي‑نت، Apple Pay', 'Gateway: mada, Visa, KNET, Apple Pay'), tx('وضع تجريبي — بانتظار مفتاح الـ API', 'Sandbox — awaiting API key'), 'gateways', 'myfatoorah'],
  ];
  return (
    <>
      <h1>{tx('الربط والإعدادات', 'Integrations & settings')}</h1>
      <ServerKeyCard />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>{tx('الخدمة', 'Service')}</th><th>{tx('الوصف', 'Description')}</th><th>{tx('الحالة', 'Status')}</th><th>{tx('مفعّل', 'Enabled')}</th></tr></thead>
          <tbody>
            {rows.map(([name, desc, state, group, key]) => (
              <tr key={key}><td><b>{name}</b></td><td>{desc}</td><td><span className="status pending">{state}</span></td>
                <td><input type="checkbox" className="switch" checked={!!admin[group][key]} onChange={(e) => setAdmin({ ...admin, [group]: { ...admin[group], [key]: e.target.checked } })} aria-label={name} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card pad">
        <h2>{tx('إعادة ضبط البيانات التجريبية', 'Reset demo data')}</h2>
        <p className="muted">{tx('يعيد الهوامش وأكواد الخصم وحالات الفنادق والحجوزات إلى قيمها الأصلية. لا يمكن التراجع.', 'Restores markups, promo codes, hotel visibility and booking statuses to defaults. This cannot be undone.')}</p>
        {asked
          ? <div className="modal-actions start"><button className="btn btn-danger btn-sm" onClick={() => { setAdmin(DEFAULT_ADMIN); setAsked(false); }}>{tx('إعادة الضبط', 'Reset data')}</button><button className="btn btn-ghost btn-sm" onClick={() => setAsked(false)}>{tx('تراجع', 'Keep current')}</button></div>
          : <button className="btn btn-ghost btn-sm" onClick={() => setAsked(true)}>{tx('إعادة ضبط…', 'Reset…')}</button>}
      </section>
    </>
  );
}

export default function Admin() {
  const { user, tx } = useApp();
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  const links = [
    ['', LayoutDashboard, tx('نظرة عامة', 'Overview')], ['bookings', Ticket, tx('الحجوزات', 'Bookings')], ['hotels', BedDouble, tx('الفنادق', 'Hotels')],
    ['customers', Users, tx('العملاء', 'Customers')], ['pricing', BadgePercent, tx('التسعير', 'Pricing')], ['promos', Tag, tx('أكواد الخصم', 'Promo codes')],
    ['payments', CreditCard, tx('المدفوعات', 'Payments')], ['settings', Plug, tx('الربط والإعدادات', 'Integrations')],
  ];
  return (
    <div className="admin">
      <aside className="adm-side">
        <Logo />
        <nav>{links.map(([to, Icon, label]) => <NavLink key={to} to={`/admin/${to}`} end={!to}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
        <Link className="adm-back" to="/">{tx('← العودة للموقع', '← Back to site')}</Link>
      </aside>
      <main className="adm-main">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="bookings" element={<BookingsAdmin />} />
          <Route path="hotels" element={<HotelsAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
          <Route path="pricing" element={<PricingAdmin />} />
          <Route path="promos" element={<PromosAdmin />} />
          <Route path="payments" element={<PaymentsAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Routes>
      </main>
    </div>
  );
}
