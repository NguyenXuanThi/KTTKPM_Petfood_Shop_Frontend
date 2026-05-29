﻿import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  Gift,
  MapPin,
  Package,
  Printer,
  RotateCcw,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import { cartService } from "@/services/cart.service";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { CART_KEY } from "@/hooks/useCartApi";
import {
  downloadOrderInvoice,
  InvoiceLabels,
  printOrderInvoice,
} from "@/lib/orderInvoice";
import { ReviewDialog } from "@/components/review/ReviewDialog";
import { useProductReviews } from "@/hooks/useReviews";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { Order, OrderItem, Review } from "@/types";
import { useMyRewards } from "@/hooks/useRewards";
import { useTranslation } from "react-i18next";

const fmt = (v?: string | null) =>
  v
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(v))
    : "-";

function OrderItemReviewAction({
  order,
  item,
}: {
  order: Order;
  item: OrderItem;
}) {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const currentUserId = user?.id ?? user?._id ?? "";
  const [isOpen, setIsOpen] = useState(false);
  const canReview =
    order.orderStatus === "completed" && order.paymentStatus === "paid";
  const { data } = useProductReviews(canReview ? item.productId : "");

  const existingReview = useMemo<Review | null>(() => {
    if (!currentUserId) return null;
    return (
      data?.reviews?.find(
        (review) =>
          review.orderId === order._id &&
          review.productId === item.productId &&
          review.userId === currentUserId,
      ) ?? null
    );
  }, [currentUserId, data?.reviews, item.productId, order._id]);

  if (!canReview) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={existingReview ? "outline" : "primary"}
        onClick={() => setIsOpen(true)}
      >
        {existingReview ? <CheckCircle2 size={14} /> : <Star size={14} />}
        {existingReview
          ? t("pawmart.account.editReview")
          : t("pawmart.account.writeReview")}
      </Button>
      <ReviewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productId={item.productId}
        orderId={order._id}
        productName={item.name}
        imageUrl={item.imageUrl}
        initialReview={existingReview}
      />
    </>
  );
}

