import { FormEvent, useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CreateCouponPayload, CouponScope, CouponType } from "@/types/coupon";

interface CreateCouponModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCouponPayload) => void;
}

const EMPTY: CreateCouponPayload = {
  code: "",
  description: "",
  type: "percentage",
  discountValue: 0,
  minOrderAmount: 0,
  scope: "global",
  expiresAt: null,
  usageLimit: null,
  perUserLimit: 1,
  appliesTo: "order",
  maxDiscountAmount: null,
};

export function CreateCouponModal({
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: CreateCouponModalProps) {
  const [form, setForm] = useState<CreateCouponPayload>(EMPTY);
  const [noExpiration, setNoExpiration] = useState(false);

  const set = <K extends keyof CreateCouponPayload>(
    key: K,
    value: CreateCouponPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(EMPTY);
    setNoExpiration(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (form.scope === "reward") {
      setNoExpiration(true);
      set("expiresAt", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.scope, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      code: form.code.toUpperCase().trim(),
      expiresAt: noExpiration
        ? null
        : new Date(form.expiresAt as string).toISOString(),
    });
  };

  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
  const selectClass =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="T?o coupon" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Mã coupon *</label>
            <Input
              placeholder="VD: SALE20"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Scope</label>
            <select
              className={selectClass}
              value={form.scope}
              onChange={(e) => set("scope", e.target.value as CouponScope)}
            >
              <option value="global">Global</option>
              <option value="user">User-specific</option>
              <option value="birthday">Birthday</option>
              <option value="reward">Reward</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Áp dụng cho</label>
            <select
              className={selectClass}
              value={form.appliesTo}
              onChange={(e) =>
                set("appliesTo", e.target.value as "order" | "shipping")
              }
            >
              <option value="order">Order</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Giới hạn mỗi user</label>
            <Input
              type="number"
              min={1}
              value={form.perUserLimit || 1}
              onChange={(e) => set("perUserLimit", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Giảm tối đa</label>
            <Input
              type="number"
              min={0}
              placeholder="Không giới hạn"
              value={form.maxDiscountAmount ?? ""}
              onChange={(e) =>
                set(
                  "maxDiscountAmount",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Mô tả</label>
          <Input
            placeholder="Mô tả ngắn (không bắt buộc)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type *</label>
            <select
              className={selectClass}
              value={form.type}
              onChange={(e) => set("type", e.target.value as CouponType)}
            >
              <option value="percentage">Phần trăm (%)</option>
              <option value="fixed">Số tiền cố định (d)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>
              {form.type === "percentage" ? "Mức giảm (%)" : "Mức giảm (d)"} *
            </label>
            <Input
              type="number"
              min={0}
              max={form.type === "percentage" ? 100 : undefined}
              placeholder="0"
              value={form.discountValue || ""}
              onChange={(e) => set("discountValue", Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Giá trị order tối thiểu (d)</label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={form.minOrderAmount || ""}
              onChange={(e) => set("minOrderAmount", Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>
              Giới hạn lượt dùng (trống = không giới hạn)
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Không giới hạn"
              value={form.usageLimit ?? ""}
              onChange={(e) =>
                set(
                  "usageLimit",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={noExpiration}
              onChange={(e) => {
                setNoExpiration(e.target.checked);
                if (e.target.checked) set("expiresAt", null);
              }}
              className="h-4 w-4 accent-amber-500"
            />
            Không có ngày hết hạn
          </label>
          <div>
            <label className={labelClass}>
              Ngày hết hạn {!noExpiration && "*"}
            </label>
            <Input
              type="datetime-local"
              value={form.expiresAt ?? ""}
              onChange={(e) => set("expiresAt", e.target.value)}
              disabled={noExpiration}
              required={!noExpiration}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!form.code || (!noExpiration && !form.expiresAt)}
          >
            Tạo coupon
          </Button>
        </div>
      </form>
    </Modal>
  );
}
