import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Category } from "@/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface FilterState {
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories: Category[];
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "createdAt:desc", labelKey: "pawmart.filters.newest" },
  { value: "price:asc", labelKey: "pawmart.filters.priceLowHigh" },
  { value: "price:desc", labelKey: "pawmart.filters.priceHighLow" },
  { value: "name:asc", labelKey: "pawmart.filters.nameAZ" },
];

export function FilterSidebar({
  filters,
  onFilterChange,
  categories,
  isLoading,
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const handleClear = () => {
    onFilterChange({ categoryId: "", minPrice: "", maxPrice: "", sortBy: "" });
  };

  const hasFilters =
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sortBy;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <SlidersHorizontal size={16} className="text-amber-500" />
          {t("pawmart.filters.title")}
        </div>
        {hasFilters && (
          <button
            onClick={handleClear}
            className="text-xs text-amber-500 hover:underline"
          >
            {t("pawmart.filters.clearAll")}
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("pawmart.filters.sortBy")}
        </p>
        <div className="space-y-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange({ ...filters, sortBy: opt.value })}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                filters.sortBy === opt.value
                  ? "bg-amber-50 font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {t(opt.labelKey)}
              {filters.sortBy === opt.value && (
                <div className="h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setCatOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("pawmart.filters.category")}
          {catOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {catOpen && (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => onFilterChange({ ...filters, categoryId: "" })}
              className={cn(
                "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                !filters.categoryId
                  ? "bg-amber-50 font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
              )}
            >
              {t("pawmart.filters.allCategories")}
            </button>
            {isLoading
              ? Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-8 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                  />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      onFilterChange({ ...filters, categoryId: cat.id })
                    }
                    className={cn(
                      "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors",
                      filters.categoryId === cat.id
                        ? "bg-amber-50 font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
          </div>
        )}
      </div>

      {/* Price range */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <button
          onClick={() => setPriceOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {t("pawmart.filters.priceRange")}
          {priceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {priceOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t("pawmart.filters.min")}
                value={filters.minPrice}
                onChange={(e) =>
                  onFilterChange({ ...filters, minPrice: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                type="number"
                placeholder={t("pawmart.filters.max")}
                value={filters.maxPrice}
                onChange={(e) =>
                  onFilterChange({ ...filters, maxPrice: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm focus:border-amber-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  labelKey: "pawmart.filters.under100k",
                  min: "",
                  max: "100000",
                },
                {
                  labelKey: "pawmart.filters.from100to300k",
                  min: "100000",
                  max: "300000",
                },
                {
                  labelKey: "pawmart.filters.from300to500k",
                  min: "300000",
                  max: "500000",
                },
                {
                  labelKey: "pawmart.filters.above500k",
                  min: "500000",
                  max: "",
                },
              ].map((p) => (
                <Button
                  key={p.labelKey}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      minPrice: p.min,
                      maxPrice: p.max,
                    })
                  }
                >
                  {t(p.labelKey)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
