import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  AlertTriangle, TrendingUp, PackageX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCartApi } from "@/hooks/useCartApi";
import { cartService } from "@/services/cart.service";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CartApiItem } from "@/types";

function ItemFlags({ item }: { item: CartApiItem }) {
  const flags = item.flags;
  if (!flags.priceChanged && !flags.outOfStock && !flags.inactiveProduct) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {flags.priceChanged && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <TrendingUp size={10} /> Price changed
        </span>
      )}
      {flags.outOfStock && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <PackageX size={10} /> Out of stock
        </span>
      )}
      {flags.inactiveProduct && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <AlertTriangle size={10} /> Unavailable
        </span>
      )}
    </div>
  );
}

export default function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, totals, totalItems, remove, updateQty, clear, isLoading } = useCartApi();
  const [isValidating, setIsValidating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds((current) => {
      const availableIds = new Set(items.map((item) => item.productId.toString()));
      const next = new Set([...current].filter((id) => availableIds.has(id)));

      if (current.size === 0) {
        items.forEach((item) => next.add(item.productId.toString()));
      }

      return next;
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.productId.toString())),
    [items, selectedIds],
  );

  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.priceAtAdd * item.quantity,
    0,
  );
  const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const toggleItem = (productId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((current) => {
      if (current.size === items.length) return new Set();
      return new Set(items.map((item) => item.productId.toString()));
    });
  };

  const handleCheckout = async () => {
    setIsValidating(true);
    try {
      const result = await cartService.validateCart();
      const selectedIssueCount = result.issues.filter((issue) =>
        selectedIds.has(issue.productId.toString()),
      ).length;

      if (selectedItems.length === 0) {
        import("sonner").then(({ toast }) => {
          toast.warning("Please select at least one item to checkout.");
        });
      } else if (selectedIssueCount === 0) {
        navigate("/checkout", {
          state: { selectedCartItemIds: selectedItems.map((item) => item.productId.toString()) },
        });
      } else {
        // Issues are now reflected in cart items via flags after validate
        // Just show a toast and let the UI update
        import("sonner").then(({ toast }) => {
          toast.warning(
            `${selectedIssueCount} selected item${selectedIssueCount > 1 ? "s" : ""} need attention before checkout.`,
            { description: "Please review the flagged items below." }
          );
        });
      }
    } catch {
      import("sonner").then(({ toast }) => toast.error("Failed to validate cart"));
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          title={t("cart.empty", "Your cart is empty")}
          description={t("cart.emptyDesc", "Looks like you haven't added any pet food yet!")}
          action={
            <Link to="/products">
              <Button>
                {t("cart.continueShopping", "Browse Products")} <ArrowRight size={16} />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const shipping = selectedSubtotal >= 500_000 || selectedSubtotal === 0 ? 0 : 30_000;
  const orderTotal = selectedSubtotal + shipping;
  const hasIssues = items.some(
    (i) => i.flags.priceChanged || i.flags.outOfStock || i.flags.inactiveProduct
  );
  const selectedHasIssues = selectedItems.some(
    (i) => i.flags.priceChanged || i.flags.outOfStock || i.flags.inactiveProduct
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
          {t("cart.title", "Shopping Cart")}
          <span className="ml-2 text-lg font-normal text-gray-400">
            ({totalItems} {t("cart.items", "items")})
          </span>
        </h1>
        <button
          onClick={clear}
          className="text-sm text-red-400 transition-colors hover:text-red-500"
        >
          {t("cart.clearAll", "Clear all")}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm dark:border-amber-900/40 dark:bg-amber-900/20">
        <label className="inline-flex cursor-pointer items-center gap-2 font-medium text-gray-800 dark:text-gray-100">
          <input
            type="checkbox"
            checked={items.length > 0 && selectedIds.size === items.length}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
          />
          Select all items
        </label>
        <span className="text-gray-600 dark:text-gray-300">
          {selectedItems.length} selected for checkout, unselected items stay in your cart.
        </span>
      </div>

      {/* Issues banner */}
      {hasIssues && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Some items need attention.</span>{" "}
            Review flagged items before proceeding to checkout.
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="space-y-4 lg:col-span-2">
          <AnimatePresence>
            {items.map((item) => {
              const hasFlag = item.flags.priceChanged || item.flags.outOfStock || item.flags.inactiveProduct;
              return (
                <motion.div
                  key={item.productId.toString()}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-gray-900 ${
                    hasFlag
                      ? "border-amber-200 dark:border-amber-800"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.productId.toString())}
                      onChange={() => toggleItem(item.productId.toString())}
                      className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                      aria-label={`Select ${item.productName} for checkout`}
                    />
                  </div>
                  <Link to={`/products/${item.productId}`} className="shrink-0">
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.productName}
                      className="h-20 w-20 rounded-xl object-cover sm:h-24 sm:w-24"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/100x100/fef3c7/92400e?text=🐾";
                      }}
                    />
                  </Link>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/products/${item.productId}`}
                          className="text-sm font-semibold text-gray-900 hover:text-amber-500 dark:text-gray-100 dark:hover:text-amber-400"
                        >
                          {item.productName}
                        </Link>
                        <ItemFlags item={item} />
                      </div>
                      <button
                        onClick={() => remove(item.productId.toString())}
                        className="shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-500">
                        {formatPrice(item.priceAtAdd)}
                      </span>
                      {item.flags.priceChanged && (
                        <span className="text-xs text-gray-400 line-through">
                          (snapshot)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                        <button
                          onClick={() => updateQty(item.productId.toString(), item.quantity - 1)}
                          disabled={item.quantity <= 1 || item.flags.outOfStock}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-gray-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId.toString(), item.quantity + 1)}
                          disabled={item.flags.outOfStock || item.flags.inactiveProduct}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatPrice(item.priceAtAdd * item.quantity)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">
              {t("cart.order_summary", "Order Summary")}
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{t("cart.subtotal", "Subtotal")} ({totalItems} items)</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-800 dark:text-gray-200">
                <span>Selected subtotal ({selectedTotalItems} items)</span>
                <span>{formatPrice(selectedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{t("cart.shipping", "Shipping")}</span>
                <span className={shipping === 0 ? "font-medium text-emerald-500" : ""}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Add {formatPrice(500_000 - selectedSubtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
                <div className="flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>{t("cart.total", "Total")}</span>
                  <span className="text-lg text-amber-500">{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={handleCheckout}
              loading={isValidating}
              disabled={(selectedItems.length === 0 || (selectedHasIssues && !isValidating)) && !isValidating}
            >
              {isValidating ? "Đang chuyển đến thanh toán..." : (
                <>
                  {t("cart.checkout", "Proceed to Checkout")} <ArrowRight size={16} />
                </>
              )}
            </Button>

            {selectedHasIssues && (
              <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                Please resolve selected flagged items to checkout
              </p>
            )}

            <Link
              to="/products"
              className="mt-3 block text-center text-sm text-gray-500 hover:text-amber-500 dark:text-gray-400"
            >
              {t("cart.continueShopping", "Continue Shopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
