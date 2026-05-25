import { FormEvent, useEffect, useState } from "react";
import { RewardPoolItem, RewardPoolPayload, RewardType } from "@/api/rewardApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CouponSelect } from "./CouponSelect";

export function RewardPoolDialog({ item, isOpen, isLoading, onClose, onSubmit }: {
  item?: RewardPoolItem | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: RewardPoolPayload) => Promise<void>;
}) {
  const [type, setType] = useState<RewardType>("coin");
  const [label, setLabel] = useState("");
  const [coinAmount, setXuAmount] = useState(100);
  const [couponId, setCouponId] = useState("");
  const [probability, setProbability] = useState(10);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setType(item?.type ?? "coin");
    setLabel(item?.label ?? "");
    setXuAmount(item?.coinAmount ?? 100);
    setCouponId(item?.couponId ?? "");
    setProbability(item?.probability ?? 10);
    setDisplayOrder(item?.displayOrder ?? 0);
    setIsActive(item?.isActive ?? true);
  }, [isOpen, item]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit({
      type,
      label,
      probability: Number(probability),
      displayOrder: Number(displayOrder),
      isActive,
      ...(type === "coin" ? { coinAmount: Number(coinAmount) } : { couponId }),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? "Chỉnh sửa phần thưởng vòng quay" : "Tạo phần thưởng vòng quay"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Loại
            <select value={type} onChange={(e) => setType(e.target.value as RewardType)} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option value="coin">Xu</option>
              <option value="coupon">Coupon</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Tên hiển thị
            <Input required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="100 xu / Coupon 10%" />
          </label>
        </div>
        {type === "coin" ? (
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Số xu
            <Input type="number" min={1} value={coinAmount} onChange={(e) => setXuAmount(Number(e.target.value))} />
          </label>
        ) : (
          <div className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Coupon phần thưởng
            <CouponSelect value={couponId} onChange={setCouponId} />
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Tỷ lệ (%)
            <Input type="number" min={0} step="0.01" value={probability} onChange={(e) => setProbability(Number(e.target.value))} />
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




