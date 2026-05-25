import { Gift, RotateCcw, Sparkles, Trophy } from "lucide-react";
import { UserReward } from "@/api/rewardApi";
import { formatCoins } from "./CoinBadge";

const cards = [
  { key: "coinBalance", label: "Số xu hiện có", icon: Trophy, color: "from-amber-400 to-orange-500", suffix: " xu" },
  { key: "spinBalance", label: "Lượt quay còn lại", icon: RotateCcw, color: "from-sky-400 to-cyan-500", suffix: " lượt" },
  { key: "totalSpinsEarned", label: "Tổng lượt quay đã nhận", icon: Gift, color: "from-emerald-400 to-teal-500", suffix: "" },
  { key: "totalSpinsUsed", label: "Tổng lượt quay đã dùng", icon: Sparkles, color: "from-fuchsia-400 to-rose-500", suffix: "" },
] as const;

export function RewardOverviewCards({ reward }: { reward?: UserReward }) {
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
            <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.color} opacity-20 blur-2xl transition group-hover:opacity-35`} />
            <div className="relative flex items-start justify-between gap-4">
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
                <Icon size={22} />
              </div>
              <span className="rounded-full bg-gray-50 px-2 py-1 text-xs font-bold text-gray-400 dark:bg-gray-800">0{index + 1}</span>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-gray-950 dark:text-white">
              {card.key === "coinBalance" ? formatCoins(rawValue) : rawValue}{card.suffix}
            </p>
          </div>
        );
      })}
    </div>
  );
}
