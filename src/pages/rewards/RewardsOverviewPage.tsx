import { Link } from "react-router-dom";
import { Gift, History, RotateCcw, ShoppingBag, Sparkles, Ticket } from "lucide-react";
import { motion } from "framer-motion";
import { useMyRewards } from "@/hooks/useRewards";
import { RewardOverviewCards } from "@/components/rewards/RewardOverviewCards";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

const ctas = [
  { to: "/rewards/wheel", icon: RotateCcw, title: "Lucky Wheel", desc: "Dùng lượt quay từ order thành công.", accent: "from-orange-400 to-amber-500" },
  { to: "/rewards/shop", icon: ShoppingBag, title: "Cửa hàng đổi thưởng", desc: "Đổi xu lấy coupon hấp dẫn.", accent: "from-emerald-400 to-teal-500" },
  { to: "/rewards/history", icon: History, title: "Lịch sử quay", desc: "Xem lại toàn bộ phần thưởng đã nhận.", accent: "from-sky-400 to-cyan-500" },
  { to: "/my-account/coupons", icon: Ticket, title: "Coupon của tôi", desc: "Quản lý coupon đã nhận từ reward.", accent: "from-fuchsia-400 to-rose-500" },
];

export default function RewardsOverviewPage() {
  const { data: reward, isLoading, isError, refetch } = useMyRewards();

  if (isError) {
    return <RewardShell><EmptyState icon={<Gift size={28} />} title="Không thể tải phần thưởng" description="Reward-service có thể đang bận. Vui lòng thử lại." action={<Button onClick={() => refetch()}>Thử lại</Button>} /></RewardShell>;
  }

  return (
    <RewardShell>
      <div className="relative overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white shadow-[0_30px_100px_-38px_rgba(249,115,22,0.9)] md:p-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-yellow-200/20 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm font-bold backdrop-blur"><Sparkles size={15} /> PawMart Rewards</p>
          <h1 className="text-3xl font-black md:text-5xl">Phần thưởng của tôi</h1>
          <p className="mt-4 max-w-2xl text-white/85">Tích xu từ Lucky Wheel, đổi coupon trong Reward Shop và theo dõi mọi phần thưởng bạn đã nhận.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/rewards/wheel"><Button className="bg-white text-orange-600 hover:bg-orange-50"><RotateCcw size={16} /> Quay ngay</Button></Link>
            <Link to="/rewards/shop"><Button variant="outline" className="border-white text-white hover:bg-white/10"><ShoppingBag size={16} /> Cửa hàng đổi thưởng</Button></Link>
          </div>
        </motion.div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />)}</div>
      ) : (
        <RewardOverviewCards reward={reward} />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ctas.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${item.accent} opacity-20 blur-2xl transition group-hover:opacity-35`} />
              <div className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent} text-white shadow-lg transition group-hover:scale-110`}><Icon size={22} /></div>
              <h3 className="relative text-lg font-black text-gray-950 dark:text-white">{item.title}</h3>
              <p className="relative mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </RewardShell>
  );
}

export function RewardShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-8 dark:bg-gray-950 md:px-8"><div className="mx-auto max-w-7xl space-y-6">{children}</div></div>;
}
