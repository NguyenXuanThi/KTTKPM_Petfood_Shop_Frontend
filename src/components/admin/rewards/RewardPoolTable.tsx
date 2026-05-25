import { Edit, Power, PowerOff, Trash2 } from "lucide-react";
import { RewardPoolItem } from "@/api/rewardApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function RewardPoolTable({ rewards, isLoading, onEdit, onToggle, onDelete }: {
  rewards: RewardPoolItem[];
  isLoading?: boolean;
  onEdit: (item: RewardPoolItem) => void;
  onToggle: (item: RewardPoolItem) => void;
  onDelete: (item: RewardPoolItem) => void;
}) {
  if (isLoading) return <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />)}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th className="px-5 py-4">Tên hiển thị</th>
            <th className="px-5 py-4">Loại</th>
            <th className="px-5 py-4">Xu</th>
            <th className="px-5 py-4">Coupon</th>
            <th className="px-5 py-4">Tỷ lệ</th>
            <th className="px-5 py-4">Trạng thái</th>
            <th className="px-5 py-4">Thứ tự</th>
            <th className="px-5 py-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rewards.map((item) => (
            <tr key={item._id} className="bg-white dark:bg-gray-950">
              <td className="px-5 py-4 font-bold text-gray-950 dark:text-white">{item.label}</td>
              <td className="px-5 py-4"><Badge variant={item.type === "coin" ? "warning" : "info"}>{item.type}</Badge></td>
              <td className="px-5 py-4">{item.coinAmount || "-"}</td>
              <td className="px-5 py-4 font-mono text-xs">{item.couponId || "-"}</td>
              <td className="px-5 py-4 font-bold">{item.probability}%</td>
              <td className="px-5 py-4"><Badge variant={item.isActive ? "success" : "default"}>{item.isActive ? "Đang hoạt động" : "Dự phòng"}</Badge></td>
              <td className="px-5 py-4">{item.displayOrder}</td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onEdit(item)}><Edit size={14} /> Chỉnh sửa</Button>
                  <Button size="sm" variant="outline" onClick={() => onToggle(item)}>{item.isActive ? <PowerOff size={14} /> : <Power size={14} />}{item.isActive ? "Vô hiệu hóa" : "Kích hoạt"}</Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(item)}><Trash2 size={14} /> Xóa</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




