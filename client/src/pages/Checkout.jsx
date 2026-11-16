import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Lock, SearchX, ShieldCheck, Smartphone, Tag, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import { destById, MEALS } from '../data/catalog.js';
import { addDays, quote, safeDates, todayISO } from '../lib/search.js';
import { Empty, Img, Stars } from '../components/ui.jsx';

// طرق الدفع المتاحة عبر MyFatoorah — عند الربط الفعلي تأتي القائمة من InitiatePayment
export const PAY_METHODS = [
  { id: 'card', ar: 'بطاقة ائتمانية (فيزا / ماستركارد)', en: 'Credit card (Visa / Mastercard)', icon: CreditCard },
  { id: 'mada', ar: 'مدى', en: 'mada', icon: CreditCard },
  { id: 'knet', ar: 'كي‑نت', en: 'KNET', icon: Wallet },
  { id: 'applepay', ar: 'Apple Pay', en: 'Apple Pay', icon: Smartphone },
  { id: 'stcpay', ar: 'STC Pay', en: 'STC Pay', icon: Smartphone },
];

const COUNTRIES = [
  ['SA', 'السعودية', 'Saudi Arabia'], ['EG', 'مصر', 'Egypt'], ['AE', 'الإمارات', 'UAE'], ['KW', 'الكويت', 'Kuwait'],
  ['QA', 'قطر', 'Qatar'], ['BH', 'البحرين', 'Bahrain'], ['OM', 'عُمان', 'Oman'], ['JO', 'الأردن', 'Jordan'],
  ['MA', 'المغرب', 'Morocco'], ['GB', 'المملكة المتحدة', 'United Kingdom'], ['US', 'الولايات المتحدة', 'United States'],
  ['DE', 'ألمانيا', 'Germany'], ['FR', 'فرنسا', 'France'], ['TR', 'تركيا', 'Türkiye'], ['OTHER', 'دولة أخرى', 'Other'],
];

function newRef() {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return `NZ${(a[0].toString(36) + a[1].toString(36)).toUpperCase().slice(0, 8)}`;
}

