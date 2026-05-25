import { AlertTriangle } from "lucide-react";
import { RewardPoolItem } from "@/api/rewardApi";
import { Badge } from "@/components/ui/Badge";

export function ProbabilitySummary({ rewards }: { rewards: RewardPoolItem[] }) {
  const total = rewards.filter((item) => item.isActive).reduce((sum, item) => sum + Number(item.probability || 0), 0);
  const ok = Math.round(total * 100) / 100 === 100;

  return (
    <div className={`rounded-2xl border p-4 ${ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className={ok ? "text-emerald-600" : "text-amber-600"} />
          <div>
            <p className="font-bold text-gray-950 dark:text-white">Tổng tỷ lệ đang hoạt động</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Vòng quay chỉ hoạt động khi tổng tỷ lệ đang hoạt động bằng 100%.</p>
          </div>
        </div>
        <Badge variant={ok ? "success" : "warning"}>{total}%</Badge>
      </div>
    </div>
  );
}




