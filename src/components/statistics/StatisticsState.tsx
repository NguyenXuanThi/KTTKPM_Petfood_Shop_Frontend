import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function StatisticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

export function StatisticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
      <h2 className="font-bold">Không thể tải dữ liệu thống kê</h2>
      <p className="mt-1 text-sm">Vui lòng kiểm tra kết nối service rồi thử lại.</p>
      <Button className="mt-4" variant="danger" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}



