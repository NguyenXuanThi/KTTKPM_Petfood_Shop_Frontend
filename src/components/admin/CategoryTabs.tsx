import { Category } from "@/types";
import { cn } from "@/lib/utils";

type CategoryTabItem = Category & { depth: number };

interface CategoryTabsProps {
  categories: CategoryTabItem[];
  selectedCategoryId: string;
  onSelect: (category: CategoryTabItem) => void;
}

const getCategoryId = (category: Pick<Category, "_id" | "id">) =>
  category._id ?? category.id;

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelect,
}: CategoryTabsProps) {
  if (!categories.length) return null;

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Tab loại product
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chọn tab để chỉ xem product của loại đó.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const categoryId = getCategoryId(category);
          const isActive = categoryId === selectedCategoryId;

          return (
            <button
              key={categoryId}
              type="button"
              onClick={() => onSelect(category)}
              className={cn(
                "shrink-0 rounded-2xl border px-4 py-2 text-left text-sm transition-all",
                isActive
                  ? "border-amber-300 bg-amber-50 font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800",
              )}
            >
              <span className="block whitespace-nowrap">
                {category.depth > 0 ? `${"↳ ".repeat(category.depth)}` : ""}
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


