import { Search, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { useAdminCoupons } from "@/hooks/useCoupons";
import { Coupon } from "@/types/coupon";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatDate, formatDiscount, isCouponExpired } from "@/lib/couponUtils";

export function CouponSelect({ value, onChange }: { value?: string; onChange: (couponId: string) => void }) {
  const [query, setQuery] = useState("");
  const { data: coupons = [], isLoading } = useAdminCoupons();

  const rewardCoupons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons
      .filter((coupon) => coupon.scope === "reward")
      .filter((coupon) => coupon.isActive && !isCouponExpired(coupon.expiresAt))
      .filter((coupon) => !q || coupon.code.toLowerCase().includes(q) || coupon.description?.toLowerCase().includes(q));
  }, [coupons, query]);

  const selected = coupons.find((coupon) => coupon._id === value);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm coupon reward..." className="pl-9" />
      </div>
      {selected && <CouponOption coupon={selected} selected onClick={() => onChange(selected._id)} />}
      <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="text-sm text-gray-500">Đang tải coupon...</div>
        ) : rewardCoupons.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700">
            Chưa có coupon scope reward. Hãy tạo coupon với scope = reward trước.
          </div>
        ) : (
          rewardCoupons.map((coupon) => <CouponOption key={coupon._id} coupon={coupon} selected={coupon._id === value} onClick={() => onChange(coupon._id)} />)
        )}
      </div>
    </div>
  );
}

function CouponOption({ coupon, selected, onClick }: { coupon: Coupon; selected?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : "border-gray-100 bg-white hover:border-amber-200 dark:border-gray-800 dark:bg-gray-900"}`}>
      <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"><Ticket size={18} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-gray-950 dark:text-white">{coupon.code}</span>
          <Badge variant={coupon.isActive ? "success" : "default"}>{coupon.isActive ? "Đang hoạt động" : "Vô hiệu hóa"}</Badge>
          <Badge variant="warning">{formatDiscount(coupon)}</Badge>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{coupon.description}</p>
        <p className="mt-1 text-xs font-medium text-gray-400">Hạn dùng: {formatDate(coupon.expiresAt)}</p>
      </div>
    </button>
  );
}




