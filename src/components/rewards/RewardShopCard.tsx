import { AlertTriangle, Coins, ShoppingBag, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RewardShopItem } from "@/api/rewardApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCoins } from "./CoinBadge";
import { formatDiscount } from "@/lib/couponUtils";

export function RewardShopCard({
  item,
  coinBalance,
  isLoading,
  onExchange,
}: {
  item: RewardShopItem;
  coinBalance: number;
  isLoading?: boolean;
  onExchange: () => void;
}) {
  const { t } = useTranslation();
  const coupon = item.coupon;
  const enoughCoins = coinBalance >= item.coinCost;
  const missingCoins = Math.max(0, item.coinCost - coinBalance);
  const canExchange =
    Boolean(coupon) && enoughCoins && item.isActive && coupon?.isActive;

  if (!coupon) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-red-200 bg-red-50/70 p-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
        <div className="flex items-center gap-3 font-bold">
          <AlertTriangle size={20} />
          {t("pawmart.rewardsPages.couponLoadFailed")}
        </div>
        <p className="mt-2 text-sm">
          {t("pawmart.rewardsPages.couponLoadFailedDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-amber-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-amber-400 via-orange-500 to-rose-500" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-200/50 blur-2xl transition group-hover:bg-orange-300/60" />
      <div className="absolute left-[72%] top-0 hidden h-full border-l-2 border-dashed border-amber-100 md:block dark:border-gray-800" />

      <div className="relative flex min-h-[18rem] flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg">
              <Ticket size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-500">
                {t("pawmart.rewardsPages.rewardCoupon")}
              </p>
              <h3 className="mt-1 font-mono text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                {coupon.code}
              </h3>
            </div>
          </div>
          <Badge
            variant={item.isActive && coupon.isActive ? "success" : "default"}
          >
            {item.isActive && coupon.isActive
              ? t("pawmart.rewardsPages.exchangeable")
              : t("pawmart.rewardsPages.locked")}
          </Badge>
        </div>

        <div className="mt-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:from-amber-950/20 dark:to-orange-950/10">
          <div className="text-3xl font-black text-orange-600 dark:text-orange-300">
            {t("pawmart.rewardsPages.discount", {
              value: formatDiscount(coupon),
            })}
          </div>
          {coupon.description && (
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {coupon.description}
            </p>
          )}
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-950/20">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
              <Coins size={16} /> {t("pawmart.rewardsPages.need")}
            </span>
            <span className="text-lg font-black text-amber-700 dark:text-amber-300">
              {formatCoins(item.coinCost)}
              {t("pawmart.rewardsPages.coinSuffix")}
            </span>
          </div>
          {!enoughCoins && (
            <p className="mb-3 text-center text-xs font-semibold text-red-500">
              {t("pawmart.rewardsPages.needMore", {
                count: formatCoins(missingCoins),
              })}
            </p>
          )}
          <Button
            className="w-full"
            disabled={!canExchange}
            loading={isLoading}
            onClick={onExchange}
          >
            {enoughCoins ? (
              <>
                <ShoppingBag size={16} />{" "}
                {t("pawmart.rewardsPages.exchangeNow")}
              </>
            ) : (
              t("pawmart.rewardsPages.notEnoughCoins")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
