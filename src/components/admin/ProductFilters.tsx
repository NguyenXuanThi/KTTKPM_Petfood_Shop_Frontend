import { ArrowUpDown, Plus, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface ProductFiltersProps {
  selectedCategoryName: string;
  total: number;
  search: string;
  sortValue: string;
  addProductHref: string;
  isFetching?: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClearFilters: () => void;
}

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Mới nhất trước" },
  { value: "name:asc", label: "Tên A → Z" },
  { value: "price:asc", label: "Giá thấp → cao" },
  { value: "price:desc", label: "Giá cao → thấp" },
];

export function ProductFilters({
  selectedCategoryName,
  total,
  search,
  sortValue,
  addProductHref,
  isFetching = false,
  onSearchChange,
  onSortChange,
  onClearFilters,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedCategoryName}
            </h2>
            <Badge variant="info">Danh mục đang chọn</Badge>
            {isFetching && <Badge variant="outline">Đang cập nhật...</Badge>}
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total} product trong danh mục này.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <Sparkles size={14} />
            Xóa bộ lọc
          </Button>
          <Link to={addProductHref}>
            <Button size="sm">
              <Plus size={14} />
              Thêm Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr),220px]">
        <Input
          placeholder={`Tìm trong ${selectedCategoryName.toLowerCase()}...`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={<Search size={14} />}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sắp xếp theo</span>
          <div className="relative">
            <ArrowUpDown
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={sortValue}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>
    </div>
  );
}

