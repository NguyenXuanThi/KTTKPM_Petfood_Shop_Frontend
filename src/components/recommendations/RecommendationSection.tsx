import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { useProducts } from "@/hooks/useProducts";
import { useProductRecommendations } from "@/hooks/useRecommendations";
import { RecommendationSource } from "@/types";

const subtitles: Record<RecommendationSource, string> = {
  best_seller: "Những sản phẩm đang được nhiều khách hàng quan tâm",
  viewed: "Dựa trên sản phẩm bạn vừa xem",
  searched: "Dựa trên tìm kiếm gần đây của bạn",
};

export function RecommendationSection() {
  const { data, isLoading, isFetching, isError, refetch } =
    useProductRecommendations();
  const {
    data: fallbackData,
    isLoading: isFallbackLoading,
  } = useProducts(
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
              Cá nhân hóa
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
              Gợi ý dành cho bạn
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {subtitles[source]}
            </p>
          </div>
          <Link to="/products">
            <Button variant="outline" size="sm">
              Xem thêm <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {isError && !fallbackProducts.length && !isFallbackLoading ? (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white/70 p-6 text-center dark:border-amber-900/40 dark:bg-gray-950/60">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Chưa tải được gợi ý lúc này.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Bạn vẫn có thể xem các product nổi bật trong cửa hàng.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <ProductGrid
            products={products}
            isLoading={showLoading}
            skeletonCount={4}
            emptyTitle="Chưa có gợi ý phù hợp"
            emptyDescription="Hãy xem hoặc tìm kiếm product để hệ thống gợi ý tốt hơn."
          />
        )}
      </div>
    </section>
  );
}
