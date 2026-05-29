import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { useProducts } from "@/hooks/useProducts";
import { useProductRecommendations } from "@/hooks/useRecommendations";
import { RecommendationSource } from "@/types";
import { useTranslation } from "react-i18next";

const subtitleKeys: Record<RecommendationSource, string> = {
  best_seller: "pawmart.recommendations.subtitles.bestSeller",
  viewed: "pawmart.recommendations.subtitles.viewed",
  searched: "pawmart.recommendations.subtitles.searched",
};

export function RecommendationSection() {
  const { t } = useTranslation();
  const { data, isLoading, isFetching, isError, refetch } =
    useProductRecommendations();
  const { data: fallbackData, isLoading: isFallbackLoading } = useProducts(
    {
      limit: 4,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: isError,
    },
  );

  const recommendationProducts = (data?.products || []).slice(0, 4);
  const fallbackProducts = fallbackData?.items || [];
  const products = isError ? fallbackProducts : recommendationProducts;
  const source = isError ? "best_seller" : data?.source || "best_seller";
  const showLoading = isLoading || isFetching || (isError && isFallbackLoading);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!data) return;
    console.log("[frontend] recommendation source", data?.source);
    console.log(
      "[frontend] recommendation productIds",
      data?.products?.map((product) => product._id),
    );
  }, [data]);

  if (!showLoading && !products.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/70 to-orange-50 p-5 shadow-sm dark:border-amber-900/40 dark:from-gray-950 dark:via-amber-950/20 dark:to-gray-900 md:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Sparkles size={14} />
              {t("pawmart.recommendations.badge")}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              {t("pawmart.recommendations.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t(subtitleKeys[source])}
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" size="sm">
              {t("pawmart.recommendations.viewMore")} <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {isError && !fallbackProducts.length && !isFallbackLoading ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 p-6 text-center dark:border-amber-900/40 dark:bg-gray-950/60">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("pawmart.recommendations.loadFailed")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("pawmart.recommendations.fallback")}
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              {t("pawmart.recommendations.retry")}
            </Button>
          </div>
        ) : (
          <ProductGrid
            products={products}
            isLoading={showLoading}
            skeletonCount={4}
            emptyTitle={t("pawmart.recommendations.emptyTitle")}
            emptyDescription={t("pawmart.recommendations.emptyDesc")}
          />
        )}
      </div>
    </section>
  );
}
