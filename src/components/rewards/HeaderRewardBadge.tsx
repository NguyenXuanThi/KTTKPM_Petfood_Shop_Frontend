import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useMyRewards } from "@/hooks/useRewards";
import { formatCoins } from "@/components/rewards/CoinBadge";

export function HeaderRewardBadge() {
  const { data: reward } = useMyRewards({ enabled: true });
  const coins = reward?.coinBalance ?? 0;
  const spins = reward?.spinBalance ?? 0;

  return (
    <Link
      to="/rewards"
      className="group relative hidden items-center gap-1.5 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-black text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20 dark:text-amber-300 sm:flex"
      aria-label="Xem phần thưởng của tôi"
    >
      {spins > 0 && (
        <motion.span
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-950"
          animate={{ scale: [1, 1.35, 1], opacity: [1, 0.75, 1] }}
          transition={{ repeat: Infinity, duration: 1.4 }}
        />
      )}
      <span className="inline-flex items-center gap-1">
        <span aria-hidden>🪙</span> {formatCoins(coins)}
      </span>
      <span className="h-4 w-px bg-amber-200 dark:bg-amber-800" />
      <span className="inline-flex items-center gap-1">
        <RotateCcw size={14} /> {spins}
      </span>
    </Link>
  );
}
