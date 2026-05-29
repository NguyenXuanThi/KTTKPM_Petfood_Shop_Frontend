import {
  Gift,
  Heart,
  MapPin,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Truck,
  UserCircle2,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const menuItems = [
  { to: "/my-account/profile", labelKey: "profile", icon: UserCircle2 },
  { to: "/my-account/addresses", labelKey: "addresses", icon: MapPin },
  { to: "/my-account/wishlist", labelKey: "wishlist", icon: Heart },
  { to: "/my-account/orders", labelKey: "orders", icon: Package },
  {
    to: "/my-account/orders/shipping",
    labelKey: "shippingOrders",
    icon: Truck,
  },
  { to: "/my-account/coupons", labelKey: "coupons", icon: Ticket },
  { to: "/rewards", labelKey: "rewards", icon: Gift },
  { to: "/rewards/wheel", labelKey: "luckyWheel", icon: RotateCcw },
  { to: "/rewards/shop", labelKey: "rewardShop", icon: ShoppingBag },
  { to: "/rewards/history", labelKey: "spinHistory", icon: Gift },
  { to: "/my-account/security", labelKey: "security", icon: ShieldCheck },
];

export function AccountSidebar() {
  const { t } = useTranslation();

  return (
    <>
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/my-account/profile"}
              className={({ isActive }) =>
                cn(
                  "mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                )
              }
            >
              <item.icon size={18} />
              {t(`pawmart.accountSidebar.${item.labelKey}`)}
            </NavLink>
          ))}
        </div>
      </aside>

      <nav className="mb-4 grid grid-cols-4 gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/my-account/profile"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition",
                isActive
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
              )
            }
          >
            <item.icon size={16} />
            <span className="text-center leading-tight">
              {t(`pawmart.accountSidebar.${item.labelKey}`)}
            </span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
