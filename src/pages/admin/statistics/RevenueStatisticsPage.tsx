import { Banknote, PackageCheck, Receipt } from "lucide-react";
import { useRevenueStatistics } from "@/hooks/useStatistics";
import { StatisticsCard } from "@/components/statistics/StatisticsCard";
import { ChartCard } from "@/components/statistics/ChartCard";
import { StatisticsTable } from "@/components/statistics/StatisticsTable";
import { StatisticsEmptyState } from "@/components/statistics/EmptyState";
import { StatisticsError, StatisticsLoading } from "@/components/statistics/StatisticsState";
import { RevenueLineChart } from "@/components/statistics/charts/RevenueLineChart";
import { formatPrice } from "@/lib/utils";
import { StatisticsPageShell, useStatisticsFilter } from "./helpers";

export default function RevenueStatisticsPage() {
  const [filter, setFilter] = useStatisticsFilter();
  const query = useRevenueStatistics(filter);
  const data = query.data;

  return (
    <StatisticsPageShell
      title="Thống kê doanh thu"
      description="Theo dõi doanh thu đã paid, số order paid và xu hướng doanh thu theo thời gian."
      filter={filter}
      setFilter={setFilter}
    >
      {query.isLoading && <StatisticsLoading />}
      {query.isError && <StatisticsError onRetry={() => query.refetch()} />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatisticsCard label="Tổng doanh thu" value={formatPrice(data.summary.totalRevenue)} icon={<Banknote />} />
            <StatisticsCard label="Doanh thu đã paid" value={formatPrice(data.summary.paidRevenue)} icon={<Receipt />} />
            <StatisticsCard label="Giá trị order trung bình" value={formatPrice(data.summary.averageOrderValue)} icon={<PackageCheck />} />
          </div>
          {data.chart.length ? (
            <ChartCard title="Doanh thu theo thời gian">
              <RevenueLineChart data={data.chart} />
            </ChartCard>
          ) : (
            <StatisticsEmptyState />
          )}
          <StatisticsTable
            columns={["Ngày", "Tổng order", "Order đã paid", "Doanh thu"]}
            rows={data.table}
            renderRow={(row) => (
              <tr key={row.date}>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{row.totalOrders}</td>
                <td className="px-4 py-3">{row.paidOrders}</td>
                <td className="px-4 py-3 font-semibold text-amber-600">{formatPrice(row.revenue)}</td>
              </tr>
            )}
          />
        </div>
      )}
    </StatisticsPageShell>
  );
}




