import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlistQuery } from "@/hooks/useWishlistApi";
import { RECOMMENDATIONS_KEY } from "@/hooks/useRecommendations";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import {
  MegaMenu,
  MobileCategoryMenu,
} from "@/components/CategoryMenu/MegaMenu";
import { HeaderRewardBadge } from "@/components/rewards/HeaderRewardBadge";

export function Navbar() {
  const { user, isAuthenticated, isAdmin, isSupport, logout } = useAuth();
  const { totalItems } = useCart();
  const { data: wishlistData } = useWishlistQuery();
  const wishlistCount = wishlistData?.total ?? 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    queryClient.invalidateQueries({ queryKey: [RECOMMENDATIONS_KEY, "products"] });
    setSearchQuery("");
    setMenuOpen(false);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch(searchQuery);
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 shadow-md backdrop-blur-md dark:bg-gray-950/95"
          : "bg-white dark:bg-gray-950",
      )}
    >
      {/* Top bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg font-bold text-white">
            🐾
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Paw<span className="text-amber-500">Mart</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden max-w-xs flex-1 md:flex">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm máy cho ăn tự động..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-14 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
            >
              Tìm
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleDark}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <LanguageSwitcher />

          {isAuthenticated && <HeaderRewardBadge />}

          <Link
            to="/wishlist"
            className="relative rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {wishlistCount > 9 ? "9+" : wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:ring-amber-800">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-amber-600 dark:text-amber-400">
                      {user?.fullName?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="max-w-[100px] truncate">{user?.fullName}</span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl dark:border-gray-800 dark:bg-gray-900"
                  >
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <LayoutDashboard size={14} />{" "}
                        {t("pawmart.products.adminDashboard")}
                      </Link>
                    )}
                    {isSupport && (
                      <Link
                        to="/support"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <LayoutDashboard size={14} /> Support Dashboard
                      </Link>
                    )}
                    <Link
                      to="/my-account/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      <User size={14} />
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="flex min-h-11 w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <LogOut size={14} /> {t("pawmart.products.logout")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 md:flex"
            >
              <User size={15} /> {t("pawmart.auth.signIn")}
            </Link>
          )}

          <button
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mega menu bar (desktop) */}
      <div className="hidden border-t border-gray-100 dark:border-gray-800 md:block">
        <div className="mx-auto max-w-7xl px-4 py-1 md:px-6">
          <MegaMenu />
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-50 overflow-hidden border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950 md:hidden"
          >
            <div className="space-y-1 p-4">
              {/* Mobile search */}
              <div className="relative mb-3">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm thức ăn cho mèo..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-14 text-sm focus:border-amber-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    Tìm
                  </button>
                </form>
              </div>

              {/* Products link */}
              <Link
                to="/products"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {t("pawmart.nav.products")}
              </Link>

              {/* Mobile category tree */}
              <MobileCategoryMenu onNavigate={() => setMenuOpen(false)} />

              {/* Appointment Button */}
              <Link
                to="/appointment"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg bg-amber-500 px-3 py-3 text-sm font-medium text-white hover:bg-amber-600"
              >
                🐾 Đặt lịch hẹn
              </Link>

              {/* Auth */}
              <div className="border-t border-gray-100 pt-2 dark:border-gray-800">
                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isSupport && (
                      <Link
                        to="/support"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                      >
                        Support Dashboard
                      </Link>
                    )}
                    <Link
                      to="/my-account/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
                    >
                      My Account
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="min-h-11 w-full rounded-lg px-3 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {t("pawmart.products.logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-amber-600"
                  >
                    {t("pawmart.auth.signIn")}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
