import { Link } from 'react-router-dom';
import { BadgePercent, Headset, ShieldCheck, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { DESTINATIONS, HOTELS, PROPERTY_TYPES } from '../data/catalog.js';
import SearchBox from '../components/SearchBox.jsx';
import { HotelTile } from '../components/HotelCard.jsx';
import { Img } from '../components/ui.jsx';

const TYPE_IMG = {
  hotel: '1542314831-068cd1dbfeeb', resort: '1573843981267-be1999ff37cd', apartment: '1522708323590-d24dbb6b0267',
  villa: '1564501049412-61c2a3083791', hostel: '1595576508898-0ad5c879a061',
};

export default function Home() {
  const { tx, lang, admin } = useApp();
  const live = HOTELS.filter((h) => admin.hotel[h.id]?.active !== false);
  const count = (id) => live.filter((h) => h.destId === id).length;
  const featured = live.filter((h) => admin.hotel[h.id]?.featured ?? h.featured).sort((a, b) => b.rating - a.rating).slice(0, 8);
  const deals = live.filter((h) => h.deal >= 15).sort((a, b) => b.deal - a.deal).slice(0, 4);

  return (
    <>
      <section className="hero">
        <Img id="1571896349842-33c89424de2d" w={1800} className="hero-bg" eager alt="" />
        <div className="container hero-in">
          <p className="eyebrow">{tx('أكثر من 150 فندقاً في 15 وجهة', '150+ stays across 15 destinations')}</p>
          <h1>{tx('رحلتك تبدأ من إقامة تليق بك', 'Your trip starts with the right stay')}</h1>
          <p className="hero-sub">{tx('قارن الأسعار واحجز فنادق حول العالم في ثوانٍ — بالعربية أولاً، وبعملتك.', 'Compare rates and book hotels worldwide in seconds — Arabic first, in your currency.')}</p>
          <SearchBox />
        </div>
      </section>

      <section className="container section">
        <div className="trust">
          <div><BadgePercent /><b>{tx('أسعار منافسة', 'Competitive rates')}</b><span>{tx('أسعار مباشرة من مورّدين عالميين', 'Wholesale rates from global suppliers')}</span></div>
          <div><ShieldCheck /><b>{tx('دفع آمن', 'Secure payment')}</b><span>{tx('مدى، فيزا، كي‑نت وApple Pay', 'mada, Visa, KNET & Apple Pay')}</span></div>
          <div><Zap /><b>{tx('تأكيد فوري', 'Instant confirmation')}</b><span>{tx('قسيمة الحجز تصلك مباشرة', 'Your voucher arrives right away')}</span></div>
          <div><Headset /><b>{tx('دعم عربي', 'Arabic support')}</b><span>{tx('فريق يتحدث لغتك طوال الأسبوع', 'A team that speaks your language')}</span></div>
        </div>
      </section>

      <section className="container section">
        <header className="section-head">
          <h2>{tx('وجهات يحبّها المسافرون', 'Destinations travellers love')}</h2>
          <Link to="/search">{tx('كل الفنادق', 'All hotels')}</Link>
        </header>
        <div className="dest-grid">
          {DESTINATIONS.slice(0, 9).map((d, i) => (
            <Link key={d.id} to={`/search?dest=${d.id}`} className={`dest ${i < 2 ? 'big' : ''}`}>
              <Img id={d.image} w={i < 2 ? 900 : 600} alt={d[lang]} />
              <div><h3>{d[lang]}</h3><span>{lang === 'ar' ? d.cAr : d.cEn} · {count(d.id)} {tx('مكان إقامة', 'stays')}</span></div>
            </Link>
          ))}
        </div>
        <div className="dest-chips">
          {DESTINATIONS.slice(9).map((d) => <Link key={d.id} className="chip link" to={`/search?dest=${d.id}`}>{d[lang]}</Link>)}
        </div>
      </section>

      {deals.length > 0 && (
        <section className="section band">
          <div className="container">
            <header className="section-head"><h2>{tx('عروض لفترة محدودة', 'Limited‑time deals')}</h2></header>
            <div className="tiles">{deals.map((h) => <HotelTile key={h.id} h={h} />)}</div>
          </div>
        </section>
      )}

      <section className="container section">
        <header className="section-head"><h2>{tx('تصفّح حسب نوع الإقامة', 'Browse by property type')}</h2></header>
        <div className="types">
          {PROPERTY_TYPES.map((t) => (
            <Link key={t.id} to={`/search?types=${t.id}`} className="type">
              <Img id={TYPE_IMG[t.id]} w={500} alt="" />
              <b>{lang === 'ar' ? t.arPl : t.enPl}</b>
              <span>{live.filter((h) => h.type === t.id).length} {tx('خيار', 'options')}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <header className="section-head"><h2>{tx('الأعلى تقييماً من الضيوف', 'Top rated by guests')}</h2></header>
        <div className="tiles">{featured.map((h) => <HotelTile key={h.id} h={h} />)}</div>
      </section>
    </>
  );
}
