import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  const isSuccess = status === "success";
  const isFailed = status === "failed";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center md:px-6">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full">
        {isSuccess ? (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
        ) : isFailed ? (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <XCircle size={48} className="text-red-500" />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <AlertCircle size={48} className="text-yellow-500" />
          </div>
        )}
      </div>

      {isSuccess ? (
        <>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Payment Successful! 🎉
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Your order{" "}
            {orderId && (
              <span className="font-bold text-amber-500">
                #{orderId.slice(-8).toUpperCase()}
              </span>
            )}{" "}
            has been paid and is being processed. We'll deliver your pet food
            soon! 🐾
          </p>
        </>
      ) : isFailed ? (
        <>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Payment Failed
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Your payment was not completed. Your order is saved — you can try
            again from your orders page.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Invalid Session
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            Something went wrong with your payment session.
          </p>
        </>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <Link to="/account/orders">
          <Button size="lg" className="w-full">
            View My Orders
          </Button>
        </Link>
        <Link
          to="/products"
          className="text-sm text-gray-500 hover:text-amber-500 dark:text-gray-400"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
