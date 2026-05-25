import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  ChevronRight,
  UserCircle2,
  Heart,
  Package,
  ShieldCheck,
  Ticket,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  MapPin,
  Truck,
  Gift,
  RotateCcw,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/my-account/profile", label: "Hồ sơ", icon: UserCircle2, end: true },
  { to: "/my-account/addresses", label: "Địa chỉ", icon: MapPin, end: false },
  { to: "/my-account/wishlist", label: "Wishlist", icon: Heart, end: false },
  { to: "/my-account/orders", label: "Order của tôi", icon: Package, end: false },
  { to: "/my-account/orders/shipping", label: "Order đang giao", icon: Truck, end: false },
  { to: "/my-account/coupons", label: "Coupons", icon: Ticket, end: false },
  { to: "/rewards", label: "Phần thưởng của tôi", icon: Gift, end: false },
  { to: "/rewards/wheel", label: "Lucky Wheel", icon: RotateCcw, end: false },
  { to: "/rewards/shop", label: "Cửa hàng đổi thưởng", icon: ShoppingBag, end: false },
  { to: "/rewards/history", label: "Lịch sử quay", icon: Gift, end: false },
  { to: "/my-account/security", label: "Bảo mật", icon: ShieldCheck, end: false },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isActive = user?.isActive !== false;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <Link to="/" onClick={onNavigate} className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-sm font-bold text-white">
            P
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            Paw<span className="text-amber-500">Mart</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-amber-100 ring-2 ring-amber-200 dark:ring-amber-800">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-amber-700">
                {getInitials(user?.fullName ?? "U")}
              </div>
            )}
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900",
                isActive ? "bg-emerald-400" : "bg-gray-400",
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
              )
            }
          >
            <item.icon size={17} />
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={13} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <button
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function AccountLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <nav className="flex items-center gap-1.5 text-sm">
            <Link to="/" className="flex items-center gap-1 text-gray-500 transition-colors hover:text-amber-500 dark:text-gray-400">
              <Home size={14} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ChevronRight size={13} className="text-gray-300 dark:text-gray-600" />
            <span className="font-medium text-gray-900 dark:text-white">My Account</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 lg:hidden"
            >
              <Menu size={16} /> Menu
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-amber-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hello, {user?.fullName?.split(" ")[0] ?? "there"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your profile, orders and addresses</p>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <SidebarContent />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-white shadow-2xl dark:bg-gray-900"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <span className="font-semibold text-gray-900 dark:text-white">My Account</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


