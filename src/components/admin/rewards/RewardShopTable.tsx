import { AlertTriangle, Edit, Power, PowerOff } from "lucide-react";
import { RewardShopItem } from "@/api/rewardApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatDiscount } from "@/lib/couponUtils";
import { formatPrice } from "@/lib/utils";

export function RewardShopTable({ items, isLoading, onEdit, onToggle }: {
  items: RewardShopItem[];
  isLoading?: boolean;
  onEdit: (item: RewardShopItem) => void;
  onToggle: (item: RewardShopItem) => void;
}) {
  if (isLoading) return <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-5 py-4">Mã coupon</th>
            <th className="px-5 py-4">Mức giảm</th>
            <th className="px-5 py-4">Số xu cần đổi</th>
            <th className="px-5 py-4">Hạn dùng</th>
            <th className="px-5 py-4">Trạng thái</th>
            <th className="px-5 py-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((item) => {
            const coupon = item.coupon;
            return (
              <tr key={item._id} className="bg-white dark:bg-gray-950">
                <td className="px-5 py-4">
                  {coupon ? (
                    <div>
                      <div className="font-mono text-sm font-black text-gray-950 dark:text-white">{coupon.code}</div>
                      <div className="mt-1 line-clamp-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">{coupon.description || "Không có mô tả"}</div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-950/20 dark:text-red-300">
                      <AlertTriangle size={13} /> Không thể tải thông tin coupon
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  {coupon ? (
                    <div className="space-y-1">
                      <div className="font-bold text-amber-600 dark:text-amber-300">Giảm {formatDiscount(coupon)}</div>
                      <div className="text-xs text-gray-500">Đơn tối thiểu: {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : "Không yêu cầu"}</div>
                      <div className="text-xs text-gray-500">Giảm tối đa: {coupon.maxDiscountAmount ? formatPrice(coupon.maxDiscountAmount) : "Không giới hạn"}</div>
                    </div>
                  ) : "-"}
                </td>
                <td className="px-5 py-4 font-bold text-amber-600">{item.coinCost.toLocaleString("vi-VN")} xu</td>
                <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{coupon ? formatDate(coupon.expiresAt) : "-"}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <Badge variant={item.isActive ? "success" : "default"}>{item.isActive ? "Đang hoạt động" : "Không hoạt động"}</Badge>
                    {coupon && !coupon.isActive && <Badge variant="danger">Coupon đã vô hiệu hóa</Badge>}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(item)}><Edit size={14} /> Chỉnh sửa</Button>
                    <Button size="sm" variant="outline" onClick={() => onToggle(item)}>{item.isActive ? <PowerOff size={14} /> : <Power size={14} />}{item.isActive ? "Vô hiệu hóa" : "Kích hoạt"}</Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
