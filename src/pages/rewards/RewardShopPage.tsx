import { ShoppingBag, Ticket } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useExchangeReward,
  useMyRewards,
  useRewardShop,
} from "@/hooks/useRewards";
import { RewardShopCard } from "@/components/rewards/RewardShopCard";
import { CoinBadge } from "@/components/rewards/CoinBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { RewardShell } from "./RewardsOverviewPage";

export default function RewardShopPage() {
  const { t } = useTranslation();
  const [successOpen, setSuccessOpen] = useState(false);
  const [exchangingId, setExchangingId] = useState<string | null>(null);
  const { data: reward } = useMyRewards();
  const { data: items = [], isLoading, isError, refetch } = useRewardShop();
  const exchangeMutation = useExchangeReward();

  const handleExchange = async (id: string) => {
    setExchangingId(id);
    try {
      await exchangeMutation.mutateAsync(id);
      setSuccessOpen(true);
    } finally {
      setExchangingId(null);
    }
  };

  return (
    <RewardShell>
      <div className="flex flex-col gap-4 rounded-[2.25rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-bold">
            Reward Shop
          </p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            {t("pawmart.rewardsPages.rewardShop")}
          </h1>
          <p className="mt-2 max-w-2xl text-white/85">
            {t("pawmart.rewardsPages.shopDesc")}
          </p>
        </div>
        <CoinBadge
          coins={reward?.coinBalance ?? 0}
          className="bg-white text-emerald-700 ring-white/50"
        />
      </div>

      {isError ? (
        <EmptyState
          icon={<ShoppingBag size={28} />}
          title={t("pawmart.rewardsPages.loadShopFailed")}
          description={t("pawmart.rewardsPages.tryAgain")}
          action={
            <Button onClick={() => refetch()}>
              {t("pawmart.rewardsPages.retry")}
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Ticket size={28} />}
          title={t("pawmart.rewardsPages.shopEmptyTitle")}
          description={t("pawmart.rewardsPages.shopEmptyDesc")}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <RewardShopCard
              key={item._id}
              item={item}
              coinBalance={reward?.coinBalance ?? 0}
              isLoading={exchangingId === item._id}
              onExchange={() => handleExchange(item._id)}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        title={t("pawmart.rewardsPages.exchangeSuccess")}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Ticket size={30} />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {t("pawmart.rewardsPages.couponAdded")}
          </p>
          <Button className="mt-5" onClick={() => setSuccessOpen(false)}>
            {t("pawmart.rewardsPages.close")}
          </Button>
        </div>
      </Modal>
    </RewardShell>
  );
}
