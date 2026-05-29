import { useEffect, useState } from "react";
import {
  useSearchParams,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { CART_KEY } from "@/hooks/useCartApi";
import { cartService } from "@/services/cart.service";
import {
  ShieldCheck,
  CreditCard,
  ArrowLeft,
  Clock,
  Lock,
  CheckCircle,
  ExternalLink,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function VnpayPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const locationState = location.state as {
    paymentUrl?: string;
    orderId?: string;
  } | null;
  const paymentUrl =
    locationState?.paymentUrl || searchParams.get("paymentUrl") || "";
  const initialOrderId =
    locationState?.orderId || searchParams.get("orderId") || "";

  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "success" | "failed"
  >("idle");
  const [completedOrderId, setCompletedOrderId] = useState(initialOrderId);

  useEffect(() => {
    let done = false;

    const handleResult = async (result: {
      status: "success" | "failed";
      orderId?: string;
      ts: number;
    }) => {
      if (done) return;
      if (Date.now() - result.ts > 120_000) return;
      done = true;

      localStorage.removeItem("vnpay_result");

      if (result.orderId) setCompletedOrderId(result.orderId);

      if (result.status === "success") {
        setPaymentStatus("success");
        try {
          await cartService.clearCart();
          queryClient.setQueryData([CART_KEY], {
            items: [],
            totals: { subtotal: 0, totalItems: 0 },
          });
        } catch {
          /* silent */
        }
      } else {
        setPaymentStatus("failed");
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("vnpay_result");
      bc.onmessage = (e) => handleResult(e.data);
    } catch {
      /* not supported */
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "vnpay_result" || !e.newValue) return;
      try {
        handleResult(JSON.parse(e.newValue));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", handleStorage);

    const poll = setInterval(() => {
      const raw = localStorage.getItem("vnpay_result");
      if (!raw) return;
      try {
        handleResult(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => {
      bc?.close();
      window.removeEventListener("storage", handleStorage);
      clearInterval(poll);
    };
  }, [queryClient]);

  if (!paymentUrl && paymentStatus === "idle") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{t("pawmart.vnpay.invalidSession")}</p>
        <Link to="/cart" className="text-sm text-amber-500 underline">
          {t("pawmart.vnpay.backToCart")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-amber-50/30 px-4 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-md">
        <Link
          to="/my-account/orders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-500 dark:text-gray-400"
        >
          <ArrowLeft size={14} /> {t("pawmart.vnpay.viewMyOrders")}
        </Link>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div
            className={`px-6 py-5 text-white ${
              paymentStatus === "success"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                : "bg-gradient-to-r from-red-500 to-red-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/20 p-2">
                {paymentStatus === "success" ? (
                  <CheckCircle size={22} />
                ) : (
                  <CreditCard size={22} />
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  {t("pawmart.vnpay.title")}
                </h1>
                <p className="text-xs text-white/80">
                  {paymentStatus === "success"
                    ? t("pawmart.vnpay.successSubtitle")
                    : t("pawmart.vnpay.secureSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 text-center">
            {paymentStatus === "success" ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("pawmart.vnpay.successTitle")}
                </h2>
                {completedOrderId && (
                  <div className="mt-2 rounded-xl bg-gray-50 px-6 py-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("pawmart.vnpay.yourOrderId")}
                    </p>
                    <p className="font-mono text-lg font-bold text-amber-500">
                      #{completedOrderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("pawmart.vnpay.successDesc")}
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    navigate(`/my-account/orders/${completedOrderId}`)
                  }
                >
                  {t("pawmart.vnpay.viewOrderDetail")}
                </Button>
              </div>
            ) : paymentStatus === "failed" ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle size={40} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("pawmart.vnpay.failedTitle")}
                </h2>
                {completedOrderId && (
                  <div className="mt-2 rounded-xl bg-gray-50 px-6 py-3 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("pawmart.vnpay.orderId")}
                    </p>
                    <p className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                      #{completedOrderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("pawmart.vnpay.failedDesc")}
                </p>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() =>
                    navigate(`/my-account/orders/${completedOrderId}`)
                  }
                >
                  {t("pawmart.vnpay.reviewOrder")}
                </Button>
              </div>
            ) : (
              <>
                {initialOrderId && (
                  <div className="mb-5 rounded-xl bg-gray-50 px-4 py-3 text-left dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("pawmart.vnpay.orderId")}
                    </p>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      #{initialOrderId.slice(-8).toUpperCase()}
                    </p>
                  </div>
                )}

                <div className="mb-6 space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      1
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <Trans
                        i18nKey="pawmart.vnpay.stepOpenGateway"
                        values={{ action: t("pawmart.vnpay.openGateway") }}
                        components={{
                          action: (
                            <span className="font-semibold text-red-500" />
                          ),
                        }}
                      />
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      2
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("pawmart.vnpay.stepComplete")}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      3
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("pawmart.vnpay.stepReturn")}
                    </p>
                  </div>
                </div>

                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
                >
                  <ExternalLink size={20} />
                  {t("pawmart.vnpay.openGateway")}
                </a>

                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Lock size={11} /> {t("pawmart.vnpay.ssl")}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={11} /> {t("pawmart.vnpay.safe")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {t("pawmart.vnpay.instant")}
                  </span>
                </div>
              </>
            )}
          </div>

          {paymentStatus === "idle" && (
            <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {t("pawmart.vnpay.doNotClose")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
