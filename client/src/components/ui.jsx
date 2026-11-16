import { useState } from 'react';
import { Star, Heart, ImageOff } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { img } from '../data/catalog.js';

export function Img({ id, w = 800, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`img-fallback ${className}`} role="img" aria-label={alt}><ImageOff size={28} /></div>;
  return (
    <img
      className={className} src={img(id, w)} alt={alt} decoding="async"
      loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)}
    />
  );
}

export function Stars({ n }) {
  return (
    <span className="stars" aria-label={`${n} ★`}>
      {Array.from({ length: n }, (_, i) => <Star key={i} size={13} fill="currentColor" strokeWidth={0} />)}
    </span>
  );
}

export function ratingWord(r, tx) {
  if (r >= 9) return tx('استثنائي', 'Exceptional');
  if (r >= 8.5) return tx('ممتاز', 'Excellent');
  if (r >= 8) return tx('جيد جداً', 'Very good');
  if (r >= 7) return tx('جيد', 'Good');
  return tx('مقبول', 'Pleasant');
}

export function Rating({ value, count, compact }) {
  const { tx, locale } = useApp();
  return (
    <div className="rating">
      <span className="rating-score">{value.toFixed(1)}</span>
      {!compact && (
        <span className="rating-text">
          <b>{ratingWord(value, tx)}</b>
          {count != null && <small>{new Intl.NumberFormat(locale).format(count)} {tx('تقييم', 'reviews')}</small>}
        </span>
      )}
    </div>
  );
}

export function FavButton({ id }) {
  const { favorites, toggleFav, tx } = useApp();
  const on = favorites.includes(id);
  return (
    <button
      type="button" className={`fav ${on ? 'on' : ''}`} aria-pressed={on}
      aria-label={on ? tx('إزالة من المفضلة', 'Remove from saved') : tx('إضافة للمفضلة', 'Save')}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(id); }}
    >
      <Heart size={18} fill={on ? 'currentColor' : 'none'} />
    </button>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={40} strokeWidth={1.4} />}
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export function Stepper({ label, hint, value, min, max, onChange }) {
  return (
    <div className="stepper">
      <div><b>{label}</b>{hint && <small>{hint}</small>}</div>
      <div className="stepper-ctl">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="-">−</button>
        <output>{value}</output>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="+">+</button>
      </div>
    </div>
  );
}
