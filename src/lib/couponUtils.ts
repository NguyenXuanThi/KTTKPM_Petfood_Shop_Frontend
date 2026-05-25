import { Coupon } from "@/types/coupon";

export function formatDiscount(
  coupon: Pick<Coupon, "type" | "discountValue">,
): string {
  if (coupon.type === "percentage") return `${coupon.discountValue}%`;
  return `${coupon.discountValue.toLocaleString("vi-VN")}d`;
}

export function isCouponExpired(expiresAt?: string | null): boolean {
  return Boolean(expiresAt) && new Date(expiresAt as string) <= new Date();
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "Không hết hạn";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
