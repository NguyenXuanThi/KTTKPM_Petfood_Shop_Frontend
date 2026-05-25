import { useState } from "react";
import { Plus, Pencil, Trash2, Search, Eye, FolderTree } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Product } from "@/types";

export default function AdminProductList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data, isLoading } = useProducts({
    page,
    limit: 10,
    keyword: search || undefined,
  });
  const deleteMutation = useDeleteProduct();

  const products = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Product
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Xem toàn bộ catalog product trên tất cả danh mục.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/categories">
            <Button variant="outline">
              <FolderTree size={16} /> Quản lý theo danh mục
            </Button>
          </Link>
          <Link to="/admin/products/new?returnTo=%2Fadmin%2Fproducts">
            <Button>
              <Plus size={16} /> Thêm Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-300">
        Với catalog lớn, hãy dùng{" "}
        <span className="font-semibold">Categories</span> làm khu vực quản lý chính.
        Trang này là góc nhìn tổng hợp qua mọi danh mục.
      </div>

      {/* Search */}
      <Input
        placeholder="Tìm product..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        leftIcon={<Search size={14} />}
        className="max-w-sm"
      />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl">📦</p>
            <p className="mt-3 font-medium text-gray-500">Không tìm thấy product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  {["Product", "Giá", "Tồn kho", "Trạng thái", "Thao tác"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {products.map((product, i) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getImageUrl(product.imageUrl)}
                          alt={product.name}
                          className="h-10 w-10 rounded-xl object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/50x50/fef3c7/92400e?text=P";
                          }}
                        />
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                          <p className="max-w-[180px] truncate font-mono text-xs text-gray-400">
                            {product._id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-amber-500">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-amber-500" : "text-gray-700 dark:text-gray-300"}`}
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
                        <Link to={`/admin/products/${product._id}/edit`}>
                          <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-900/20">
                            <Pencil size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
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

      {!isLoading && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn xóa{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {deleteTarget?.name}
            </span>
            ? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
              className="flex-1"
            >
              Xóa
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


