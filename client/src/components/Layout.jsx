import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Globe, Heart, LayoutDashboard, LogOut, Menu, ShieldCheck, Ticket, User, X } from 'lucide-react';
import { CURRENCIES, useApp } from '../context/AppContext.jsx';

export const BRAND = { ar: 'نُزُل', en: 'Nuzul' };

export function Logo() {
  const { L } = useApp();
  return (
    <Link to="/" className="logo" aria-label={L(BRAND)}>
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path d="M8 23V13a8 8 0 0 1 16 0v10h-4v-6h-8v6z" fill="var(--brand-dark)" />
      </svg>
      <span>{L(BRAND)}</span>
    </Link>
  );
}

function Header() {
  const { tx, lang, setLang, currency, setCurrency, user, logout, favorites } = useApp();
  const [menu, setMenu] = useState(false);
  const loc = useLocation();
  useEffect(() => { setMenu(false); }, [loc]);
  return (
    <header className="header">
      <div className="container header-in">
        <Logo />
        <nav className={`nav ${menu ? 'open' : ''}`}>
          <NavLink to="/" end>{tx('الرئيسية', 'Home')}</NavLink>
          <NavLink to="/search">{tx('الفنادق', 'Hotels')}</NavLink>
          <NavLink to="/bookings"><Ticket size={16} />{tx('حجوزاتي', 'My bookings')}</NavLink>
          <NavLink to="/favorites"><Heart size={16} />{tx('المفضلة', 'Saved')}{favorites.length > 0 && <i className="dot">{favorites.length}</i>}</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin"><LayoutDashboard size={16} />{tx('لوحة التحكم', 'Dashboard')}</NavLink>}
        </nav>
        <div className="header-tools">
          <select className="pill-select" value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={tx('العملة', 'Currency')}>
            {Object.entries(CURRENCIES).map(([c, v]) => <option key={c} value={c} title={v[lang]}>{c}</option>)}
          </select>
          <button className="pill" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} aria-label="Language">
            <Globe size={16} />{lang === 'ar' ? 'English' : 'العربية'}
          </button>
          {user ? (
            <button className="pill" onClick={logout} title={tx('تسجيل الخروج', 'Sign out')}>
              <User size={16} /><span className="hide-sm">{user.name.split(' ')[0]}</span><LogOut size={15} />
            </button>
          ) : (
            <Link className="btn btn-accent btn-sm" to="/login">{tx('دخول', 'Sign in')}</Link>
          )}
          <button className="pill menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { tx, L } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>{tx('منصة حجز فنادق عربية بمعايير عالمية. أسعار منافسة، دفع آمن، ودعم بلغتك.', 'An Arabic‑first hotel booking platform built to global standards. Competitive rates, secure payments and support in your language.')}</p>
        </div>
        <div>
          <h4>{tx('استكشف', 'Explore')}</h4>
          <Link to="/search?dest=dubai">{tx('فنادق دبي', 'Dubai hotels')}</Link>
          <Link to="/search?dest=madinah">{tx('فنادق المدينة المنورة', 'Madinah hotels')}</Link>
          <Link to="/search?dest=istanbul">{tx('فنادق إسطنبول', 'Istanbul hotels')}</Link>
          <Link to="/search?dest=maldives">{tx('منتجعات المالديف', 'Maldives resorts')}</Link>
        </div>
        <div>
          <h4>{tx('حسابي', 'Account')}</h4>
          <Link to="/bookings">{tx('حجوزاتي', 'My bookings')}</Link>
          <Link to="/favorites">{tx('المفضلة', 'Saved')}</Link>
          <Link to="/login">{tx('تسجيل الدخول', 'Sign in')}</Link>
        </div>
        <div>
          <h4>{tx('الدفع والأمان', 'Payments & security')}</h4>
          <p className="pay-row"><span>mada</span><span>VISA</span><span>Mastercard</span><span>KNET</span><span>Apple Pay</span></p>
          <p className="secure"><ShieldCheck size={16} />{tx('دفع مشفّر عبر بوابة معتمدة', 'Encrypted payments via a certified gateway')}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        © {new Date().getFullYear()} {L(BRAND)} · {tx('نسخة تجريبية ببيانات وهمية', 'Demo build with sample data')}
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Header />
      <main id="main"><Outlet /></main>
      <Footer />
    </>
  );
}
