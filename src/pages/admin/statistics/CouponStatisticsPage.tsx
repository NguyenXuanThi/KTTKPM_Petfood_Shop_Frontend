import { BadgePercent, Tag } from "lucide-react";
import { useCouponStatistics } from "@/hooks/useStatistics";
import { StatisticsCard } from "@/components/statistics/StatisticsCard";
import { ChartCard } from "@/components/statistics/ChartCard";
import { StatisticsTable } from "@/components/statistics/StatisticsTable";
import { StatisticsEmptyState } from "@/components/statistics/EmptyState";
import { StatisticsError, StatisticsLoading } from "@/components/statistics/StatisticsState";
import { CouponBarChart } from "@/components/statistics/charts/CouponBarChart";
import { formatPrice } from "@/lib/utils";
import { formatDate } from "@/lib/couponUtils";
import { StatisticsPageShell, useStatisticsFilter } from "./helpers";

export default function CouponStatisticsPage() {
  const [filter, setFilter] = useStatisticsFilter();
  const query = useCouponStatistics(filter);
  const data = query.data;

  return (
    <StatisticsPageShell title="Thống kê coupon" description="Chỉ tính coupon đã được dùng thật sự, không tính coupon chỉ mới assign." filter={filter} setFilter={setFilter}>
      {query.isLoading && <StatisticsLoading />}
      {query.isError && <StatisticsError onRetry={() => query.refetch()} />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatisticsCard label="Coupon đã dùng" value={data.summary.couponsUsed} icon={<Tag />} />
            <StatisticsCard label="Tổng số tiền giảm" value={formatPrice(data.summary.totalDiscountAmount)} icon={<BadgePercent />} />
            <StatisticsCard label="Coupon dùng nhiều nhất" value={data.summary.mostUsedCoupon || "-"} />
          </div>
          {data.chart.length ? (
            <ChartCard title="Coupon được dùng nhiều nhất">
              <CouponBarChart data={data.chart} />
            </ChartCard>
          ) : (
            <StatisticsEmptyState />
          )}
          <StatisticsTable
            columns={["Mã coupon", "Scope", "Số lượt dùng", "Số tiền giảm", "Hạn dùng", "Trạng thái"]}
            rows={data.table}
            renderRow={(row) => (
              <tr key={row.couponId}>
                <td className="px-4 py-3 font-bold text-amber-600">{row.code}</td>
                <td className="px-4 py-3">{row.scope}</td>
                <td className="px-4 py-3">{row.usedCount}</td>
                <td className="px-4 py-3">{formatPrice(row.totalDiscountAmount)}</td>
                <td className="px-4 py-3">{formatDate(row.expiresAt)}</td>
                <td className="px-4 py-3">{row.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}</td>
              </tr>
            )}
          />
        </div>
      )}
    </StatisticsPageShell>
  );
}





