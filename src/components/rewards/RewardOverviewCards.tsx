import { Gift, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserReward } from "@/api/rewardApi";
import { formatCoins } from "./CoinBadge";

const cards = [
  {
    key: "coinBalance",
    labelKey: "pawmart.rewards.coinBalance",
    icon: Trophy,
    color: "from-amber-400 to-orange-500",
    suffixKey: "pawmart.rewards.coinSuffix",
  },
  {
    key: "spinBalance",
    labelKey: "pawmart.rewards.spinBalance",
    icon: RotateCcw,
    color: "from-sky-400 to-cyan-500",
    suffixKey: "pawmart.rewards.spinSuffix",
  },
  {
    key: "totalSpinsEarned",
    labelKey: "pawmart.rewards.totalSpinsEarned",
    icon: Gift,
    color: "from-emerald-400 to-teal-500",
    suffixKey: "",
  },
  {
    key: "totalSpinsUsed",
    labelKey: "pawmart.rewards.totalSpinsUsed",
    icon: Sparkles,
    color: "from-fuchsia-400 to-rose-500",
    suffixKey: "",
  },
] as const;

export function RewardOverviewCards({ reward }: { reward?: UserReward }) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const rawValue = Number(reward?.[card.key] ?? 0);
        return (
          <div
            key={card.key}
            className="group relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl transition group-hover:opacity-35`}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}
              >
                <Icon size={22} />
              </div>
              <span className="rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-400 dark:bg-gray-800">
                0{index + 1}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t(card.labelKey)}
            </p>
            <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">
              {card.key === "coinBalance" ? formatCoins(rawValue) : rawValue}
              {card.suffixKey ? t(card.suffixKey) : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
