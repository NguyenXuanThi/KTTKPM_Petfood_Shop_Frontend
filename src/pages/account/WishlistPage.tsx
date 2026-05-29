import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useWishlistQuery, useToggleWishlist } from "@/hooks/useWishlistApi";
import { useCartApi } from "@/hooks/useCartApi";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function WishlistSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-72 rounded-2xl" />
      ))}
    </div>
  );
}

export default function AccountWishlistPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useWishlistQuery();
  const { toggle, isPending } = useToggleWishlist();
  const { addItem } = useCartApi();

  const items = data?.items ?? [];

  if (isLoading) return <WishlistSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={32} className="text-red-400" />}
        title={t("pawmart.wishlist.emptyTitle")}
        description={t("pawmart.wishlist.emptyDesc")}
        action={
          <Link to="/products">
            <Button>
              {t("pawmart.wishlist.browseProducts")} <ArrowRight size={14} />
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {t("pawmart.wishlist.title")}{" "}
          <span className="ml-1 text-sm font-normal text-gray-400">
            ({items.length})
          </span>
        </h2>
        <Link
          to="/products"
          className="text-sm font-medium text-amber-500 hover:underline"
        >
          {t("pawmart.wishlist.continueShopping")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {items.map(({ productId, product }) => {
            const inStock = (product?.stock ?? 0) > 0;

            return (
              <motion.div
                key={productId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 0.15 },
                }}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Image */}
                <div className="relative overflow-hidden">
                  <Link to={`/products/${productId}`}>
                    <img
                      src={getImageUrl(product?.imageUrl ?? "")}
                      alt={product?.name}
                      className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x300/fef3c7/92400e?text=🐾";
                      }}
                    />
                  </Link>

                  {/* Remove button */}
                  <button
                    onClick={() => toggle(productId, product?.name)}
                    disabled={isPending}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:bg-gray-900/90"
                    aria-label={t("pawmart.wishlist.remove")}
                  >
                    <Trash2 size={14} />
                  </button>

                  {!inStock && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {t("pawmart.wishlist.outOfStock")}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <Link
                    to={`/products/${productId}`}
                    className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-amber-600 dark:text-white"
                  >
                    {product?.name ?? t("pawmart.wishlist.unknownProduct")}
                  </Link>
                  <p className="mt-2 text-lg font-bold text-amber-500">
                    {formatPrice(product?.price ?? 0)}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={!inStock || !product}
                    onClick={() => {
                      if (product) addItem(product, 1);
                    }}
                  >
                    <ShoppingCart size={14} />
                    {inStock
                      ? t("pawmart.wishlist.addToCart")
                      : t("pawmart.wishlist.outOfStock")}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
