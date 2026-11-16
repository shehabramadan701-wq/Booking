import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';

// تقسيم الكود: كل صفحة تُحمَّل عند الحاجة فقط => تحميل أولي أسرع
const Search = lazy(() => import('./pages/Search.jsx'));
const Hotel = lazy(() => import('./pages/Hotel.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const Admin = lazy(() => import('./admin/Admin.jsx'));
const acc = (name) => lazy(() => import('./pages/Account.jsx').then((m) => ({ default: m[name] })));
const Confirmation = acc('Confirmation');
const Bookings = acc('Bookings');
const Favorites = acc('Favorites');
const Login = acc('Login');
const NotFound = acc('NotFound');

const Loading = () => <div className="container section"><div className="skel" style={{ height: 360 }} /></div>;

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin/*" element={<Admin />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Suspense fallback={<Loading />}><Search /></Suspense>} />
          <Route path="/hotel/:id" element={<Suspense fallback={<Loading />}><Hotel /></Suspense>} />
          <Route path="/checkout" element={<Suspense fallback={<Loading />}><Checkout /></Suspense>} />
          <Route path="/booking/:ref" element={<Suspense fallback={<Loading />}><Confirmation /></Suspense>} />
          <Route path="/bookings" element={<Suspense fallback={<Loading />}><Bookings /></Suspense>} />
          <Route path="/favorites" element={<Suspense fallback={<Loading />}><Favorites /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<Loading />}><Login /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<Loading />}><NotFound /></Suspense>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
