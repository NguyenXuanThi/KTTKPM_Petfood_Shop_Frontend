import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function formatCoins(value?: number) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export function CoinBadge({ coins, className }: { coins: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700/40", className)}>
      <Coins size={15} /> {formatCoins(coins)} xu
    </span>
  );
}


