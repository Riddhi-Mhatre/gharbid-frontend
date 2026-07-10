import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { PrivateRoute } from './components/common/PrivateRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';

import { lazy, Suspense, useState, useEffect } from 'react';

// Scrolls window to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

import { Loader } from './components/common/Loader';
import { SplashScreen } from './components/common/SplashScreen';
import { useSilentRefresh } from './hooks/useSilentRefresh';

// ─── Public / Shared Pages ──────────────────────────────────────────────────
const LandingPage              = lazy(() => import('./pages/LandingPage'));
const LoginPage                = lazy(() => import('./pages/LoginPage'));
const RegisterPage             = lazy(() => import('./pages/RegisterPage'));
const VerifyPage               = lazy(() => import('./pages/VerifyPage'));
const PropertyListPage         = lazy(() => import('./pages/PropertyListPage'));
const PropertyDetailPage       = lazy(() => import('./pages/PropertyDetailPage'));
const AuctionsListPage         = lazy(() => import('./pages/AuctionsListPage'));
const AuctionRoomPage          = lazy(() => import('./pages/AuctionRoomPage'));
const ChatPage                 = lazy(() => import('./pages/ChatPage'));
const ProfilePage              = lazy(() => import('./pages/ProfilePage'));

// ─── Buyer Feature Pages ────────────────────────────────────────────────────
const BuyerDashboard          = lazy(() => import('./features/buyer/pages/BuyerDashboard'));
const BuyerAuctionsPage       = lazy(() => import('./features/buyer/pages/BuyerAuctionsPage'));
const BuyerBidsPage           = lazy(() => import('./features/buyer/pages/BuyerBidsPage'));
const BuyerSavedPage          = lazy(() => import('./features/buyer/pages/BuyerSavedPage'));
const BuyerLegalDocumentsPage = lazy(() => import('./features/buyer/pages/BuyerLegalDocumentsPage'));
const BuyerPurchasesPage      = lazy(() => import('./features/buyer/pages/BuyerPurchasesPage'));
const BuyerProfilePage        = lazy(() => import('./features/buyer/pages/BuyerProfilePage'));

// ─── Seller Feature Pages ───────────────────────────────────────────────────
const SellerDashboard              = lazy(() => import('./features/seller/pages/SellerDashboard'));
const AddPropertyPage              = lazy(() => import('./features/seller/pages/AddPropertyPage'));
const MyPropertiesPage             = lazy(() => import('./features/seller/pages/MyPropertiesPage'));
const SellerSoldPropertiesPage     = lazy(() => import('./features/seller/pages/SellerSoldPropertiesPage'));
const PaymentsPage                 = lazy(() => import('./features/seller/pages/PaymentsPage'));
const DocumentUploadPage           = lazy(() => import('./features/seller/pages/DocumentUploadPage'));
const SellerAuctionDashboard       = lazy(() => import('./features/seller/pages/SellerAuctionDashboard'));
const SellerAuctionManagementPage  = lazy(() => import('./features/seller/pages/SellerAuctionManagementPage'));
const SellerIdentityDocsPage       = lazy(() => import('./features/seller/pages/SellerIdentityDocsPage'));
const SellerProfilePage            = lazy(() => import('./features/seller/pages/SellerProfilePage'));

import { BuyerLayout } from './components/layout/BuyerLayout';
import { SellerLayout } from './components/layout/SellerLayout';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  // Proactively keeps the session token alive
  useSilentRefresh();

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <div className="min-h-screen flex flex-col">
        <ScrollToTop />
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* ── Public (no auth required) ── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/properties" element={<PropertyListPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/auctions" element={<AuctionsListPage />} />
              <Route path="/auctions/:id" element={<AuctionRoomPage />} />

              {/* ── Auth pages – redirect to dashboard if already logged in ── */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* ── Protected – Buyer ── */}
              <Route element={<PrivateRoute allowedRoles={['buyer']} />}>
                <Route element={<BuyerLayout />}>
                  <Route path="/buyer/dashboard"       element={<BuyerDashboard />} />
                  <Route path="/buyer/auctions"        element={<BuyerAuctionsPage />} />
                  <Route path="/buyer/bids"            element={<BuyerBidsPage />} />
                  <Route path="/buyer/saved"           element={<BuyerSavedPage />} />
                  <Route path="/buyer/legal-documents" element={<BuyerLegalDocumentsPage />} />
                  <Route path="/buyer/properties"      element={<PropertyListPage />} />
                  <Route path="/buyer/properties/:id"  element={<PropertyDetailPage />} />
                  <Route path="/buyer/chat"            element={<ChatPage />} />
                  <Route path="/buyer/purchases"       element={<BuyerPurchasesPage />} />
                  <Route path="/buyer/profile"         element={<BuyerProfilePage />} />
                </Route>
              </Route>

              {/* ── Protected – Seller ── */}
              <Route element={<PrivateRoute allowedRoles={['seller']} />}>
                <Route element={<SellerLayout />}>
                  <Route path="/seller"                  element={<SellerDashboard />} />
                  <Route path="/seller/dashboard"        element={<SellerDashboard />} />
                  <Route path="/seller/add-property"     element={<AddPropertyPage />} />
                  <Route path="/seller/my-properties"    element={<MyPropertiesPage />} />
                  <Route path="/seller/sold-properties"  element={<SellerSoldPropertiesPage />} />
                  <Route path="/seller/chat"             element={<ChatPage />} />
                  <Route path="/seller/auctions"         element={<SellerAuctionDashboard />} />
                  <Route path="/seller/auctions/:id"     element={<SellerAuctionManagementPage />} />
                  <Route path="/seller/payments"         element={<PaymentsPage />} />
                  <Route path="/seller/documents"        element={<DocumentUploadPage />} />
                  <Route path="/seller/identity-documents" element={<SellerIdentityDocsPage />} />
                  <Route path="/seller/profile"          element={<SellerProfilePage />} />
                </Route>
              </Route>

              {/* ── Protected – All authenticated ── */}
              <Route element={<PrivateRoute allowedRoles={['buyer', 'seller']} />}>
                <Route path="/chat"    element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <MobileNav />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{ style: { background: '#0A0A0A', border: '1px solid #1A1A1A', color: '#fff' } }}
        />
      </div>
    </BrowserRouter>
  );
}
