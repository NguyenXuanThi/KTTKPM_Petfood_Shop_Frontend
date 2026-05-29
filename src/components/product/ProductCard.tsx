import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice, getImageUrl, truncate } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { WishlistButton } from "./WishlistButton";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { t } = useTranslation();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product._id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Wishlist button */}
      <WishlistButton
        productId={product._id}
        productName={product.name}
        size={15}
        className="absolute right-3 top-3 z-10 h-8 w-8"
      />

      {/* Stock badge */}
      {product.stock === 0 && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant="danger">{t("pawmart.products.outOfStock")}</Badge>
        </div>
      )}
      {product.stock > 0 && product.stock <= 5 && (
        <div className="absolute left-3 top-3 z-10">
          <Badge variant="warning">
            {t("pawmart.products.onlyLeft", { count: product.stock })}
          </Badge>
        </div>
      )}

      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        className="block overflow-hidden rounded-t-2xl"
      >
        <img
          src={getImageUrl(product.imageUrl)}
          alt={product.name}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x400/fef3c7/92400e?text=PawMart";
          }}
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-sm font-semibold leading-snug text-gray-900 transition-colors hover:text-amber-500 dark:text-gray-100 dark:hover:text-amber-400">
            {truncate(product.name, 50)}
          </h3>
        </Link>

        {(product.rating ?? 0) > 0 && (
          <Rating
            value={product.rating ?? 0}
            size="sm"
            showValue
            reviewCount={product.reviewCount}
          />
        )}

        <p className="mt-auto text-lg font-bold text-amber-600 dark:text-amber-400">
          {formatPrice(product.price)}
        </p>

        <Button
          variant={inCart ? "secondary" : "primary"}
          size="sm"
          disabled={product.stock === 0}
          onClick={() => addItem(product)}
          className="w-full"
        >
          <ShoppingCart size={14} />
          {inCart
            ? t("pawmart.products.inCart")
            : t("pawmart.products.addToCart")}
        </Button>
      </div>
    </motion.div>
  );
}
