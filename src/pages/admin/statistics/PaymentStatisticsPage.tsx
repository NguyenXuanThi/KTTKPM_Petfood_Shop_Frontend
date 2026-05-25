import { CheckCircle2, Clock3, Hourglass, TimerOff, XCircle } from "lucide-react";
import { usePaymentStatistics } from "@/hooks/useStatistics";
import { StatisticsCard } from "@/components/statistics/StatisticsCard";
import { ChartCard } from "@/components/statistics/ChartCard";
import { StatisticsTable } from "@/components/statistics/StatisticsTable";
import { StatisticsError, StatisticsLoading } from "@/components/statistics/StatisticsState";
import { PaymentStatusChart } from "@/components/statistics/charts/PaymentStatusChart";
import { formatPrice } from "@/lib/utils";
import { StatisticsPageShell, formatDate, useStatisticsFilter } from "./helpers";

export default function PaymentStatisticsPage() {
  const [filter, setFilter] = useStatisticsFilter();
  const query = usePaymentStatistics(filter);
  const data = query.data;

  return (
    <StatisticsPageShell title="Thống kê payment" description="Theo dõi trạng thái payment và các giao dịch mới nhất." filter={filter} setFilter={setFilter}>
      {query.isLoading && <StatisticsLoading />}
      {query.isError && <StatisticsError onRetry={() => query.refetch()} />}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <StatisticsCard label="Payment đã paid" value={data.summary.paidPayments} icon={<CheckCircle2 />} />
            <StatisticsCard label="Chờ xác minh" value={data.summary.waitingVerifyPayments} icon={<Hourglass />} />
            <StatisticsCard label="Đang chờ" value={data.summary.pendingPayments} icon={<Clock3 />} />
            <StatisticsCard label="Thất bại" value={data.summary.failedPayments} icon={<XCircle />} />
            <StatisticsCard label="Hết hạn" value={data.summary.expiredPayments} icon={<TimerOff />} />
          </div>
          <ChartCard title="Trạng thái payment">
            <PaymentStatusChart data={data.chart} />
          </ChartCard>
          <StatisticsTable
            columns={["Payment", "Order", "Phương thức", "Trạng thái", "Số tiền", "Ngày tạo"]}
            rows={data.recentPayments}
            renderRow={(row) => (
              <tr key={row.paymentId}>
                <td className="px-4 py-3 font-mono">#{String(row.paymentId).slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3 font-mono">#{String(row.orderId).slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3">{row.paymentMethod}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{formatPrice(row.amount)}</td>
                <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              </tr>
            )}
          />
        </div>
      )}
    </StatisticsPageShell>
  );
}


