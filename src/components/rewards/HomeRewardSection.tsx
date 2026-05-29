﻿import {
  ArrowRight,
  Coins,
  Gift,
  ShoppingBag,
  Ticket,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useMyRewards } from "@/hooks/useRewards";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

const highlights = [
  {
    icon: Coins,
    labelKey: "pawmart.rewards.coin",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: Ticket,
    labelKey: "pawmart.rewards.coupon",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: Gift,
    labelKey: "pawmart.rewards.spin",
    color: "bg-rose-100 text-rose-700",
  },
  {
    icon: Truck,
    labelKey: "pawmart.rewards.freeship",
    color: "bg-emerald-100 text-emerald-700",
  },
];

function MiniWheel() {
  return (
    <motion.div
      animate={{ rotate: [0, 4, -3, 0], y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto h-52 w-52 sm:h-64 sm:w-64"
    >
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,#f97316_0_16%,#facc15_16%_32%,#22c55e_32%_48%,#38bdf8_48%_64%,#a855f7_64%_80%,#f43f5e_80%_100%)] shadow-2xl ring-8 ring-white/50" />
      <div className="absolute inset-8 rounded-full border-[10px] border-white/80 bg-white/20 backdrop-blur-[1px]" />
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-4xl shadow-xl">
        🐾
      </div>
      <div className="absolute -top-2 left-1/2 h-10 w-8 -translate-x-1/2 rounded-b-full bg-white shadow-lg after:absolute after:left-1/2 after:top-7 after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[10px] after:border-t-[16px] after:border-x-transparent after:border-t-white" />
    </motion.div>
  );
}

export function HomeRewardSection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: reward } = useMyRewards({ enabled: isAuthenticated });
  const spinBalance = reward?.spinBalance ?? 0;

  const primary = !isAuthenticated
    ? { label: t("pawmart.rewards.login"), to: "/login" }
    : spinBalance > 0
      ? { label: t("pawmart.rewards.spinNow"), to: "/rewards/wheel" }
      : { label: t("pawmart.rewards.shopForSpin"), to: "/products" };

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 p-[1px] shadow-[0_28px_80px_-36px_rgba(249,115,22,0.7)]">
        <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/30 md:p-8 lg:p-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-300/30 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-yellow-300/25 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-orange-600 shadow-sm ring-1 ring-orange-100 dark:bg-gray-900/80 dark:ring-orange-900/40"
              >
                <Gift size={16} /> {t("pawmart.rewards.badge")}
              </motion.div>

              <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-gray-950 dark:text-white md:text-4xl">
                {t("pawmart.rewards.title")}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300 md:text-lg">
                {t("pawmart.rewards.desc")}
              </p>

              {isAuthenticated && spinBalance > 0 && (
                <div className="mt-5 inline-flex rounded-full bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-orange-500/20">
                  {t("pawmart.rewards.balance", { count: spinBalance })}
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.labelKey}
                      className="rounded-2xl border border-white/70 bg-white/75 p-3 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/70"
                    >
                      <div
                        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}
                      >
                        <Icon size={18} />
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {t(item.labelKey)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={primary.to}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {primary.label} <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link to="/rewards/shop">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-orange-200 bg-white/80 text-orange-700 hover:bg-orange-50 sm:w-auto"
                  >
                    {t("pawmart.rewards.shop")} <ShoppingBag size={16} />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-8 rounded-full bg-orange-300/30 blur-3xl" />
              <MiniWheel />
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute bottom-1 left-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-orange-100 dark:bg-gray-900 dark:ring-gray-800"
              >
                <p className="text-xs font-semibold text-gray-500">
                  {t("pawmart.rewards.today")}
                </p>
                <p className="text-sm font-black text-orange-600">
                  {t("pawmart.rewards.todayPrizes")}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
