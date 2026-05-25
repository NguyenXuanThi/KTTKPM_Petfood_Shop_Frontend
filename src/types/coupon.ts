export type CouponType = "percentage" | "fixed";
export type CouponScope = "global" | "user" | "birthday" | "reward";
export type UserCouponStatus = "active" | "used" | "expired";

export interface Coupon {
  _id: string;
  code: string;
  description: string;
  type: CouponType;
  discountValue: number;
  minOrderAmount: number;
  scope: CouponScope;
  appliesTo: "order" | "shipping";
  maxDiscountAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  createdAt: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  shippingDiscount: number;
  finalAmount: number;
  message: string;
}

export interface AvailableCoupon {
  couponId: string;
  userCouponId?: string | null;
  code: string;
  description: string;
  scope: CouponScope;
  type: CouponType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  appliesTo: "order" | "shipping";
  expiresAt: string | null;
  discountPreview: number;
  discountAmount: number;
  shippingDiscount: number;
  source: "public" | "assigned";
}

export interface UserCoupon {
  _id: string;
  status: UserCouponStatus;
  assignedBy: "admin" | "system";
  createdAt: string;
  // Populated coupon
  coupon: Pick<
    Coupon,
    | "_id"
    | "code"
    | "description"
    | "type"
    | "discountValue"
    | "minOrderAmount"
    | "scope"
    | "appliesTo"
    | "maxDiscountAmount"
    | "expiresAt"
    | "isActive"
  >;
  validation?: CouponValidation;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  type: CouponType;
  discountValue: number;
  minOrderAmount?: number;
  scope?: CouponScope;
  expiresAt: string | null; // ISO string, null = never expires
  usageLimit?: number | null;
  perUserLimit?: number;
  appliesTo?: "order" | "shipping";
  maxDiscountAmount?: number | null;
}

export interface AssignCouponPayload {
  couponId: string;
  userId: string;
}


