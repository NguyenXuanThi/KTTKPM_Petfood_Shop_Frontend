import { useEffect, useRef, useState, type ReactNode } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  BadgePercent,
  Banknote,
  BarChart3,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  ShoppingCart,
  Tag,
  Trophy,
  Gift,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type NavItem =
  | {
      type?: never;
      to: string;
      end: boolean;
      icon: ReactNode;
      label: string;
    }
  | {
      type: "group";
      label: string;
    };

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin",
    end: true,
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  { type: "group", label: "Quản lý" },
  {
    to: "/admin/users",
    end: false,
    icon: <Users size={18} />,
    label: "Quản lý User",
  },
  {
    to: "/admin/coupons",
    end: false,
    icon: <Tag size={18} />,
    label: "Quản lý Coupon",
  },
  {
    to: "/admin/orders",
    end: false,
    icon: <ShoppingCart size={18} />,
    label: "Quản lý Order",
  },
  {
    to: "/admin/categories",
    end: false,
    icon: <FolderTree size={18} />,
    label: "Quản lý Product",
  },
  {
    to: "/admin/orders/pending",
    end: false,
    icon: <Clock3 size={18} />,
    label: "Order chờ xử lý",
  },
  {
    to: "/admin/payments/banking",
    end: false,
    icon: <Banknote size={18} />,
    label: "Payment banking",
  },
  {
    to: "/admin/reviews",
    end: false,
    icon: <MessageSquareText size={18} />,
    label: "Quản lý đánh giá",
  },
  { type: "group", label: "Tích điểm & vòng quay" },
  {
    to: "/admin/rewards/pool",
    end: false,
    icon: <Trophy size={18} />,
    label: "Quản lý vòng quay",
  },
  {
    to: "/admin/rewards/shop",
    end: false,
    icon: <Gift size={18} />,
    label: "Quản lý đổi xu",
  },
  { type: "group", label: "Thống kê" },
  {
    to: "/admin/statistics/revenue",
    end: false,
    icon: <ChartNoAxesCombined size={18} />,
    label: "Thống kê doanh thu",
  },
  {
    to: "/admin/statistics/orders",
    end: false,
    icon: <BarChart3 size={18} />,
    label: "Thống kê đơn hàng",
  },
  {
    to: "/admin/statistics/coupons",
    end: false,
    icon: <BadgePercent size={18} />,
    label: "Thống kê coupon",
  },
  {
    to: "/admin/statistics/users",
    end: false,
    icon: <Users size={18} />,
    label: "Thống kê user",
  },
  {
    to: "/admin/statistics/payments",
    end: false,
    icon: <CreditCard size={18} />,
    label: "Thống kê payment",
  },
];

function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = () => {
    const el = navRef.current;
    if (!el) return;

    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useEffect(() => {
    updateScrollState();
    const el = navRef.current;
    if (!el) return;

    const onResize = () => updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      const activeItem = el.querySelector("[data-admin-nav-active='true']");
      activeItem?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      updateScrollState();
    });
  }, [location.pathname]);

  return (
    <aside className="flex h-screen w-64 flex-col overflow-hidden border-r border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-800 dark:bg-gray-950 dark:text-white">
      <header className="shrink-0 border-b border-gray-100 p-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          {/* <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white shadow-sm">
            P
          </div>
          <div>
            <div className="font-black text-gray-950 dark:text-white">PawMart</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</div>
          </div> */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg font-bold text-white">
              🐾
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Paw<span className="text-amber-500">Mart</span>
            </span>
          </div>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {canScrollUp && (
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-8 bg-gradient-to-b from-white to-transparent dark:from-gray-950" />
        )}
        <nav
          ref={navRef}
          className="scrollbar-hide h-full overflow-y-auto scroll-smooth px-3 py-4"
          aria-label="Admin navigation"
        >
          <div className="space-y-1">
            {NAV_ITEMS.map((item) =>
              item.type === "group" ? (
                <div
                  key={item.label}
                  className="px-3 pb-2 pt-5 text-xs font-black uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500"
                >
                  {item.label}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                      isActive
                        ? "bg-orange-50 font-semibold text-orange-600 shadow-sm dark:bg-orange-500/10 dark:text-orange-300"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white",
                    )
                  }
                >
                  {({ isActive }) => (
                    <span
                      data-admin-nav-active={isActive ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <span
                        className={cn(
                          "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition",
                          isActive ? "bg-orange-500" : "bg-transparent",
                        )}
                      />
                      {item.icon}
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      <ChevronRight
                        size={14}
                        className={cn(
                          "opacity-35 transition group-hover:translate-x-0.5",
                          isActive && "opacity-70",
                        )}
                      />
                    </span>
                  )}
                </NavLink>
              ),
            )}
          </div>
        </nav>
        {canScrollDown && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-white to-transparent dark:from-gray-950" />
        )}
      </div>

      <footer className="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-orange-100 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:ring-orange-500/20">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-orange-500">
                {user?.fullName?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-950 dark:text-white">
              {user?.fullName}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex min-h-12 w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={16} /> Đăng xuất
        </button>
      </footer>
    </aside>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      <div className="hidden shrink-0 lg:block">
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 dark:text-gray-400 dark:hover:bg-gray-800"
            aria-label="Open admin menu"
          >
            <Menu size={20} />
          </button>
          <div className="font-semibold text-gray-900 dark:text-white">
            Admin Panel
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}




