import { Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Product } from "@/types";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  categoryName: string;
  selectedCategoryId: string;
  returnTo: string;
  onDelete: (product: Product) => void;
}

function ProductTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid grid-cols-[minmax(0,1.8fr),0.8fr,0.6fr,0.7fr,0.7fr] gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function ProductTable({
  products,
  isLoading = false,
  categoryName,
  selectedCategoryId,
  returnTo,
  onDelete,
}: ProductTableProps) {
  const editQuery = `?categoryId=${encodeURIComponent(selectedCategoryId)}&returnTo=${encodeURIComponent(
    returnTo
  )}`;

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {isLoading ? (
        <ProductTableSkeleton />
      ) : products.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
            Chưa có product trong {categoryName}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thêm product đầu tiên để bắt đầu quản lý danh mục này.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                {[
                  "Product",
                  "Giá",
                  "Tồn kho",
                  "Trạng thái",
                  "Thao tác",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {products.map((product, index) => (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(product.imageUrl)}
                        alt={product.name}
                        className="h-11 w-11 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/64x64/fef3c7/92400e?text=P";
                        }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">{product._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-500">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        product.stock === 0
                          ? "text-sm font-medium text-red-500"
                          : product.stock <= 5
                            ? "text-sm font-medium text-amber-500"
                            : "text-sm font-medium text-gray-700 dark:text-gray-300"
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? "success" : "danger"}>
                      {product.isActive ? "Đang hoạt động" : "Không hoạt động"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/products/${product._id}`} target="_blank">
                        <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                          <Eye size={14} />
                        </button>
                      </Link>
                      <Link to={`/admin/products/${product._id}/edit${editQuery}`}>
                        <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20">
                          <Pencil size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

