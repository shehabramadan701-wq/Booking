import { Link } from 'react-router-dom';
import { Check, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { AMENITIES, destById, PROPERTY_TYPES } from '../data/catalog.js';
import { FavButton, Img, Rating, Stars } from './ui.jsx';

const amById = Object.fromEntries(AMENITIES.map((a) => [a.id, a]));
const typeById = Object.fromEntries(PROPERTY_TYPES.map((t) => [t.id, t]));

export function useHotelPrice(h, nights = 1, rooms = 1) {
  const { factor } = useApp();
  const perNight = Math.round(h.minPrice * factor(h));
  const total = perNight * nights * rooms;
  const before = h.deal ? Math.round(total / (1 - h.deal / 100)) : null;
  return { perNight, total, before };
}

// بطاقة عمودية (الرئيسية / المفضلة)
export function HotelTile({ h, qs = '' }) {
  const { L, tx, money, lang } = useApp();
  const { perNight } = useHotelPrice(h);
  const d = destById[h.destId];
  return (
    <Link className="tile" to={`/hotel/${h.id}${qs ? `?${qs}` : ''}`}>
      <div className="tile-img">
        <Img id={h.images[0]} w={600} alt={L(h.name)} />
        <FavButton id={h.id} />
        {h.deal > 0 && <span className="badge deal">{tx(`خصم ${h.deal}%`, `${h.deal}% off`)}</span>}
      </div>
      <div className="tile-body">
        <Stars n={h.stars} />
        <h3>{L(h.name)}</h3>
        <p className="muted"><MapPin size={14} />{L(h.district)}، {d[lang]}</p>
        <div className="tile-foot">
          <Rating value={h.rating} compact />
          <div className="price"><small>{tx('يبدأ من', 'From')}</small><b>{money(perNight)}</b><small>{tx('/ ليلة', '/ night')}</small></div>
        </div>
      </div>
    </Link>
  );
}

// بطاقة أفقية (نتائج البحث)
export function HotelRow({ h, qs, nights, rooms }) {
  const { L, tx, money, lang } = useApp();
  const { total, before, perNight } = useHotelPrice(h, nights, rooms);
  const d = destById[h.destId];
  const to = `/hotel/${h.id}?${qs}`;
  return (
    <article className="row-card">
      <Link to={to} className="row-img" tabIndex={-1}>
        <Img id={h.images[0]} w={560} alt={L(h.name)} />
        <FavButton id={h.id} />
        {h.deal > 0 && <span className="badge deal">{tx(`خصم ${h.deal}%`, `${h.deal}% off`)}</span>}
      </Link>
      <div className="row-main">
        <div className="row-top">
          <div>
            <div className="row-meta"><Stars n={h.stars} /><span className="chip">{L(typeById[h.type])}</span></div>
            <h3><Link to={to}>{L(h.name)}</Link></h3>
            <p className="muted"><MapPin size={14} />{L(h.district)}، {d[lang]} · {h.distanceKm} {tx('كم من المركز', 'km from centre')}</p>
          </div>
          <Rating value={h.rating} count={h.reviewsCount} />
        </div>
        <ul className="am-inline">
          {h.amenities.filter((a) => a !== 'ac').slice(0, 4).map((a) => <li key={a}>{L(amById[a])}</li>)}
        </ul>
        <div className="row-bottom">
          <ul className="perks">
            {h.freeCancel && <li><Check size={15} />{tx('إلغاء مجاني متاح', 'Free cancellation available')}</li>}
            {h.breakfast && <li><Check size={15} />{tx('خيار شامل الإفطار', 'Breakfast option')}</li>}
          </ul>
          <div className="row-price">
            <small>{nights} {nights > 1 ? tx('ليالٍ', 'nights') : tx('ليلة', 'night')} · {rooms} {rooms > 1 ? tx('غرف', 'rooms') : tx('غرفة', 'room')}</small>
            {before && <s>{money(before)}</s>}
            <b>{money(total)}</b>
            <small>{money(perNight)} {tx('لليلة · قبل الضرائب', 'per night · before taxes')}</small>
            <Link className="btn btn-brand" to={to}>{tx('عرض الغرف', 'See rooms')}</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
