import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { CouponUserBadge } from "./CouponStatusBadge";
import { UserCoupon } from "@/types/coupon";
import { formatDate, formatDiscount } from "@/lib/couponUtils";

interface CouponCardProps {
  userCoupon: UserCoupon;
  // Future: onApply for checkout integration
  onApply?: (userCoupon: UserCoupon) => void;
}

export function CouponCard({ userCoupon, onApply }: CouponCardProps) {
  const { coupon, status } = userCoupon;
  const isUsable = status === "active";
  const isUsed = status === "used";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 dark:bg-gray-900",
        isUsable
          ? "border-amber-200 hover:shadow-md hover:-translate-y-0.5 dark:border-amber-800/50"
          : "border-gray-200 opacity-70 dark:border-gray-700"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1.5 rounded-l-2xl",
          isUsable ? "bg-amber-400" : "bg-gray-300 dark:bg-gray-600"
        )}
      />

      {/* Dashed divider notch */}
      <div className="absolute left-[calc(100%-5rem)] top-0 h-full w-px border-l-2 border-dashed border-gray-200 dark:border-gray-700" />

      <div className="flex items-stretch pl-4">
        {/* Main content */}
        <div className="flex-1 py-4 pl-2 pr-4">
          {/* Code + badge */}
          <div className="mb-2 flex items-center gap-2">
            <Ticket
              size={15}
              className={cn(
                isUsable ? "text-amber-500" : "text-gray-400"
              )}
            />
            <span
              className={cn(
                "font-mono text-base font-bold tracking-wide",
                isUsable
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 line-through dark:text-gray-500",
                isUsed && "line-through"
              )}
            >
              {coupon.code}
            </span>
            <CouponUserBadge status={status} />
          </div>

          {/* Description */}
          {coupon.description && (
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {coupon.description}
            </p>
          )}

          {/* Details */}
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Mức giảm:
              </span>{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {formatDiscount(coupon)}
              </span>
            </p>
            {coupon.minOrderAmount > 0 && (
              <p>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Order tối thiểu:
                </span>{" "}
                {coupon.minOrderAmount.toLocaleString("vi-VN")}đ
              </p>
            )}
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Hết hạn:
              </span>{" "}
              {formatDate(coupon.expiresAt)}
            </p>
          </div>
        </div>

        {/* Right action area */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center gap-2 py-4">
          {/* Future: Apply button for checkout */}
          <button
            onClick={() => onApply?.(userCoupon)}
            disabled={!isUsable || !onApply}
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              isUsable && onApply
                ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-95"
                : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
            )}
            title={!onApply ? "Có thể dùng ở checkout" : undefined}
          >
            {isUsed ? "Đã dùng" : "Áp dụng"}
          </button>
        </div>
      </div>
    </div>
  );
}


