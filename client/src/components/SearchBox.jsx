import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, MapPin, Search, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../api/index.js';
import { destById } from '../data/catalog.js';
import { addDays, fromISO, safeDates, toISO, todayISO } from '../lib/search.js';
import { Stepper } from './ui.jsx';

function useOutside(ref, onClose) {
  useEffect(() => {
    const down = (e) => e.target.isConnected && ref.current && !ref.current.contains(e.target) && onClose();
    const key = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [ref, onClose]);
}

function Month({ year, month, from, to, hover, onPick, onHover, locale }) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayISO();
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(first);
  const names = useMemo(() => Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2023, 0, 1 + i))), [locale]);
  const end = to || (from && hover && hover > from ? hover : null);
  return (
    <div className="cal-month">
      <div className="cal-title">{title}</div>
      <div className="cal-grid">
        {names.map((n, i) => <span key={i} className="cal-dow">{n}</span>)}
        {Array.from({ length: first.getDay() }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => {
          const iso = toISO(new Date(year, month, i + 1));
          const cls = ['cal-day'];
          if (iso === from) cls.push('sel', 'start');
          if (iso === end) cls.push('sel', 'end');
          if (from && end && iso > from && iso < end) cls.push('in');
          if (iso === today) cls.push('today');
          return (
            <button key={iso} type="button" className={cls.join(' ')} disabled={iso < today}
              onClick={() => onPick(iso)} onMouseEnter={() => onHover(iso)}>{i + 1}</button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRange({ from, to, onChange, onDone }) {
  const { locale, tx } = useApp();
  const [view, setView] = useState(() => { const d = fromISO(from); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [draft, setDraft] = useState({ from, to });
  const [hover, setHover] = useState(null);
  const now = new Date();
  const canPrev = view.y > now.getFullYear() || view.m > now.getMonth();
  const shift = (n) => setView((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const pick = (iso) => {
    if (!draft.from || draft.to || iso <= draft.from) { setDraft({ from: iso, to: null }); return; }
    const next = { from: draft.from, to: iso };
    setDraft(next); onChange(next); onDone?.();
  };
  const second = new Date(view.y, view.m + 1, 1);
  return (
    <div className="cal" onMouseLeave={() => setHover(null)}>
      <div className="cal-nav">
        <button type="button" disabled={!canPrev} onClick={() => shift(-1)} aria-label={tx('الشهر السابق', 'Previous month')}><ChevronRight size={18} className="flip" /></button>
        <span>{draft.to ? tx('اختر تاريخ الوصول', 'Select check‑in') : tx('اختر تاريخ المغادرة', 'Select check‑out')}</span>
        <button type="button" onClick={() => shift(1)} aria-label={tx('الشهر التالي', 'Next month')}><ChevronLeft size={18} className="flip" /></button>
      </div>
      <div className="cal-months">
        <Month year={view.y} month={view.m} {...draft} hover={hover} onPick={pick} onHover={setHover} locale={locale} />
        <Month year={second.getFullYear()} month={second.getMonth()} {...draft} hover={hover} onPick={pick} onHover={setHover} locale={locale} />
      </div>
    </div>
  );
}

export default function SearchBox({ initial = {}, compact = false }) {
  const { tx, L, lang, fmtDate } = useApp();
  const nav = useNavigate();
  const dates = safeDates(initial.in, initial.out);
  const initDest = initial.dest ? destById[initial.dest] : null;

  const [text, setText] = useState(initDest ? initDest[lang] : initial.q || '');
  const [dest, setDest] = useState(initDest?.id || '');
  const [range, setRange] = useState({ from: dates.checkIn, to: dates.checkOut });
  const [g, setG] = useState({ ad: +initial.ad || 2, ch: +initial.ch || 0, rm: +initial.rm || 1 });
  const [open, setOpen] = useState(null); // 'dest' | 'dates' | 'guests'
  const [sug, setSug] = useState({ destinations: [], hotels: [] });
  const [active, setActive] = useState(-1);
  const box = useRef(null);
  useOutside(box, () => setOpen(null));

  useEffect(() => { if (initDest) setText(initDest[lang]); }, [lang]); // eslint-disable-line
  useEffect(() => {
    let live = true;
    api.suggest(dest ? '' : text).then((s) => live && setSug(s));
    setActive(-1);
    return () => { live = false; };
  }, [text, dest]);

  const options = [
    ...sug.destinations.map((d) => ({ kind: 'dest', id: d.id, title: d[lang], sub: lang === 'ar' ? d.cAr : d.cEn })),
    ...sug.hotels.map((h) => ({ kind: 'hotel', id: h.id, title: L(h.name), sub: L(h.district) })),
  ];

  const qs = (extra = {}) => new URLSearchParams({
    in: range.from, out: range.to || addDays(range.from, 1), ad: g.ad, ch: g.ch, rm: g.rm, ...extra,
  }).toString();

  const choose = (o) => {
    if (o.kind === 'hotel') { nav(`/hotel/${o.id}?${qs()}`); setOpen(null); return; }
    setDest(o.id); setText(o.title); setOpen('dates');
  };
  const submit = (e) => {
    e.preventDefault();
    setOpen(null);
    const t = text.trim();
    nav(`/search?${qs(dest ? { dest } : t ? { q: t } : {})}`);
  };
  const onKey = (e) => {
    if (open !== 'dest') return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(options[active]); }
  };

  const guestsLabel = `${g.ad + g.ch} ${tx('ضيوف', 'guests')} · ${g.rm} ${g.rm > 1 ? tx('غرف', 'rooms') : tx('غرفة', 'room')}`;

  return (
    <form className={`searchbox ${compact ? 'compact' : ''}`} onSubmit={submit} ref={box} role="search">
      <div className={`sb-field sb-dest ${open === 'dest' ? 'focus' : ''}`}>
        <MapPin size={20} />
        <label>
          <span>{tx('الوجهة', 'Destination')}</span>
          <input
            value={text} placeholder={tx('مدينة، دولة أو اسم فندق', 'City, country or hotel')}
            onChange={(e) => { setText(e.target.value); setDest(''); setOpen('dest'); }}
            onFocus={(e) => { setOpen('dest'); e.target.select(); }} onKeyDown={onKey}
            autoComplete="off" role="combobox" aria-expanded={open === 'dest'} aria-controls="sb-sug" maxLength={80}
          />
        </label>
        {open === 'dest' && (
          <ul className="pop sug" id="sb-sug" role="listbox">
            {!text.trim() || dest ? <li className="sug-head">{tx('وجهات رائجة', 'Popular destinations')}</li> : null}
            {options.length === 0 && <li className="sug-none">{tx('لا توجد نتائج مطابقة — اضغط بحث للمحاولة', 'No matches — press search to try anyway')}</li>}
            {options.map((o, i) => (
              <li key={o.kind + o.id} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}>
                {o.kind === 'dest' ? <MapPin size={18} /> : <BedDouble size={18} />}
                <span><b>{o.title}</b><small>{o.sub}</small></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`sb-field ${open === 'dates' ? 'focus' : ''}`}>
        <CalendarDays size={20} />
        <button type="button" className="sb-btn" onClick={() => setOpen(open === 'dates' ? null : 'dates')} aria-expanded={open === 'dates'}>
          <span>{tx('الوصول — المغادرة', 'Check‑in — Check‑out')}</span>
          <b>{fmtDate(range.from)} — {range.to ? fmtDate(range.to) : '…'}</b>
        </button>
        {open === 'dates' && (
          <div className="pop pop-cal">
            <DateRange from={range.from} to={range.to} onChange={setRange} onDone={() => setOpen('guests')} />
          </div>
        )}
      </div>

      <div className={`sb-field ${open === 'guests' ? 'focus' : ''}`}>
        <Users size={20} />
        <button type="button" className="sb-btn" onClick={() => setOpen(open === 'guests' ? null : 'guests')} aria-expanded={open === 'guests'}>
          <span>{tx('الضيوف والغرف', 'Guests & rooms')}</span>
          <b>{guestsLabel}</b>
        </button>
        {open === 'guests' && (
          <div className="pop pop-guests">
            <Stepper label={tx('بالغون', 'Adults')} value={g.ad} min={1} max={12} onChange={(v) => setG({ ...g, ad: v, rm: Math.min(g.rm, v) })} />
            <Stepper label={tx('أطفال', 'Children')} hint={tx('حتى 11 سنة', 'Up to 11 years')} value={g.ch} min={0} max={6} onChange={(v) => setG({ ...g, ch: v })} />
            <Stepper label={tx('غرف', 'Rooms')} value={g.rm} min={1} max={Math.min(6, g.ad)} onChange={(v) => setG({ ...g, rm: v })} />
            <button type="button" className="btn btn-ghost block" onClick={() => setOpen(null)}>{tx('تم', 'Done')}</button>
          </div>
        )}
      </div>

      <button className="btn btn-accent sb-submit" type="submit"><Search size={20} /><span>{tx('بحث', 'Search')}</span></button>
    </form>
  );
}
