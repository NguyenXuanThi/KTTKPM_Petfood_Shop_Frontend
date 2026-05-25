import { ArrowRight, Banknote, Clock3, Hourglass, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboardStatistics } from "@/hooks/useStatistics";
import { StatisticsCard } from "@/components/statistics/StatisticsCard";
import { StatisticsError, StatisticsLoading } from "@/components/statistics/StatisticsState";
import { formatPrice } from "@/lib/utils";

const links = [
  { to: "/admin/statistics/revenue", label: "Thống kê doanh thu" },
  { to: "/admin/statistics/orders", label: "Thống kê đơn hàng" },
  { to: "/admin/statistics/payments", label: "Thống kê payment" },
  { to: "/admin/statistics/users", label: "Thống kê user" },
];

export default function AdminDashboard() {
  const query = useDashboardStatistics({ range: "today" });
  const data = query.data;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
          PawMart Admin
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Tổng quan nhanh hôm nay. Mở từng trang thống kê để xem chi tiết hơn.
        </p>
      </div>

      {query.isLoading && <StatisticsLoading />}
      {query.isError && <StatisticsError onRetry={() => query.refetch()} />}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <StatisticsCard label="Doanh thu hôm nay" value={formatPrice(data.revenueToday)} icon={<Banknote />} />
            <StatisticsCard label="Order chờ xử lý" value={data.pendingOrders} icon={<Clock3 />} />
            <StatisticsCard label="Payment chờ xác minh" value={data.waitingVerifyPayments ?? 0} icon={<Hourglass />} />
            <StatisticsCard label="User mới" value={data.newUsers ?? 0} icon={<UserPlus />} />
          </div>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-950 dark:text-white">Liên kết nhanh</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-4 font-semibold text-gray-700 transition hover:bg-amber-50 hover:text-amber-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-amber-900/20"
                >
                  {link.label}
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}


