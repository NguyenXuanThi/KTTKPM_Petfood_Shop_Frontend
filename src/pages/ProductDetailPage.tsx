import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  ArrowLeft,
  Minus,
  Plus,
  Share2,
  Tag,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ProductDetailSkeleton } from "@/components/ui/Skeleton";
import { ReviewSection } from "@/components/review/ReviewSection";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(id ?? "");
  const { addItem, getItemQuantity, updateQty, isInCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-6">
        <p className="text-6xl">😿</p>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Product not found
        </h2>
        <Link
          to="/products"
          className="mt-4 inline-block text-amber-500 hover:underline"
        >
          ← Back to products
        </Link>
      </div>
    );
  }

  const inCart = isInCart(product._id);
  const wishlisted = isWishlisted(product._id);
  const cartQty = getItemQuantity(product._id);
  const averageRating = product.averageRating ?? product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const handleAddToCart = () => {
    addItem(product, qty);
  };

  const handleBuyNow = () => {
    const checkoutState = {
      mode: "buy_now" as const,
      sourceProductId: product._id,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: qty,
        },
      ],
    };

    sessionStorage.setItem("directBuyCheckout", JSON.stringify(checkoutState));
    navigate("/checkout", { state: checkoutState });
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      {/* Breadcrumb */}
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-amber-500 dark:text-gray-400"
      >
        <ArrowLeft size={14} /> Back to products
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <img
              src={getImageUrl(product.imageUrl)}
              alt={product.name}
              className="aspect-square w-full object-contain p-6"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/600x600/fef3c7/92400e?text=PawMart";
              }}
            />
          </div>
          <button
            onClick={() => toggle(product._id, product.name)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 dark:bg-gray-800/90"
          >
            <Heart
              size={18}
              className={wishlisted ? "text-red-500" : "text-gray-400"}
              fill={wishlisted ? "currentColor" : "none"}
            />
          </button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-5"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {!product.isActive && <Badge variant="danger">Inactive</Badge>}
              {product.stock === 0 ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : product.stock <= 5 ? (
                <Badge variant="warning">Only {product.stock} left</Badge>
              ) : (
                <Badge variant="success">In Stock ({product.stock})</Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-gray-900 dark:text-white">
              {product.name}
            </h1>
            {reviewCount > 0 && (
              <div className="mt-2">
                <Rating
                  value={averageRating}
                  size="md"
                  showValue
                  reviewCount={reviewCount}
                />
              </div>
            )}
          </div>

          <div className="text-4xl font-bold text-amber-500">
            {formatPrice(product.price)}
          </div>

          {product.description && (
            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity selector */}
          {product.stock > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    disabled={qty <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-sm font-semibold text-gray-900 dark:text-white">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    disabled={qty >= product.stock}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {inCart && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {cartQty} already in cart
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full"
            >
              <ShoppingCart size={18} />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="w-full"
            >
              <Zap size={18} />
              Mua ngay
            </Button>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 size={18} />
            </Button>
          </div>

          {/* Details */}
          <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-amber-500" />
              <span className="text-gray-500 dark:text-gray-400">
                Product ID:
              </span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {product._id}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Slug:</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {product.slug}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <ReviewSection productId={product._id} canReview={true} />
    </div>
  );
}
