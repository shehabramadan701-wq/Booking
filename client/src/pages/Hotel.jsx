import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, CalendarDays, Check, ChevronLeft, ChevronRight, Clock, MapPin, Maximize, SearchX, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import { AMENITIES, destById, img, MEALS, PROPERTY_TYPES } from '../data/catalog.js';
import { addDays, quote, safeDates } from '../lib/search.js';
import { DateRange } from '../components/SearchBox.jsx';
import { Empty, FavButton, Img, Rating, Stars, Stepper } from '../components/ui.jsx';

const amById = Object.fromEntries(AMENITIES.map((a) => [a.id, a]));

function Gallery({ images, name }) {
  const [at, setAt] = useState(null);
  const n = images.length;
  useEffect(() => {
    if (at == null) return;
    const key = (e) => {
      if (e.key === 'Escape') setAt(null);
      if (e.key === 'ArrowLeft') setAt((i) => (i + 1) % n);
      if (e.key === 'ArrowRight') setAt((i) => (i - 1 + n) % n);
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [at, n]);
  return (
    <>
      <div className="gallery">
        {images.slice(0, 5).map((id, i) => (
          <button key={i} type="button" className={i === 0 ? 'main' : ''} onClick={() => setAt(i)} aria-label={`${name} ${i + 1}`}>
            <Img id={id} w={i === 0 ? 1200 : 600} alt={`${name} ${i + 1}`} eager />
          </button>
        ))}
      </div>
      {at != null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setAt(null)}>
          <button className="lb-close" aria-label="Close"><X /></button>
          <button className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setAt((at - 1 + n) % n); }} aria-label="Previous"><ChevronRight className="flip" /></button>
          <img src={img(images[at], 1600)} alt={name} onClick={(e) => e.stopPropagation()} />
          <button className="lb-nav next" onClick={(e) => { e.stopPropagation(); setAt((at + 1) % n); }} aria-label="Next"><ChevronLeft className="flip" /></button>
          <span className="lb-count">{at + 1} / {n}</span>
        </div>
      )}
    </>
  );
}

