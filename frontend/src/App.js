import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import FloatingChatbot from "./components/common/FloatingChatbot";

// Pages
import Home from "./pages/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import VerifyOtp from "./components/auth/VerifyOtp";
import VerifyEmailLink from "./components/auth/VerifyEmailLink";
import ForgetPassword from "./components/auth/ForgotPassword";
import "./styles/components.css";
import SellerPannel from "./pages/SellerPannel";
import AdminPannel from "./pages/AdminPanel";
import "./styles/admin.css";
import "./components/admin/CategoryManagement.css";
import ListYourProduct from "./components/vendor/ListYourProduct";
import VerifySeller from "./pages/VerifySeller";
import ProductDetails from "./pages/ProductDetails";
import Chat from "./pages/Chat";
import SellerProfile from "./pages/SellerProfile";
import UserProfile from "./pages/UserProfile";
import Browse from "./pages/Browse";
import Wishlist from "./pages/Wishlist";
import Support from "./pages/Support";
import HelpCenter from "./pages/HelpCenter";
import SafetyTips from "./pages/SafetyTips";
import FAQs from "./pages/FAQs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiesPolicy from "./pages/CookiesPolicy";
import { LogoProvider } from "./context/LogoContext";
import { SocketProvider } from "./context/SocketContext";
import AdminRoute from "./components/common/AdminRoute";
import BoostPaymentSuccess from "./pages/BoostPaymentSuccess";
import BoostKhaltiReturn from "./pages/BoostKhaltiReturn";


function NotFound() {
  return (
    <div className="container py-4">
      <h3>404 — Page Not Found</h3>
    </div>
  );
}

/* 👇 Layout wrapper */
function Layout() {
  const location = useLocation();

  const hideNavbarRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-otp",
    "/verify-email",
    "/verify-success",
    "/admin",
    "/seller",
  ];

  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgetPassword />} />
          <Route path="/verify-email" element={<VerifyEmailLink />} />
          <Route path="/seller" element={< SellerPannel />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPannel />
            </AdminRoute>
          } />
          <Route path="/list-your-product" element={<ListYourProduct />} />
          <Route path="/verify-seller" element={<VerifySeller />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/category/:category" element={<Browse />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/support" element={<Support />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/safety" element={<SafetyTips />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookies" element={<CookiesPolicy />} />
          <Route path="/boost-payment/success" element={<BoostPaymentSuccess />} />
          <Route path="/boost-payment/khalti-return" element={<BoostKhaltiReturn />} />

          <Route
            path="/verify-success"
            element={
              <div className="auth-page">
                <div className="auth-card">
                  <h2>Verified</h2>
                  <p className="form-success">
                    Your email has been verified. You can now login.
                  </p>
                </div>
              </div>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideNavbar && location.pathname === "/" && <Footer />}
      {!hideNavbar && <FloatingChatbot />}
    </>
  );
}


export default function App() {
  return (
    <LogoProvider>
      <SocketProvider>
        <Router>
          <Layout />
        </Router>
      </SocketProvider>
    </LogoProvider>
  );
}
