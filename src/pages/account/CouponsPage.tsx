import { Ticket } from "lucide-react";
import { useMyCoupons } from "@/hooks/useCoupons";
import { CouponCard } from "@/components/coupon/CouponCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { UserCoupon } from "@/types/coupon";
import { useTranslation } from "react-i18next";

function CouponCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-stretch pl-4">
        <div className="flex-1 space-y-2 py-4 pl-2 pr-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="flex w-20 items-center justify-center py-4">
          <Skeleton className="h-9 w-14 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function CouponsPage() {
  const { t } = useTranslation();
  const { data: userCoupons = [], isLoading, isError } = useMyCoupons();

  const active = userCoupons.filter((uc) => uc.status === "active");
  const inactive = userCoupons.filter((uc) => uc.status !== "active");

  // Future: pass onApply to CouponCard for checkout integration
  const handleApply = (_uc: UserCoupon) => {
    // TODO: integrate with checkout flow
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
          <Ticket size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("pawmart.coupons.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pawmart.coupons.subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && !isError && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            {t("pawmart.coupons.active", { count: active.length })}
          </Badge>
          <Badge variant="default">
            {t("pawmart.coupons.usedExpired", { count: inactive.length })}
          </Badge>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <CouponCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Ticket size={28} />}
          title={t("pawmart.coupons.unableLoad")}
          description={t("pawmart.coupons.tryAgain")}
        />
      ) : userCoupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <Ticket
            size={40}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="font-semibold text-gray-500 dark:text-gray-400">
            {t("pawmart.coupons.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            {t("pawmart.coupons.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active coupons */}
          {active.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pawmart.coupons.available")}
              </h3>
              <div className="space-y-3">
                {active.map((uc) => (
                  <CouponCard
                    key={uc._id}
                    userCoupon={uc}
                    // Uncomment when checkout is ready:
                    // onApply={handleApply}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Used / expired coupons */}
          {inactive.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("pawmart.coupons.usedExpiredSection")}
              </h3>
              <div className="space-y-3">
                {inactive.map((uc) => (
                  <CouponCard key={uc._id} userCoupon={uc} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
