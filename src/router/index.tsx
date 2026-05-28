import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/pages/admin/AdminLayout";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ProductListPage = lazy(() => import("@/pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PaymentUploadProofPage = lazy(
  () => import("@/pages/PaymentUploadProofPage"),
);
const VnpayPage = lazy(() => import("@/pages/payment/VnpayPage"));
const VnpayReturnPage = lazy(() => import("@/pages/payment/VnpayReturnPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const SupportDashboard = lazy(() => import("@/pages/support/SupportDashboard"));
const RewardsOverviewPage = lazy(
  () => import("@/pages/rewards/RewardsOverviewPage"),
);
const LuckyWheelPage = lazy(() => import("@/pages/rewards/LuckyWheelPage"));
const RewardShopPage = lazy(() => import("@/pages/rewards/RewardShopPage"));
const RewardHistoryPage = lazy(
  () => import("@/pages/rewards/RewardHistoryPage"),
);

const AccountLayout = lazy(() => import("@/pages/account/AccountLayout"));
const AccountProfilePage = lazy(() => import("@/pages/account/ProfilePage"));
const AccountAddressesPage = lazy(
  () => import("@/pages/account/AddressesPage"),
);
const AccountWishlistPage = lazy(() => import("@/pages/account/WishlistPage"));
const AccountOrdersPage = lazy(() => import("@/pages/account/OrdersPage"));
const AccountShippingOrdersPage = lazy(
  () => import("@/pages/account/ShippingOrdersPage"),
);
const AccountOrderDetailPage = lazy(
  () => import("@/pages/account/OrderDetailPage"),
);
const AccountSecurityPage = lazy(() => import("@/pages/account/SecurityPage"));
const AccountCouponsPage = lazy(() => import("@/pages/account/CouponsPage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProductForm = lazy(() => import("@/pages/admin/AdminProductForm"));
const AdminCategoryPage = lazy(() => import("@/pages/admin/AdminCategoryPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/AdminOrdersPage"));
const AdminPendingOrdersPage = lazy(
  () => import("@/pages/admin/AdminPendingOrdersPage"),
);
const AdminBankingPaymentsPage = lazy(
  () => import("@/pages/admin/AdminBankingPaymentsPage"),
);
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCouponsPage = lazy(() => import("@/pages/admin/AdminCouponsPage"));
const AdminReviewsPage = lazy(() => import("@/pages/admin/AdminReviewsPage"));
const AdminRewardPoolPage = lazy(
  () => import("@/pages/admin/AdminRewardPoolPage"),
);
const AdminRewardShopPage = lazy(
  () => import("@/pages/admin/AdminRewardShopPage"),
);
const RevenueStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/RevenueStatisticsPage"),
);
const OrderStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/OrderStatisticsPage"),
);
const ProductStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/ProductStatisticsPage"),
);
const CouponStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/CouponStatisticsPage"),
);
const UserStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/UserStatisticsPage"),
);
const PaymentStatisticsPage = lazy(
  () => import("@/pages/admin/statistics/PaymentStatisticsPage"),
);

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("accessToken");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const raw = localStorage.getItem("authUser");
  const user = raw ? JSON.parse(raw) : null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RequireSupport({ children }: { children: React.ReactNode }) {
  const raw = localStorage.getItem("authUser");
  const user = raw ? JSON.parse(raw) : null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "support" && user.role !== "admin")
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <S>
            <HomePage />
          </S>
        ),
      },
      {
        path: "products",
        element: (
          <S>
            <ProductListPage />
          </S>
        ),
      },
      {
        path: "search",
        element: (
          <S>
            <ProductListPage />
          </S>
        ),
      },
      {
        path: "products/:id",
        element: (
          <S>
            <ProductDetailPage />
          </S>
        ),
      },
      {
        path: "cart",
        element: (
          <S>
            <CartPage />
          </S>
        ),
      },
      {
        path: "wishlist",
        element: (
          <S>
            <WishlistPage />
          </S>
        ),
      },
      {
        path: "checkout",
        element: (
          <RequireAuth>
            <S>
              <CheckoutPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "payment/upload-proof/:orderId",
        element: (
          <RequireAuth>
            <S>
              <PaymentUploadProofPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "payment/vnpay",
        element: (
          <RequireAuth>
            <S>
              <VnpayPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "payment/vnpay-return",
        element: (
          <RequireAuth>
            <S>
              <VnpayReturnPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "rewards",
        element: (
          <RequireAuth>
            <S>
              <RewardsOverviewPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "rewards/wheel",
        element: (
          <RequireAuth>
            <S>
              <LuckyWheelPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "rewards/shop",
        element: (
          <RequireAuth>
            <S>
              <RewardShopPage />
            </S>
          </RequireAuth>
        ),
      },
      {
        path: "rewards/history",
        element: (
          <RequireAuth>
            <S>
              <RewardHistoryPage />
            </S>
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: (
      <S>
        <LoginPage />
      </S>
    ),
  },
  {
    path: "/register",
    element: (
      <S>
        <RegisterPage />
      </S>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <S>
        <ForgotPasswordPage />
      </S>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <S>
        <ResetPasswordPage />
      </S>
    ),
  },
  { path: "/account", element: <Navigate to="/my-account" replace /> },
  {
    path: "/my-account",
    element: (
      <RequireAuth>
        <S>
          <AccountLayout />
        </S>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/my-account/profile" replace /> },
      {
        path: "profile",
        element: (
          <S>
            <AccountProfilePage />
          </S>
        ),
      },
      {
        path: "addresses",
        element: (
          <S>
            <AccountAddressesPage />
          </S>
        ),
      },
      {
        path: "wishlist",
        element: (
          <S>
            <AccountWishlistPage />
          </S>
        ),
      },
      {
        path: "orders",
        element: (
          <S>
            <AccountOrdersPage />
          </S>
        ),
      },
      {
        path: "orders/shipping",
        element: (
          <S>
            <AccountShippingOrdersPage />
          </S>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <S>
            <AccountOrderDetailPage />
          </S>
        ),
      },
      {
        path: "security",
        element: (
          <S>
            <AccountSecurityPage />
          </S>
        ),
      },
      {
        path: "coupons",
        element: (
          <S>
            <AccountCouponsPage />
          </S>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      {
        index: true,
        element: (
          <S>
            <AdminDashboard />
          </S>
        ),
      },
      {
        path: "dashboard",
        element: (
          <S>
            <AdminDashboard />
          </S>
        ),
      },
      {
        path: "categories",
        element: (
          <S>
            <AdminCategoryPage />
          </S>
        ),
      },
      {
        path: "products",
        element: <Navigate to="/admin/categories" replace />,
      },
      {
        path: "products/new",
        element: (
          <S>
            <AdminProductForm />
          </S>
        ),
      },
      {
        path: "products/:id/edit",
        element: (
          <S>
            <AdminProductForm />
          </S>
        ),
      },
      {
        path: "orders",
        element: (
          <S>
            <AdminOrdersPage />
          </S>
        ),
      },
      {
        path: "orders/pending",
        element: (
          <S>
            <AdminPendingOrdersPage />
          </S>
        ),
      },
      {
        path: "payments/banking",
        element: (
          <S>
            <AdminBankingPaymentsPage />
          </S>
        ),
      },
      {
        path: "users",
        element: (
          <S>
            <AdminUsersPage />
          </S>
        ),
      },
      {
        path: "coupons",
        element: (
          <S>
            <AdminCouponsPage />
          </S>
        ),
      },
      {
        path: "reviews",
        element: (
          <S>
            <AdminReviewsPage />
          </S>
        ),
      },
      {
        path: "rewards/pool",
        element: (
          <S>
            <AdminRewardPoolPage />
          </S>
        ),
      },
      {
        path: "rewards/shop",
        element: (
          <S>
            <AdminRewardShopPage />
          </S>
        ),
      },
      {
        path: "statistics/revenue",
        element: (
          <S>
            <RevenueStatisticsPage />
          </S>
        ),
      },
      {
        path: "statistics/orders",
        element: (
          <S>
            <OrderStatisticsPage />
          </S>
        ),
      },
      {
        path: "statistics/products",
        element: (
          <S>
            <ProductStatisticsPage />
          </S>
        ),
      },
      {
        path: "statistics/coupons",
        element: (
          <S>
            <CouponStatisticsPage />
          </S>
        ),
      },
      {
        path: "statistics/users",
        element: (
          <S>
            <UserStatisticsPage />
          </S>
        ),
      },
      {
        path: "statistics/payments",
        element: (
          <S>
            <PaymentStatisticsPage />
          </S>
        ),
      },
    ],
  },
  {
    path: "/support",
    element: (
      <RequireSupport>
        <S>
          <SupportDashboard />
        </S>
      </RequireSupport>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/support/messagesmanagement" replace />,
      },
      {
        path: "messagesmanagement",
        element: (
          <S>
            <SupportDashboard />
          </S>
        ),
      },
      {
        path: "appointmentsmanagement",
        element: (
          <S>
            <SupportDashboard />
          </S>
        ),
      },
      {
        path: "schedulesmanagement",
        element: (
          <S>
            <SupportDashboard />
          </S>
        ),
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);