import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { CategoryTabs } from "@/components/admin/CategoryTabs";
import { CategoryTree } from "@/components/admin/CategoryTree";
import { ProductFilters } from "@/components/admin/ProductFilters";
import { ProductTable } from "@/components/admin/ProductTable";
import { CategoryForm } from "@/components/CategoryForm/CategoryForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { CategoryNode, Category, CategoryFormPayload, Product } from "@/types";
import { flattenTree } from "@/services/category.service";

const DEFAULT_SORT = "createdAt:desc";
const getCategoryId = (category: Pick<Category, "_id" | "id">) =>
  category._id ?? category.id;

export default function AdminCategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("categoryId") ?? "";

  const {
    data: tree = [],
    isLoading,
    isFetching: isFetchingTree,
    refetch,
  } = useCategoryTree();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const deleteProductMutation = useDeleteProduct();

  const [selectedCategoryId, setSelectedCategoryId] =
    useState(categoryIdFromUrl);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [sortValue, setSortValue] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<Product | null>(null);

  const debouncedProductSearch = useDebounce(productSearch, 350);
  const flatList = useMemo(() => flattenTree(tree), [tree]);
  const selectedCategory =
    flatList.find(
      (category) => getCategoryId(category) === selectedCategoryId,
    ) ?? null;
  const [sortBy, sortOrder] = sortValue.split(":") as [
    "createdAt" | "updatedAt" | "name" | "price",
    "asc" | "desc",
  ];

  const {
    data: productData,
    isLoading: isLoadingProducts,
    isFetching: isFetchingProducts,
    refetch: refetchProducts,
  } = useProducts(
    {
      page,
      limit: 10,
      keyword: debouncedProductSearch || undefined,
      categoryId: selectedCategoryId || undefined,
      sortBy,
      sortOrder,
    },
    { enabled: !!selectedCategoryId },
  );

  const products = selectedCategoryId ? (productData?.items ?? []) : [];
  const totalProducts = selectedCategoryId
    ? (productData?.meta?.total ?? 0)
    : 0;
  const totalPages = selectedCategoryId
    ? (productData?.meta?.totalPages ?? 1)
    : 1;

  const syncCategoryToUrl = (categoryId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (categoryId) {
      nextParams.set("categoryId", categoryId);
    } else {
      nextParams.delete("categoryId");
    }
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    setSelectedCategoryId((prev) =>
      prev === categoryIdFromUrl ? prev : categoryIdFromUrl,
    );
  }, [categoryIdFromUrl]);

  useEffect(() => {
    if (!flatList.length) return;
    if (selectedCategoryId && selectedCategory) return;

    const fallbackCategoryId = getCategoryId(flatList[0]);
    setSelectedCategoryId(fallbackCategoryId);

    if (categoryIdFromUrl !== fallbackCategoryId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("categoryId", fallbackCategoryId);
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    categoryIdFromUrl,
    flatList,
    searchParams,
    selectedCategory,
    selectedCategoryId,
    setSearchParams,
  ]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategoryId, debouncedProductSearch, sortValue]);

  useEffect(() => {
    if (selectedCategoryId && !selectedCategory) {
      const fallbackCategoryId = flatList.length
        ? getCategoryId(flatList[0])
        : "";
      setSelectedCategoryId(fallbackCategoryId);
      syncCategoryToUrl(fallbackCategoryId);
    }
  }, [flatList, selectedCategory, selectedCategoryId]);

  const openCreate = (parentId?: string) => {
    setEditTarget(null);
    setDefaultParentId(parentId ?? null);
    setFormOpen(true);
  };

  const openEdit = (node: CategoryNode) => {
    setEditTarget(node as Category);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleSubmit = async (payload: CategoryFormPayload) => {
    if (editTarget) {
      await updateMutation.mutateAsync({ id: editTarget._id, payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = getCategoryId(deleteTarget);
    await deleteMutation.mutateAsync(deleteTarget._id);
    if (selectedCategoryId === targetId) {
      setSelectedCategoryId("");
      syncCategoryToUrl("");
    }
    setDeleteTarget(null);
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    await deleteProductMutation.mutateAsync(deleteProductTarget._id);
    setDeleteProductTarget(null);
  };

  const handleSelectCategory = (node: Category) => {
    const categoryId = getCategoryId(node);
    setSelectedCategoryId(categoryId);
    setPage(1);
    syncCategoryToUrl(categoryId);
  };

  const handleClearProductFilters = () => {
    setProductSearch("");
    setSortValue(DEFAULT_SORT);
    setPage(1);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const returnTo = selectedCategoryId
    ? `/admin/categories?categoryId=${encodeURIComponent(selectedCategoryId)}`
    : "/admin/categories";
  const addProductHref = selectedCategoryId
    ? `/admin/products/new?categoryId=${encodeURIComponent(
        selectedCategoryId,
      )}&returnTo=${encodeURIComponent(returnTo)}`
    : "/admin/products/new";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Product
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Không gian quản lý product theo danh mục, phù hợp catalog lớn.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">Quy trình theo danh mục</Badge>
            <Badge variant="outline">
              {flatList.length} danh mục được cache qua React Query
            </Badge>
          </div>
        </div>
        {selectedCategory && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refetchProducts()}
              disabled={isFetchingProducts}
            >
              <RefreshCw
                size={15}
                className={isFetchingProducts ? "animate-spin" : ""}
              />
              Làm mới product
            </Button>
            <Button
              variant="outline"
              onClick={() => openCreate(getCategoryId(selectedCategory))}
            >
              <Plus size={16} /> Thêm danh mục con
            </Button>
          </div>
        )}
      </div>

      <CategoryTabs
        categories={flatList}
        selectedCategoryId={selectedCategoryId}
        onSelect={handleSelectCategory}
      />

      <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
        <CategoryTree
          nodes={tree}
          totalCount={flatList.length}
          isLoading={isLoading}
          isRefreshing={isFetchingTree}
          search={categorySearch}
          selectedCategoryId={selectedCategoryId}
          onSearchChange={setCategorySearch}
          onRefresh={() => refetch()}
          onCreateRoot={() => openCreate()}
          onSelect={handleSelectCategory}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onAddChild={(parentId) => openCreate(parentId)}
        />

        <div className="space-y-4">
          {selectedCategory ? (
            <>
              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <FolderOpen size={18} className="text-amber-500" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedCategory.name}
                      </h2>
                      <Badge variant="outline">
                        Cấp {selectedCategory.level}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Đường dẫn: /{selectedCategory.path}
                    </p>
                  </div>
                </div>
              </div>

              <ProductFilters
                selectedCategoryName={selectedCategory.name}
                total={totalProducts}
                search={productSearch}
                sortValue={sortValue}
                addProductHref={addProductHref}
                isFetching={isFetchingProducts}
                onSearchChange={setProductSearch}
                onSortChange={setSortValue}
                onClearFilters={handleClearProductFilters}
              />

              <ProductTable
                products={products}
                isLoading={isLoadingProducts}
                categoryName={selectedCategory.name}
                selectedCategoryId={selectedCategoryId}
                returnTo={returnTo}
                onDelete={setDeleteProductTarget}
              />

              {!isLoadingProducts && totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="max-w-md space-y-3">
                <p className="text-5xl">🌿</p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chưa có danh mục nào
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tạo category đầu tiên để bắt đầu quản lý product theo từng tab
                  loại sản phẩm.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTarget(null);
        }}
        title={editTarget ? `Chỉnh sửa: ${editTarget.name}` : "Tạo category"}
        size="md"
      >
        <CategoryForm
          initial={editTarget}
          defaultParentId={defaultParentId}
          tree={tree}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          isLoading={isMutating}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xóa{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {deleteTarget?.name}
            </span>
            ?{" "}
            {(deleteTarget?.children?.length ?? 0) > 0 && (
              <span className="text-amber-600">
                Category này có {deleteTarget?.children?.length} danh mục con.
              </span>
            )}
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

      <Modal
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        title="Xóa Product"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Xóa
            <span className="mx-1 font-semibold text-gray-900 dark:text-white">
              {deleteProductTarget?.name}
            </span>
            khỏi danh mục này? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleDeleteProduct}
              loading={deleteProductMutation.isPending}
              className="flex-1"
            >
              Xóa
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteProductTarget(null)}
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


