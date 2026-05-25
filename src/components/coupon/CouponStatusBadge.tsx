import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Coupon, UserCouponStatus } from "@/types/coupon";
import { isCouponExpired } from "@/lib/couponUtils";

// Badge cho bảng admin dựa trên trạng thái coupon.
export function CouponAdminBadge({ coupon }: { coupon: Coupon }) {
  const isExpired = isCouponExpired(coupon.expiresAt);

  if (!coupon.isActive) {
    return (
      <Badge variant="danger" className="gap-1.5">
        <XCircle size={11} />
        Vô hiệu hóa
      </Badge>
    );
  }
  if (isExpired) {
    return (
      <Badge variant="default" className="gap-1.5">
        <Clock size={11} />
        Hết hạn
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1.5">
      <CheckCircle2 size={11} />
      Đang hoạt động
    </Badge>
  );
}

// Badge cho coupon của user.
export function CouponUserBadge({ status }: { status: UserCouponStatus }) {
  if (status === "used") {
    return (
      <Badge variant="info" className="gap-1.5">
        <CheckCircle2 size={11} />
        Đã dùng
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge variant="default" className="gap-1.5">
        <Clock size={11} />
        Hết hạn
      </Badge>
    );
  }
  return (
    <Badge variant="success" className="gap-1.5">
      <CheckCircle2 size={11} />
      Có thể dùng
    </Badge>
  );
}


