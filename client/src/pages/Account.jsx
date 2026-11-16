import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Compass, Heart, Printer, Ticket } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { destById, hotelById, MEALS } from '../data/catalog.js';
import { addDays, todayISO } from '../lib/search.js';
import { HotelTile } from '../components/HotelCard.jsx';
import { Empty, Img } from '../components/ui.jsx';
import { PAY_METHODS } from './Checkout.jsx';

export function statusLabel(s, tx) {
  return { confirmed: tx('مؤكد', 'Confirmed'), cancelled: tx('ملغي', 'Cancelled'), pending: tx('بانتظار الدفع', 'Pending payment'), completed: tx('مكتمل', 'Completed'), refunded: tx('مُسترد', 'Refunded') }[s] || s;
}

export function Confirmation() {
  const { ref } = useParams();
  const { bookings, tx, L, lang, money, fmtDate } = useApp();
  const b = bookings.find((x) => x.ref === ref);
  if (!b) return <Navigate to="/bookings" replace />;
  const h = hotelById[b.hotelId];
  const room = h.rooms.find((r) => r.id === b.roomId);
  const long = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return (
    <div className="container section narrow">
      <div className="card pad confirm">
        <CheckCircle2 size={56} className="ok-icon" />
        <h1>{b.status === 'cancelled' ? tx('تم إلغاء هذا الحجز', 'This booking was cancelled') : tx('تم تأكيد حجزك', 'Your booking is confirmed')}</h1>
        <p className="muted">{tx(`أرسلنا القسيمة إلى ${b.guest.email}`, `We sent the voucher to ${b.guest.email}`)}</p>
        <div className="ref"><small>{tx('رقم الحجز', 'Booking reference')}</small><b dir="ltr">{b.ref}</b></div>
        <div className="summary-hotel"><Img id={h.images[0]} w={300} alt="" /><div><b>{L(h.name)}</b><small className="muted">{L(h.district)}، {destById[h.destId][lang]}</small></div></div>
        <dl className="summary-facts wide">
          <dt>{tx('النزيل', 'Guest')}</dt><dd>{b.guest.name}</dd>
          <dt>{tx('الوصول', 'Check‑in')}</dt><dd>{fmtDate(b.checkIn, long)} · {h.checkIn}</dd>
          <dt>{tx('المغادرة', 'Check‑out')}</dt><dd>{fmtDate(b.checkOut, long)} · {h.checkOut}</dd>
          <dt>{tx('الغرفة', 'Room')}</dt><dd>{b.rooms} × {L(room.name)} · {L(MEALS[b.meal])}</dd>
          <dt>{tx('الدفع', 'Payment')}</dt><dd>{L(PAY_METHODS.find((m) => m.id === b.method))}</dd>
          <dt className="grand">{tx('المبلغ المدفوع', 'Amount paid')}</dt><dd className="grand">{money(b.totalUsd, b.currency)}</dd>
        </dl>
        <div className="modal-actions no-print">
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={17} />{tx('طباعة القسيمة', 'Print voucher')}</button>
          <Link className="btn btn-brand" to="/bookings">{tx('كل حجوزاتي', 'All my bookings')}</Link>
        </div>
      </div>
    </div>
  );
}

