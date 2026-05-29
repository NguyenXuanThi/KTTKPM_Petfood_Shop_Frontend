import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BellRing,
  ChevronRight,
  CreditCard,
  Download,
  Package,
  Printer,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";
import { orderService } from "@/services/order.service";
import { cartService } from "@/services/cart.service";
import { Order } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CART_KEY } from "@/hooks/useCartApi";
import { useTranslation } from "react-i18next";
import {
  downloadOrderInvoice,
  InvoiceLabels,
  printOrderInvoice,
} from "@/lib/orderInvoice";

const fmt = (v: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(v));

const paymentLabel: Record<string, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  waiting_verify: "Waiting verify",
  paid: "Paid",
  failed: "Failed",
  expired: "Expired",
};

const orderLabel: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipping: "Shipping",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const DISMISSED_ARRIVAL_KEY = "dismissedArrivalOrderIds";

const loadDismissedArrivalOrderIds = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_ARRIVAL_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set<string>();
  }
};

const saveDismissedArrivalOrderIds = (ids: Set<string>) => {
  localStorage.setItem(DISMISSED_ARRIVAL_KEY, JSON.stringify([...ids]));
};

function getCountdown(target: string | null | undefined, now: dayjs.Dayjs) {
  if (!target) return "";
  const diff = dayjs(target).diff(now, "second");
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function OrdersPage({
  onlyShipping = false,
  title,
  icon = <Package size={18} />,
  emptyIcon = <Package size={30} />,
}: {
  onlyShipping?: boolean;
  title?: string;
  icon?: React.ReactNode;
  emptyIcon?: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const pageTitle =
    title ??
    (onlyShipping
      ? t("pawmart.account.shippingOrders")
      : t("pawmart.account.myOrders"));
  const [arrivalDialogOpen, setArrivalDialogOpen] = useState(false);
  const [arrivalOrderId, setArrivalOrderId] = useState<string | null>(null);
  const [dismissedArrivalOrderIds, setDismissedArrivalOrderIds] = useState<
    Set<string>
  >(() => loadDismissedArrivalOrderIds());
  const [now, setNow] = useState(() => dayjs());
  const queryClient = useQueryClient();
  const locale =
    i18n.language?.startsWith("jp") || i18n.language?.startsWith("ja")
      ? "ja-JP"
      : i18n.language?.startsWith("en")
        ? "en-US"
        : "vi-VN";
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

  useEffect(() => {
    const id = window.setInterval(() => setNow(dayjs()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: [onlyShipping ? "orders-shipping" : "orders-all"],
    queryFn: () =>
      onlyShipping
        ? orderService.getMyShippingOrders()
        : orderService.getMyOrders(),
  });

  const orders = data ?? [];
  const pendingBankingOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.paymentMethod === "banking" &&
          order.orderStatus === "pending" &&
          order.paymentStatus === "pending",
      ),
    [orders],
  );

  const cancelBankingMutation = useMutation({
    mutationFn: (orderId: string) =>
      orderService.cancelMyBankingOrder(
        orderId,
        "Customer cancelled unpaid banking order",
      ),
    onSuccess: () => {
      toast.success(t("pawmart.account.bankingCancelled"));
      queryClient.invalidateQueries({
        queryKey: [onlyShipping ? "orders-shipping" : "orders-all"],
      });
      queryClient.invalidateQueries({ queryKey: [CART_KEY] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          t("pawmart.account.cancelBankingFailed"),
      );
    },
  });
  const reorderMutation = useMutation({
    mutationFn: async (order: Order) => {
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

  const arrivedOrder = useMemo(
    () =>
      orders.find(
        (o: Order) =>
          o.orderStatus === "shipping" &&
          o.estimatedDeliveryAt &&
          dayjs(o.estimatedDeliveryAt).isBefore(dayjs()) &&
          !dismissedArrivalOrderIds.has(o._id),
      ),
    [orders, dismissedArrivalOrderIds],
  );

  useEffect(() => {
    if (!arrivedOrder || arrivalDialogOpen) return;
    setArrivalOrderId(arrivedOrder._id);
    setArrivalDialogOpen(true);
  }, [arrivedOrder, arrivalDialogOpen]);

  const closeArrivalDialog = () => {
    if (arrivalOrderId) {
      setDismissedArrivalOrderIds((current) => {
        const next = new Set(current);
        next.add(arrivalOrderId);
        saveDismissedArrivalOrderIds(next);
        return next;
      });
    }

    setArrivalDialogOpen(false);
    setArrivalOrderId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title={t("pawmart.account.cannotLoadOrders")}
        description={t("pawmart.account.tryAgainLater")}
      />
    );
  }

  if (!orders.length) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={
          onlyShipping
            ? t("pawmart.account.noShippingOrders")
            : t("pawmart.account.noOrdersYet")
        }
        description={
          onlyShipping
            ? t("pawmart.account.shippingOrdersDesc")
            : t("pawmart.account.noOrdersDesc")
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white">
          {icon}
          <h2 className="text-lg font-bold">{pageTitle}</h2>
        </div>

        {!onlyShipping && pendingBankingOrders.length > 0 && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {t("pawmart.account.bankingWaitingTitle")}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t("pawmart.account.bankingWaitingDesc")}
                  </p>
                  {pendingBankingOrders[0].expiresAt && (
                    <p className="mt-1 text-xs font-semibold text-blue-800 dark:text-blue-200">
                      {t("pawmart.account.expiresIn", {
                        time: getCountdown(
                          pendingBankingOrders[0].expiresAt,
                          now,
                        ),
                      })}
                    </p>
                  )}
                </div>
              </div>
              <Link
                to={`/payment/upload-proof/${pendingBankingOrders[0]._id}`}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {t("pawmart.account.continueUploadProof")}
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-400">
                    {t("pawmart.account.orderId")}
                  </p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {fmt(order.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge
                    type="payment"
                    value={
                      paymentLabel[order.paymentStatus] ?? order.paymentStatus
                    }
                  />
                  <StatusBadge
                    type="order"
                    value={orderLabel[order.orderStatus] ?? order.orderStatus}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {order.items.slice(0, 2).map((item) => (
                  <div
                    key={`${order._id}-${item.productId}`}
                    className="flex items-center justify-between text-sm"
                  >
                    <p className="line-clamp-1 text-gray-700 dark:text-gray-300">
                      {item.name} x{item.quantity}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-gray-400">
                    {t("pawmart.account.moreItems", {
                      count: order.items.length - 2,
                    })}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {/* <span className="font-medium">Payment:</span> {order.paymentMethod === "cash" ? "Cash on Delivery" : "Banking Transfer"} */}
                  <span className="font-medium">
                    {t("pawmart.account.payment")}:
                  </span>{" "}
                  {order.paymentMethod === "cash"
                    ? t("pawmart.payment.cash")
                    : order.paymentMethod === "vnpay"
                      ? t("pawmart.payment.vnpay")
                      : t("pawmart.payment.banking")}
                  {order.orderStatus === "shipping" &&
                    order.estimatedDeliveryAt && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <Truck size={12} />{" "}
                        {t("pawmart.account.eta", {
                          time: getCountdown(order.estimatedDeliveryAt, now),
                        })}
                      </span>
                    )}
                  {order.paymentMethod === "banking" &&
                    order.paymentStatus === "pending" &&
                    order.expiresAt && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {t("pawmart.account.waitingProof", {
                          time: getCountdown(order.expiresAt, now),
                        })}
                      </span>
                    )}
                  {order.paymentMethod === "banking" &&
                    order.paymentStatus === "expired" && (
                      <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {t("pawmart.account.paymentExpiredRestored")}
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                  {order.paymentMethod === "banking" &&
                    order.orderStatus === "pending" &&
                    order.paymentStatus === "pending" && (
                      <>
                        <Link
                          to={`/payment/upload-proof/${order._id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          {t("pawmart.account.uploadProof")}
                        </Link>
                        <button
                          onClick={() =>
                            cancelBankingMutation.mutate(order._id)
                          }
                          disabled={cancelBankingMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-900/20"
                        >
                          <XCircle size={14} /> {t("pawmart.account.cancel")}
                        </button>
                      </>
                    )}
                  <p className="font-bold text-amber-600">
                    {formatPrice(order.totalAmount)}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      printOrderInvoice(order, invoiceLabels, locale)
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Printer size={14} />{" "}
                    {t("pawmart.account.printInvoiceShort")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadOrderInvoice(order, invoiceLabels, locale)
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Download size={14} />{" "}
                    {t("pawmart.account.exportInvoiceShort")}
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderMutation.mutate(order)}
                    disabled={reorderMutation.isPending}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-60 dark:border-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/20"
                  >
                    <ShoppingCart size={14} />{" "}
                    {t("pawmart.account.reorderShort")}
                  </button>
                  <Link
                    to={`/my-account/orders/${order._id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {t("pawmart.account.view")} <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={arrivalDialogOpen}
        onClose={closeArrivalDialog}
        title={t("pawmart.account.arrivedTitle")}
        size="md"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
            <BellRing />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t("pawmart.account.arrivedDesc")}
          </p>
          <div className="flex justify-center">
            <Button onClick={closeArrivalDialog}>
              {t("pawmart.account.great")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
