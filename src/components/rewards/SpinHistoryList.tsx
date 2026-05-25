import { Gift, History, Ticket, Trophy } from "lucide-react";
import { SpinHistoryItem } from "@/api/rewardApi";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCoins } from "./CoinBadge";

export function SpinHistoryList({ history, isLoading }: { history: SpinHistoryItem[]; isLoading?: boolean }) {
  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}</div>;
  }

  if (!history.length) {
    return <EmptyState icon={<History size={28} />} title="Bạn chưa có lịch sử quay nào" description="Phần thưởng sẽ xuất hiện tại đây sau lượt quay Lucky Wheel đầu tiên." />;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="hidden grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-gray-950 md:grid">
        <span>Phần thưởng</span>
        <span>Loại</span>
        <span>orderId</span>
        <span>Thời gian</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {history.map((item) => (
          <div key={item._id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.8fr] md:items-center md:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                {item.rewardType === "coin" ? <Trophy size={22} /> : <Ticket size={22} />}
              </div>
              <div>
                <div className="font-bold text-gray-950 dark:text-white">{item.rewardLabel}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 md:hidden">{new Date(item.playedAt || item.createdAt || "").toLocaleString("vi-VN")}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={item.rewardType === "coin" ? "warning" : "info"}>{item.rewardType}</Badge>
              {item.rewardType === "coin" ? <Badge variant="success">+{formatCoins(item.coinAmount)} xu</Badge> : <Badge variant="success"><Gift size={12} /> Coupon</Badge>}
            </div>
            <div>{item.orderId ? <Badge variant="outline">{item.orderId.slice(-8).toUpperCase()}</Badge> : <span className="text-sm text-gray-400">-</span>}</div>
            <div className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">{new Date(item.playedAt || item.createdAt || "").toLocaleString("vi-VN")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