export default function Checkout() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { tx, L, lang, money, fmtDate, factor, admin, user, addBooking, currency } = useApp();
  const [h, setH] = useState(undefined);
  const [form, setForm] = useState(() => {
    const [first = '', ...rest] = (user?.name || '').split(' ');
    return { first, last: rest.join(' '), email: user?.email || '', phone: '', country: 'SA', notes: '', agree: false };
  });
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState('card');
  const [code, setCode] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [gateway, setGateway] = useState(null); // null | 'open' | 'processing' | 'failed'

  useEffect(() => { api.hotel(sp.get('hotel')).then(setH); }, [sp]);

  if (h === undefined) return <div className="container section"><div className="skel" style={{ height: 420 }} /></div>;
  const room = h?.rooms.find((r) => r.id === sp.get('room'));
  const rate = room?.rates.find((r) => r.id === sp.get('rate'));
  if (!h || !room || !rate) {
    return (
      <div className="container section">
        <Empty icon={SearchX} title={tx('تعذّر العثور على هذا العرض', 'We could not find this offer')}>
          <p>{tx('ربما انتهت صلاحية الرابط. ابحث من جديد لعرض الأسعار الحالية.', 'The link may have expired. Search again to see current rates.')}</p>
          <Link className="btn btn-brand" to="/search">{tx('بحث جديد', 'New search')}</Link>
        </Empty>
      </div>
    );
  }

  const { checkIn, checkOut, nights } = safeDates(sp.get('in'), sp.get('out'));
  const ad = Math.max(1, +sp.get('ad') || 2);
  const ch = Math.max(0, +sp.get('ch') || 0);
  const rm = Math.max(1, +sp.get('rm') || 1);
  const q = quote({ nightly: rate.price, nights, rooms: rm, factor: factor(h), promoPct: promo?.pct || 0 });
  const d = destById[h.destId];
  const cancelBy = addDays(checkIn, -3);
  const refundableNow = rate.refundable && cancelBy >= todayISO();

  const up = (k) => (e) => {
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    if (errors[k]) setErrors(({ [k]: _, ...rest }) => rest);
  };
  const applyPromo = () => {
    const c = code.trim().toUpperCase();
    const found = admin.promos.find((p) => p.code === c && p.active);
    setPromo(found || null);
    setPromoMsg(found ? tx(`تم تطبيق خصم ${found.pct}%`, `${found.pct}% discount applied`) : tx('الكود غير صالح أو منتهي', 'Invalid or expired code'));
  };

  const validate = () => {
    const e = {};
    if (form.first.trim().length < 2) e.first = tx('اكتب الاسم الأول', 'Enter first name');
    if (form.last.trim().length < 2) e.last = tx('اكتب اسم العائلة', 'Enter last name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = tx('بريد إلكتروني غير صحيح، مثال: name@mail.com', 'Invalid email, e.g. name@mail.com');
    if (!/^\+?[0-9\s-]{8,16}$/.test(form.phone)) e.phone = tx('رقم جوال غير صحيح، مثال: ‎+966 5X XXX XXXX', 'Invalid phone, e.g. +966 5X XXX XXXX');
    if (!form.agree) e.agree = tx('يجب الموافقة على الشروط للمتابعة', 'Please accept the terms to continue');
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const submit = (e) => {
    e.preventDefault();
    if (validate()) setGateway('open');
    else document.querySelector('.field.err input, .field.err select')?.focus();
  };
  const pay = (ok) => {
    setGateway('processing');
    setTimeout(() => {
      if (!ok) { setGateway('failed'); return; }
      const ref = newRef();
      addBooking({
        ref, status: 'confirmed', createdAt: new Date().toISOString(),
        hotelId: h.id, roomId: room.id, rateId: rate.id, meal: rate.meal, refundable: rate.refundable,
        checkIn, checkOut, nights, adults: ad, children: ch, rooms: rm,
        guest: { name: `${form.first.trim()} ${form.last.trim()}`, email: form.email.trim(), phone: form.phone.trim(), country: form.country },
        notes: form.notes.trim().slice(0, 300), method, currency, promo: promo?.code || null,
        totalUsd: q.total, netUsd: rate.price * nights * rm,
      });
      nav(`/booking/${ref}`, { replace: true });
    }, 1100);
  };

  const Field = ({ k, label, type = 'text', ...rest }) => (
    <label className={`field ${errors[k] ? 'err' : ''}`}>
      <span>{label}</span>
      <input type={type} value={form[k]} onChange={up(k)} aria-invalid={!!errors[k]} {...rest} />
      {errors[k] && <em role="alert">{errors[k]}</em>}
    </label>
  );

  return (
    <div className="container checkout">
      <ol className="steps"><li className="done">{tx('اختيار الغرفة', 'Your selection')}</li><li className="on">{tx('بياناتك والدفع', 'Details & payment')}</li><li>{tx('التأكيد', 'Confirmation')}</li></ol>
      <div className="checkout-cols">
        <form className="checkout-form" onSubmit={submit} noValidate>
          <section className="card pad">
            <h2>{tx('بيانات النزيل الأساسي', 'Lead guest details')}</h2>
            <div className="grid2">
              {Field({ k: 'first', label: tx('الاسم الأول', 'First name'), autoComplete: 'given-name', maxLength: 40 })}
              {Field({ k: 'last', label: tx('اسم العائلة', 'Last name'), autoComplete: 'family-name', maxLength: 40 })}
              {Field({ k: 'email', label: tx('البريد الإلكتروني', 'Email'), type: 'email', autoComplete: 'email', dir: 'ltr', maxLength: 120 })}
              {Field({ k: 'phone', label: tx('رقم الجوال', 'Mobile number'), type: 'tel', autoComplete: 'tel', dir: 'ltr', placeholder: '+966 5X XXX XXXX', maxLength: 16 })}
              <label className="field">
                <span>{tx('بلد الإقامة', 'Country of residence')}</span>
                <select value={form.country} onChange={up('country')}>{COUNTRIES.map(([c, ar, en]) => <option key={c} value={c}>{lang === 'ar' ? ar : en}</option>)}</select>
              </label>
            </div>
            <label className="field">
              <span>{tx('طلبات خاصة (اختياري)', 'Special requests (optional)')}</span>
              <textarea rows={3} value={form.notes} onChange={up('notes')} maxLength={300} placeholder={tx('مثال: طابق مرتفع، سرير إضافي للطفل…', 'e.g. high floor, baby cot…')} />
            </label>
          </section>

          <section className="card pad">
            <h2>{tx('طريقة الدفع', 'Payment method')}</h2>
            <div className="methods" role="radiogroup">
              {PAY_METHODS.map((m) => (
                <label key={m.id} className={`method ${method === m.id ? 'on' : ''}`}>
                  <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <m.icon size={20} /><span>{L(m)}</span>
                </label>
              ))}
            </div>
            <p className="secure"><Lock size={15} />{tx('لا نخزّن بيانات بطاقتك. سيتم تحويلك إلى صفحة الدفع الآمنة لدى MyFatoorah لإتمام العملية.', 'We never store card data. You will be redirected to the secure MyFatoorah payment page to complete the purchase.')}</p>
          </section>

          <section className="card pad">
            <label className={`f-check agree ${errors.agree ? 'err' : ''}`}>
              <input type="checkbox" checked={form.agree} onChange={up('agree')} />
              <span>{tx('أوافق على شروط الحجز وسياسة الإلغاء الخاصة بهذا السعر.', 'I agree to the booking terms and the cancellation policy for this rate.')}</span>
            </label>
            {errors.agree && <em className="err-text" role="alert">{errors.agree}</em>}
            <button className="btn btn-accent block lg" type="submit"><Lock size={18} />{tx('ادفع', 'Pay')} {money(q.total)}</button>
          </section>
        </form>

        <aside className="summary card">
          <div className="summary-hotel">
            <Img id={h.images[0]} w={300} alt="" />
            <div><Stars n={h.stars} /><b>{L(h.name)}</b><small className="muted">{L(h.district)}، {d[lang]}</small></div>
          </div>
          <dl className="summary-facts">
            <dt>{tx('الوصول', 'Check‑in')}</dt><dd>{fmtDate(checkIn, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            <dt>{tx('المغادرة', 'Check‑out')}</dt><dd>{fmtDate(checkOut, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</dd>
            <dt>{tx('الغرفة', 'Room')}</dt><dd>{rm} × {L(room.name)}</dd>
            <dt>{tx('الوجبات', 'Meals')}</dt><dd>{L(MEALS[rate.meal])}</dd>
            <dt>{tx('الضيوف', 'Guests')}</dt><dd>{ad} {tx('بالغ', 'adults')}{ch > 0 && ` · ${ch} ${tx('طفل', 'children')}`}</dd>
          </dl>
          <p className={refundableNow ? 'ok-text' : 'muted'}>
            {refundableNow ? <><Check size={15} />{tx(`إلغاء مجاني حتى ${fmtDate(cancelBy)}`, `Free cancellation until ${fmtDate(cancelBy)}`)}</> : tx('هذا السعر غير قابل للاسترداد', 'This rate is non‑refundable')}
          </p>
          <div className="promo">
            <Tag size={16} />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={tx('كود الخصم', 'Promo code')} maxLength={20} aria-label={tx('كود الخصم', 'Promo code')}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromo(); } }} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={applyPromo}>{tx('تطبيق', 'Apply')}</button>
          </div>
          {promoMsg && <p className={promo ? 'ok-text' : 'err-text'} role="status">{promoMsg}</p>}
          <dl className="totals">
            <dt>{money(q.perNight)} × {nights} {tx('ليلة', 'nights')} × {rm} {tx('غرفة', 'room')}</dt><dd>{money(q.subtotal)}</dd>
            {q.discount > 0 && <><dt>{tx('خصم', 'Discount')} ({promo.code})</dt><dd className="ok-text">− {money(q.discount)}</dd></>}
            <dt>{tx('ضرائب ورسوم', 'Taxes & fees')}</dt><dd>{money(q.taxes)}</dd>
            <dt className="grand">{tx('الإجمالي', 'Total')}</dt><dd className="grand">{money(q.total)}</dd>
          </dl>
          <p className="secure"><ShieldCheck size={15} />{tx('السعر نهائي ولا توجد رسوم خفية', 'Final price — no hidden fees')}</p>
        </aside>
      </div>

      {gateway && (
        <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="gw-title">
          <div className="modal">
            <span className="chip">{tx('محاكاة — لا يتم خصم أي مبلغ', 'Simulation — no money is charged')}</span>
            <h2 id="gw-title">{tx('بوابة الدفع', 'Payment gateway')}</h2>
            <p className="muted">{L(PAY_METHODS.find((m) => m.id === method))} · <b>{money(q.total)}</b></p>
            {gateway === 'processing' ? (
              <div className="spinner" aria-label={tx('جارٍ المعالجة', 'Processing')} />
            ) : (
              <>
                {gateway === 'failed' && <p className="err-text" role="alert">{tx('لم تتم عملية الدفع ولم يُخصم أي مبلغ. حاول مجدداً أو اختر طريقة أخرى.', 'Payment did not go through and nothing was charged. Try again or pick another method.')}</p>}
                <p>{tx('في النسخة الفعلية ستظهر هنا صفحة MyFatoorah. اختر نتيجة العملية للتجربة:', 'In production the MyFatoorah page appears here. Pick an outcome to test:')}</p>
                <div className="modal-actions">
                  <button className="btn btn-brand" onClick={() => pay(true)}>{tx('عملية ناجحة', 'Successful payment')}</button>
                  <button className="btn btn-ghost" onClick={() => pay(false)}>{tx('عملية مرفوضة', 'Declined payment')}</button>
                  <button className="link-btn" onClick={() => setGateway(null)}>{tx('رجوع', 'Back')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