export default function Hotel() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { tx, L, lang, money, fmtDate, factor, admin } = useApp();
  const [h, setH] = useState(undefined);
  const [edit, setEdit] = useState(false);
  const pop = useRef(null);

  useEffect(() => { setH(undefined); api.hotel(id).then(setH); }, [id]);
  useEffect(() => {
    const down = (e) => e.target.isConnected && pop.current && !pop.current.contains(e.target) && setEdit(false);
    document.addEventListener('mousedown', down);
    return () => document.removeEventListener('mousedown', down);
  }, []);

  const { checkIn, checkOut, nights } = safeDates(sp.get('in'), sp.get('out'));
  const ad = Math.max(1, +sp.get('ad') || 2);
  const ch = Math.max(0, +sp.get('ch') || 0);
  const rm = Math.max(1, +sp.get('rm') || 1);
  const perRoom = Math.ceil((ad + ch) / rm);
  const set = (patch) => {
    const next = new URLSearchParams({ in: checkIn, out: checkOut, ad, ch, rm, ...patch });
    setSp(next, { replace: true });
  };

  if (h === undefined) return <div className="container section"><div className="skel" style={{ height: 420 }} /></div>;
  if (!h || admin.hotel[h.id]?.active === false) {
    return (
      <div className="container section">
        <Empty icon={SearchX} title={tx('هذا الفندق غير متاح', 'This property is unavailable')}>
          <Link className="btn btn-brand" to="/search">{tx('تصفّح الفنادق', 'Browse hotels')}</Link>
        </Empty>
      </div>
    );
  }

  const d = destById[h.destId];
  const fx = factor(h);
  const cancelBy = addDays(checkIn, -3);
  const type = PROPERTY_TYPES.find((t) => t.id === h.type);
  const book = (room, rate) => nav(`/checkout?${new URLSearchParams({ hotel: h.id, room: room.id, rate: rate.id, in: checkIn, out: checkOut, ad, ch, rm })}`);
  const from = quote({ nightly: h.minPrice, nights, rooms: rm, factor: fx });

  return (
    <div className="container hotel">
      <nav className="crumbs" aria-label="breadcrumb">
        <Link to="/">{tx('الرئيسية', 'Home')}</Link><span>/</span>
        <Link to={`/search?dest=${d.id}`}>{d[lang]}</Link><span>/</span><b>{L(h.name)}</b>
      </nav>

      <header className="hotel-head">
        <div>
          <div className="row-meta"><Stars n={h.stars} /><span className="chip">{L(type)}</span></div>
          <h1>{L(h.name)}</h1>
          <p className="muted"><MapPin size={16} />{L(h.district)}، {d[lang]}، {lang === 'ar' ? d.cAr : d.cEn} · {h.distanceKm} {tx('كم من المركز', 'km from centre')}</p>
        </div>
        <div className="hotel-head-side">
          <Rating value={h.rating} count={h.reviewsCount} />
          <FavButton id={h.id} />
        </div>
      </header>

      <Gallery images={h.images} name={L(h.name)} />

      <div className="hotel-cols">
        <div>
          <section className="card pad">
            <h2>{tx('عن مكان الإقامة', 'About this property')}</h2>
            <p>{L(h.description)}</p>
            <h3>{tx('أبرز المرافق', 'Top facilities')}</h3>
            <ul className="am-grid">{h.amenities.map((a) => <li key={a}><Check size={16} />{L(amById[a])}</li>)}</ul>
          </section>
        </div>
        <aside className="card pad stay">
          <div className="price big"><small>{tx('يبدأ من', 'From')}</small><b>{money(from.perNight)}</b><small>{tx('/ ليلة', '/ night')}</small></div>
          <div className="stay-edit" ref={pop}>
            <button type="button" className="stay-btn" onClick={() => setEdit(!edit)} aria-expanded={edit}>
              <CalendarDays size={18} />
              <span><small>{tx('إقامتك', 'Your stay')}</small><b>{fmtDate(checkIn)} — {fmtDate(checkOut)} · {nights} {nights > 1 ? tx('ليالٍ', 'nights') : tx('ليلة', 'night')}</b></span>
              <em>{tx('تعديل', 'Edit')}</em>
            </button>
            <p className="muted"><Users size={15} />{ad} {tx('بالغ', 'adults')}{ch > 0 && ` · ${ch} ${tx('طفل', 'children')}`} · {rm} {rm > 1 ? tx('غرف', 'rooms') : tx('غرفة', 'room')}</p>
            {edit && (
              <div className="pop pop-stay">
                <DateRange from={checkIn} to={checkOut} onChange={(r) => set({ in: r.from, out: r.to })} />
                <div className="stay-guests">
                  <Stepper label={tx('بالغون', 'Adults')} value={ad} min={1} max={12} onChange={(v) => set({ ad: v, rm: Math.min(rm, v) })} />
                  <Stepper label={tx('أطفال', 'Children')} value={ch} min={0} max={6} onChange={(v) => set({ ch: v })} />
                  <Stepper label={tx('غرف', 'Rooms')} value={rm} min={1} max={Math.min(6, ad)} onChange={(v) => set({ rm: v })} />
                </div>
              </div>
            )}
          </div>
          <a className="btn btn-accent block" href="#rooms" onClick={(e) => { e.preventDefault(); document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' }); }}>{tx('اختر غرفتك', 'Choose your room')}</a>
          <ul className="perks">
            <li><Clock size={15} />{tx('الدخول', 'Check‑in')} {h.checkIn} · {tx('الخروج', 'Check‑out')} {h.checkOut}</li>
            {h.freeCancel && <li><Check size={15} />{tx('إلغاء مجاني على بعض الأسعار', 'Free cancellation on selected rates')}</li>}
          </ul>
        </aside>
      </div>

      <section id="rooms" className="rooms">
        <h2>{tx('الغرف المتاحة', 'Available rooms')}</h2>
        {h.rooms.map((room) => {
          const fits = room.maxGuests >= perRoom;
          return (
            <article key={room.id} className={`room card ${fits ? '' : 'unfit'}`}>
              <div className="room-info">
                <Img id={room.image} w={480} alt={L(room.name)} />
                <div>
                  <h3>{L(room.name)}</h3>
                  <ul className="room-facts">
                    <li><BedDouble size={15} />{L(room.bed)}</li>
                    <li><Maximize size={15} />{room.size} {tx('م²', 'm²')}</li>
                    <li><Users size={15} />{tx(`حتى ${room.maxGuests} ضيوف`, `Sleeps ${room.maxGuests}`)}</li>
                  </ul>
                  {fits && room.left <= 3 && <p className="warn-text">{tx(`بقي ${room.left} فقط بهذا السعر`, `Only ${room.left} left at this price`)}</p>}
                  {!fits && <p className="warn-text">{tx('لا تكفي لعدد الضيوف في كل غرفة — زِد عدد الغرف', 'Too small for your guests per room — add rooms')}</p>}
                </div>
              </div>
              <ul className="rates">
                {room.rates.map((rate) => {
                  const q = quote({ nightly: rate.price, nights, rooms: rm, factor: fx });
                  return (
                    <li key={rate.id}>
                      <div>
                        <b>{L(MEALS[rate.meal])}</b>
                        {rate.refundable
                          ? <span className="ok-text"><Check size={14} />{tx(`إلغاء مجاني حتى ${fmtDate(cancelBy)}`, `Free cancellation until ${fmtDate(cancelBy)}`)}</span>
                          : <span className="muted">{tx('غير قابل للاسترداد', 'Non‑refundable')}</span>}
                      </div>
                      <div className="rate-price">
                        <b>{money(q.subtotal)}</b>
                        <small>{tx(`+ ${money(q.taxes)} ضرائب ورسوم`, `+ ${money(q.taxes)} taxes & fees`)}</small>
                      </div>
                      <button className="btn btn-brand" disabled={!fits} onClick={() => book(room, rate)}>{tx('احجز الآن', 'Reserve')}</button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="card pad reviews">
        <div className="section-head"><h2>{tx('آراء الضيوف', 'Guest reviews')}</h2><Rating value={h.rating} count={h.reviewsCount} /></div>
        <div className="review-grid">
          {h.reviews.map((r) => (
            <blockquote key={r.id}>
              <header><span className="avatar">{L(r.author)[0]}</span><b>{L(r.author)}</b><small>{r.country}</small><span className="rating-score sm">{r.score.toFixed(1)}</span></header>
              <p>{L(r.text)}</p>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="card pad">
        <h2>{tx('سياسات الإقامة', 'House rules')}</h2>
        <dl className="policies">
          <dt>{tx('تسجيل الدخول', 'Check‑in')}</dt><dd>{tx(`من الساعة ${h.checkIn}`, `From ${h.checkIn}`)}</dd>
          <dt>{tx('تسجيل الخروج', 'Check‑out')}</dt><dd>{tx(`حتى الساعة ${h.checkOut}`, `Until ${h.checkOut}`)}</dd>
          <dt>{tx('الإلغاء', 'Cancellation')}</dt><dd>{tx('تختلف شروط الإلغاء حسب السعر المختار وتظهر قبل الدفع.', 'Cancellation terms vary by rate and are shown before payment.')}</dd>
          <dt>{tx('الأطفال', 'Children')}</dt><dd>{tx('يُرحَّب بالأطفال من جميع الأعمار.', 'Children of all ages are welcome.')}</dd>
        </dl>
      </section>
    </div>
  );
}
