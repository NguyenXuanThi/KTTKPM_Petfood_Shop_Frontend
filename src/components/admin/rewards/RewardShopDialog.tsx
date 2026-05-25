import { FormEvent, useEffect, useState } from "react";
import { RewardShopItem, RewardShopPayload } from "@/api/rewardApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CouponSelect } from "./CouponSelect";

export function RewardShopDialog({ item, isOpen, isLoading, onClose, onSubmit }: {
  item?: RewardShopItem | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: RewardShopPayload) => Promise<void>;
}) {
  const [couponId, setCouponId] = useState("");
  const [coinCost, setXuCost] = useState(500);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setCouponId(item?.couponId ?? "");
    setXuCost(item?.coinCost ?? 500);
    setDisplayOrder(item?.displayOrder ?? 0);
    setIsActive(item?.isActive ?? true);
  }, [isOpen, item]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({ couponId, coinCost: Number(coinCost), displayOrder: Number(displayOrder), isActive });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? "Chỉnh sửa mục đổi thưởng" : "Tạo mục đổi thưởng"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
          Coupon
          <CouponSelect value={couponId} onChange={setCouponId} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Số xu cần đổi
            <Input type="number" min={1} value={coinCost} onChange={(e) => setXuCost(Number(e.target.value))} />
          </label>
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Thứ tự hiển thị
            <Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} />
          </label>
          <label className="flex items-end gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-amber-500" /> Đang hoạt động
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" loading={isLoading}>{item ? "Lưu" : "Tạo mới"}</Button>
        </div>
      </form>
    </Modal>
  );
}