export default function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: reward } = useMyRewards();
  const locale =
    i18n.language?.startsWith("jp") || i18n.language?.startsWith("ja")
      ? "ja-JP"
      : i18n.language?.startsWith("en")
        ? "en-US"
        : "vi-VN";

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        title={t("pawmart.account.orderNotFound")}
        description={t("pawmart.account.checkOrderList")}
      />
    );
  }

  const canShowRewardCta =
    (reward?.spinBalance ?? 0) > 0 &&
    !(order.paymentMethod === "banking" && order.paymentStatus !== "paid");
  const invoiceLabels: InvoiceLabels = {
    invoiceTitle: t("pawmart.account.invoiceTitle"),
    invoiceNo: t("pawmart.account.invoiceNo"),
    createdAt: t("pawmart.account.created"),
    customer: t("pawmart.account.customer"),
    phone: t("pawmart.account.phone"),
    address: t("pawmart.account.address"),
    paymentMethod: t("pawmart.account.method"),
    paymentStatus: t("pawmart.account.status"),
    product: t("pawmart.account.product"),
    quantity: t("pawmart.checkout.qty"),
    unitPrice: t("pawmart.account.unitPrice"),
    lineTotal: t("pawmart.account.lineTotal"),
    subtotal: t("pawmart.checkout.subtotal"),
    shippingFee: t("pawmart.checkout.shipping"),
    shippingDiscount: t("pawmart.checkout.shippingDiscount"),
    couponDiscount: t("pawmart.checkout.couponDiscount"),
    vatIncluded: t("pawmart.account.vatIncluded"),
    total: t("pawmart.account.total"),
    note: t("pawmart.account.invoiceVatNote"),
  };

  const reorderMutation = useMutation({
    mutationFn: async () => {
      for (const item of order.items) {
        await cartService.addItem(item.productId, item.quantity);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [CART_KEY] });
      toast.success(t("pawmart.account.reorderSuccess"));
      navigate("/cart");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? t("pawmart.account.reorderFailed"),
      );
    },
  });

  return (
    <div className="space-y-4">
      <Link
        to="/my-account/orders"
        className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline"
      >
        <ArrowLeft size={14} /> {t("pawmart.account.backToOrders")}
      </Link>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400">
              {t("pawmart.account.orderId")}
            </p>
            <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
              #{order._id.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500">
              {t("pawmart.account.created")}: {fmt(order.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge type="payment" value={order.paymentStatus} />
            <StatusBadge type="order" value={order.orderStatus} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => printOrderInvoice(order, invoiceLabels, locale)}
          >
            <Printer size={15} /> {t("pawmart.account.printInvoice")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadOrderInvoice(order, invoiceLabels, locale)}
          >
            <Download size={15} /> {t("pawmart.account.exportInvoice")}
          </Button>
          <Button
            type="button"
            size="sm"
            loading={reorderMutation.isPending}
            onClick={() => reorderMutation.mutate()}
          >
            <ShoppingCart size={15} /> {t("pawmart.account.reorder")}
          </Button>
        </div>
      </div>

      {canShowRewardCta && (
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 p-[1px] shadow-[0_24px_70px_-34px_rgba(249,115,22,0.85)]">
          <div className="relative overflow-hidden rounded-[calc(1.75rem-1px)] bg-white/90 p-5 dark:bg-gray-900/90">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-300/30 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300">
                  <Gift size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-950 dark:text-white">
                    {t("pawmart.account.rewardCtaTitle", {
                      count: reward?.spinBalance ?? 0,
                    })}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("pawmart.account.rewardCtaDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/rewards/wheel">
                  <Button>
                    <RotateCcw size={16} /> {t("pawmart.account.spinNow")}
                  </Button>
                </Link>
                <Link to="/my-account/orders">
                  <Button variant="outline">
                    {t("pawmart.account.later")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <Package size={16} className="text-amber-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t("pawmart.account.orderItems")}
              </h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <img
                    src={getImageUrl(item.imageUrl)}
                    alt={item.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("pawmart.checkout.qty")}: {item.quantity}
                    </p>
                    <div className="mt-2">
                      <OrderItemReviewAction order={order} item={item} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(item.price)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4 text-right dark:border-gray-800">
              <p className="text-sm text-gray-500">
                {t("pawmart.account.total")}
              </p>
              <p className="text-xl font-bold text-amber-600">
                {formatPrice(order.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <MapPin size={15} className="text-amber-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t("pawmart.account.shippingAddress")}
              </h4>
            </div>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.shippingAddress.fullName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {order.shippingAddress.phone}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {order.shippingAddress.detailAddress},{" "}
              {order.shippingAddress.ward}, {order.shippingAddress.district},{" "}
              {order.shippingAddress.province}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard size={15} className="text-amber-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t("pawmart.account.paymentInfo")}
              </h4>
            </div>
            {/* <p className="text-sm text-gray-600 dark:text-gray-300">Method: {order.paymentMethod === "cash" ? "Cash on Delivery" : "Banking transfer"}</p> */}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("pawmart.account.method")}:{" "}
              {order.paymentMethod === "cash"
                ? t("pawmart.payment.cash")
                : order.paymentMethod === "vnpay"
                  ? t("pawmart.payment.vnpay")
                  : t("pawmart.payment.banking")}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("pawmart.account.status")}: {order.paymentStatus}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex items-center gap-2">
              <Truck size={15} className="text-amber-500" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t("pawmart.account.timeline")}
              </h4>
            </div>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              <li>
                {t("pawmart.account.confirmed")}: {fmt(order.confirmedAt)}
              </li>
              <li>
                {t("pawmart.account.shippingStarted")}:{" "}
                {fmt(order.shippingStartedAt)}
              </li>
              <li>
                {t("pawmart.account.estimatedDelivery")}:{" "}
                {fmt(order.estimatedDeliveryAt)}
              </li>
              <li>
                {t("pawmart.account.delivered")}: {fmt(order.deliveredAt)}
              </li>
              <li>
                {t("pawmart.account.completed")}: {fmt(order.completedAt)}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
