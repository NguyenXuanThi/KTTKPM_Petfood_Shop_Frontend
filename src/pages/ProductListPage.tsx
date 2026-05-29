import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { useCategoryList } from "@/hooks/useCategories";
import { ProductGrid } from "@/components/product/ProductGrid";
import { FilterSidebar } from "@/components/product/FilterSidebar";
import { Pagination } from "@/components/ui/Pagination";
import { RECOMMENDATIONS_KEY } from "@/hooks/useRecommendations";
import { Button } from "@/components/ui/Button";

interface FilterState {
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const searchFromUrl =
    searchParams.get("q") ?? searchParams.get("search") ?? "";
  const categoryIdFromUrl = searchParams.get("categoryId") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    categoryId: categoryIdFromUrl,
    minPrice: "",
    maxPrice: "",
    sortBy: "",
  });

  const { data: catData } = useCategoryList({ limit: 100, isActive: true });
  const categories = catData?.items ?? [];

  const [sortBy, sortOrder] = (filters.sortBy || "createdAt:desc").split(
    ":",
  ) as ["createdAt" | "price" | "name", "asc" | "desc"];

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    keyword: searchFromUrl || undefined,
    categoryId: filters.categoryId || undefined,
    sortBy,
    sortOrder,
  });

  useEffect(() => {
    if (!searchFromUrl || isLoading) return;

    queryClient.invalidateQueries({
      queryKey: [RECOMMENDATIONS_KEY, "products"],
    });

    const timer = window.setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: [RECOMMENDATIONS_KEY, "products"],
      });
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [searchFromUrl, isLoading, queryClient]);

  useEffect(() => {
    setSearchInput((prev) => (prev === searchFromUrl ? prev : searchFromUrl));
    setFilters((prev) =>
      prev.categoryId === categoryIdFromUrl
        ? prev
        : { ...prev, categoryId: categoryIdFromUrl },
    );
  }, [searchFromUrl, categoryIdFromUrl]);

  useEffect(() => {
    setPage(1);
  }, [searchFromUrl, filters]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.search]);

  const submitSearch = (keyword: string) => {
    const trimmed = keyword.trim();
    const params: Record<string, string> = {};
    if (trimmed) params.q = trimmed;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    setSearchParams(params);
    queryClient.invalidateQueries({
      queryKey: [RECOMMENDATIONS_KEY, "products"],
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    const params: Record<string, string> = {};
    if (filters.categoryId) params.categoryId = filters.categoryId;
    setSearchParams(params);
  };

  const products = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
            {searchFromUrl
              ? t("pawmart.search.resultsFor", { keyword: searchFromUrl })
              : t("pawmart.products.title")}
          </h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {total} {t("pawmart.products.found")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 sm:w-72">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t("pawmart.search.productPlaceholder")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-20 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t("pawmart.common.clearKeyword")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                aria-label={t("pawmart.common.search")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
              >
                {t("pawmart.common.search")}
              </button>
            </form>
          </div>

          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
          >
            <SlidersHorizontal size={16} />
            {t("pawmart.products.filters")}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
          />
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 overflow-y-auto bg-white p-6 shadow-xl dark:bg-gray-950">
              <FilterSidebar
                filters={filters}
                onFilterChange={(nextFilters) => {
                  setFilters(nextFilters);
                  setSidebarOpen(false);
                }}
                categories={categories}
              />
            </div>
          </div>
        )}

        <div className="flex-1 space-y-6">
          {!searchFromUrl && !filters.categoryId && (
            <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-gray-950">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-600">
                    {t("pawmart.products.discoverToday")}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {t("pawmart.products.newAndPopular")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("pawmart.products.searchHint")}
                  </p>
                </div>
                <Link to="/products">
                  <Button variant="outline" size="sm">
                    {t("pawmart.products.viewAll")} <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <ProductGrid
            products={products}
            isLoading={isLoading}
            skeletonCount={12}
          />

          {!isLoading && totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
