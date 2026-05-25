import { useState, useRef, useEffect } from "react";
import {
  useNavigate,
  useParams,
  Link,
  useSearchParams,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, ArrowLeft, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { productService } from "@/services/product.service";
import { useCategoryTree } from "@/hooks/useCategories";
import { flattenTree } from "@/services/category.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const productSchema = z.object({
  name: z.string().min(2, "Tên product là bắt buộc").max(150),
  description: z.string().max(2000).optional(),
  price: z.coerce.number().min(0, "Giá phải >= 0"),
  stock: z.coerce.number().min(0, "Tồn kho phải >= 0"),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const preselectedCategoryId = searchParams.get("categoryId") ?? "";
  const returnTo =
    searchParams.get("returnTo") ??
    (preselectedCategoryId
      ? `/admin/categories?categoryId=${encodeURIComponent(preselectedCategoryId)}`
      : "/admin/categories");

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["products", id],
    queryFn: () => productService.getProduct(id!),
    enabled: isEdit,
  });

  const { data: categoryTree = [] } = useCategoryTree();
  const categories = flattenTree(categoryTree);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: preselectedCategoryId,
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId ?? preselectedCategoryId,
        isActive: product.isActive,
      });
      setImagePreview(product.imageUrl);
    }
  }, [preselectedCategoryId, product, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!isEdit && !imageFile) {
      alert("Vui lòng chọn ảnh product");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    if (data.description) formData.append("description", data.description);
    formData.append("price", String(data.price));
    formData.append("stock", String(data.stock));
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    formData.append("isActive", String(data.isActive ?? true));
    if (imageFile) formData.append("image", imageFile);

    if (isEdit) {
      await updateMutation.mutateAsync({ id: id!, formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    navigate(returnTo);
  };

  if (isEdit && isLoadingProduct) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={returnTo}>
          <button className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Chỉnh sửa Product" : "Thêm Product mới"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Image upload */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-4 font-semibold text-gray-900 dark:text-white">
            Ảnh Product
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-48 w-48 rounded-2xl object-cover shadow-md"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-48 w-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-amber-600 dark:hover:bg-amber-900/20"
            >
              <ImagePlus size={28} />
              <span className="text-xs font-medium">Tải ảnh lên</span>
            </button>
          )}
          {imagePreview && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 text-sm text-amber-500 hover:underline"
            >
              Đổi ảnh
            </button>
          )}
        </div>

        {/* Product details */}
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="font-semibold text-gray-900 dark:text-white">
            Thông tin Product
          </p>

          <Input
            label="Tên Product *"
            error={errors.name?.message}
            {...register("name")}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Mô tả product..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Giá (₫) *"
              type="number"
              min={0}
              error={errors.price?.message}
              {...register("price")}
            />
            <Input
              label="Tồn kho *"
              type="number"
              min={0}
              error={errors.stock?.message}
              {...register("stock")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục
            </label>
            <select
              {...register("categoryId")}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">— Chưa chọn danh mục —</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {"  ".repeat(cat.depth)}
                  {cat.depth > 0 ? "└ " : ""}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                {...register("isActive")}
                defaultChecked
                className="sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-amber-500 dark:bg-gray-700" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Đang hoạt động (hiển thị trên cửa hàng)
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            className="flex-1"
          >
            {isEdit ? "Cập nhật Product" : "Tạo Product"}
          </Button>
          <Link to={returnTo}>
            <Button type="button" variant="outline" size="lg">
              Hủy
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}