export function Bookings() {
  const { bookings, cancelBooking, tx, L, lang, money, fmtDate } = useApp();
  const [tab, setTab] = useState('upcoming');
  const [asking, setAsking] = useState(null);
  const today = todayISO();
  const groups = {
    upcoming: bookings.filter((b) => b.status === 'confirmed' && b.checkOut >= today),
    past: bookings.filter((b) => b.status === 'confirmed' && b.checkOut < today),
    cancelled: bookings.filter((b) => b.status === 'cancelled'),
  };
  const tabs = [['upcoming', tx('القادمة', 'Upcoming')], ['past', tx('السابقة', 'Past')], ['cancelled', tx('الملغاة', 'Cancelled')]];
  return (
    <div className="container section narrow">
      <h1>{tx('حجوزاتي', 'My bookings')}</h1>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label} <i>{groups[k].length}</i></button>)}
      </div>
      {groups[tab].length === 0 && (
        <Empty icon={Ticket} title={tx('لا توجد حجوزات هنا', 'No bookings here')}>
          <p>{tx('عندما تحجز إقامة ستظهر تفاصيلها في هذه الصفحة.', 'When you book a stay, its details will show up here.')}</p>
          <Link className="btn btn-brand" to="/search"><Compass size={17} />{tx('ابحث عن فندق', 'Find a hotel')}</Link>
        </Empty>
      )}
      {groups[tab].map((b) => {
        const h = hotelById[b.hotelId];
        const free = b.refundable && addDays(b.checkIn, -3) >= today;
        return (
          <article key={b.ref} className="card booking">
            <Img id={h.images[0]} w={360} alt="" />
            <div className="booking-main">
              <div className="booking-top">
                <div><h3><Link to={`/hotel/${h.id}`}>{L(h.name)}</Link></h3><p className="muted">{destById[h.destId][lang]} · {fmtDate(b.checkIn)} — {fmtDate(b.checkOut, { day: 'numeric', month: 'short', year: 'numeric' })} · {b.nights} {tx('ليلة', 'nights')}</p></div>
                <span className={`status ${b.status}`}>{statusLabel(b.status, tx)}</span>
              </div>
              <div className="booking-bottom">
                <span>{tx('رقم الحجز', 'Ref')} <b dir="ltr">{b.ref}</b> · <b>{money(b.totalUsd, b.currency)}</b></span>
                <span className="booking-actions">
                  <Link className="btn btn-ghost btn-sm" to={`/booking/${b.ref}`}>{tx('القسيمة', 'Voucher')}</Link>
                  {tab === 'upcoming' && <button className="btn btn-danger btn-sm" onClick={() => setAsking({ b, free })}>{tx('إلغاء الحجز', 'Cancel booking')}</button>}
                </span>
              </div>
            </div>
          </article>
        );
      })}
      {asking && (
        <div className="modal-wrap" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>{tx('إلغاء الحجز؟', 'Cancel this booking?')}</h2>
            <p>{asking.free
              ? tx(`سيُلغى الحجز ${asking.b.ref} ويُسترد المبلغ كاملاً إلى وسيلة الدفع.`, `Booking ${asking.b.ref} will be cancelled and fully refunded to your payment method.`)
              : tx(`الحجز ${asking.b.ref} غير قابل للاسترداد؛ إلغاؤه لن يعيد المبلغ المدفوع.`, `Booking ${asking.b.ref} is non‑refundable; cancelling will not return the amount paid.`)}</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => { cancelBooking(asking.b.ref); setAsking(null); setTab('cancelled'); }}>{tx('إلغاء الحجز', 'Cancel booking')}</button>
              <button className="btn btn-ghost" onClick={() => setAsking(null)}>{tx('الاحتفاظ بالحجز', 'Keep booking')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Favorites() {
  const { favorites, tx } = useApp();
  const list = favorites.map((id) => hotelById[id]).filter(Boolean);
  return (
    <div className="container section">
      <h1>{tx('المفضلة', 'Saved stays')}</h1>
      {list.length === 0 ? (
        <Empty icon={Heart} title={tx('لم تحفظ أي فندق بعد', 'Nothing saved yet')}>
          <p>{tx('اضغط على القلب في أي فندق ليظهر هنا.', 'Tap the heart on any hotel to keep it here.')}</p>
          <Link className="btn btn-brand" to="/search">{tx('تصفّح الفنادق', 'Browse hotels')}</Link>
        </Empty>
      ) : <div className="tiles">{list.map((h) => <HotelTile key={h.id} h={h} />)}</div>}
    </div>
  );
}

export function Login() {
  const { tx, login, user } = useApp();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  const submit = (e) => {
    e.preventDefault();
    if (mode === 'register' && f.name.trim().length < 2) return setErr(tx('اكتب اسمك الكامل', 'Enter your full name'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return setErr(tx('بريد إلكتروني غير صحيح', 'Invalid email address'));
    if (f.password.length < 8) return setErr(tx('كلمة المرور 8 أحرف على الأقل', 'Password must be at least 8 characters'));
    // تجريبي: لا تُحفظ كلمة المرور إطلاقاً. المصادقة الحقيقية تتم في الخادم (JWT + httpOnly cookies)
    login({ name: f.name.trim() || f.email.split('@')[0], email: f.email.trim(), role: 'customer' });
    nav(-1);
  };
  return (
    <div className="container section auth">
      <form className="card pad" onSubmit={submit} noValidate>
        <h1>{mode === 'login' ? tx('تسجيل الدخول', 'Sign in') : tx('إنشاء حساب', 'Create account')}</h1>
        <p className="chip">{tx('نسخة تجريبية: أي بريد وكلمة مرور (8 أحرف) تعمل', 'Demo: any email and 8‑char password works')}</p>
        {mode === 'register' && <label className="field"><span>{tx('الاسم الكامل', 'Full name')}</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" maxLength={60} /></label>}
        <label className="field"><span>{tx('البريد الإلكتروني', 'Email')}</span><input type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" maxLength={120} /></label>
        <label className="field"><span>{tx('كلمة المرور', 'Password')}</span><input type="password" dir="ltr" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} maxLength={128} /></label>
        {err && <p className="err-text" role="alert">{err}</p>}
        <button className="btn btn-brand block lg">{mode === 'login' ? tx('دخول', 'Sign in') : tx('إنشاء الحساب', 'Create account')}</button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? tx('ليس لديك حساب؟ أنشئ حساباً', 'No account? Create one') : tx('لديك حساب؟ سجّل الدخول', 'Have an account? Sign in')}
        </button>
        <hr />
        <button type="button" className="btn btn-ghost block" onClick={() => { login({ name: tx('مدير النظام', 'Admin'), email: 'admin@nuzul.test', role: 'admin' }); nav('/admin'); }}>
          {tx('دخول تجريبي كمدير (لوحة التحكم)', 'Demo sign‑in as admin (dashboard)')}
        </button>
      </form>
    </div>
  );
}

export function NotFound() {
  const { tx } = useApp();
  return (
    <div className="container section">
      <Empty icon={Compass} title={tx('الصفحة غير موجودة', 'Page not found')}>
        <Link className="btn btn-brand" to="/">{tx('العودة للرئيسية', 'Back to home')}</Link>
      </Empty>
    </div>
  );
}
